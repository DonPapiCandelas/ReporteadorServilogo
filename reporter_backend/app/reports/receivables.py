# app/reports/receivables.py
import pyodbc
import datetime
from typing import List, Dict, Any, Annotated
from collections import defaultdict
from fastapi import Depends, HTTPException, APIRouter # <-- ¡APIRouter!

# Importamos nuestros conectores y esquemas
from ..sql_server_conn import get_sql_server_conn, fetch_all
from .report_schemas import ReceivableEntry, AgingSummary, CurrencyGroup, ReportFilters, ReceivablesReportData
from ..schemas import CustomerFilterItem
from ..security import CurrentUser # ¡Importamos el guardia de seguridad!

# --- ¡NUEVO! Creamos un Router ---
router = APIRouter(tags=["Reports"])

# Alias para la conexión a SQL Server
SqlServerConnDep = Annotated[pyodbc.Connection, Depends(get_sql_server_conn)]

# --- Lógica de SQL (Directa de tu script) ---
def _get_sql_base() -> str:
    # ¡Mucho más limpio! Ahora toda la lógica vive en SQL.
    return "SELECT * FROM zzReporteSaldoDocuments"

def fetch_report_data(
    conn: pyodbc.Connection, 
    as_of: datetime.date, 
    customer_id: int | None
) -> List[pyodbc.Row]:

    sql = _get_sql_base() # Esto ahora es "SELECT * FROM zzReporteSaldoDocuments"
    params = []

    # ¡IMPORTANTE! Añadimos 'WHERE' por primera vez
    # Usamos los nombres de columna de tu Vista
    sql += " WHERE InvoiceDate < DATEADD(day,1,?) "
    params.append(as_of)

    if customer_id:
        # Asumiendo que tu Vista expone la columna 'BusinessEntityID'
        # Si no lo hace, ¡asegúrate de añadirla a tu Vista!
        sql += " AND BusinessEntityID = ? " 
        params.append(customer_id)

    sql += " ORDER BY Cliente, InvoiceDate, Folio;"

    return fetch_all(conn, sql, params)

# --- Lógica de Procesamiento (Directa de tu script) ---
def _calculate_days_since(as_of: datetime.date, arrival: datetime.date) -> int:
    # ... (idéntico) ...
    if not isinstance(as_of, datetime.date) or not isinstance(arrival, datetime.date):
        return 0
    try:
        delta = as_of - arrival
        return delta.days
    except Exception:
        return 0

def process_report_data(
    raw_data: List[pyodbc.Row], 
    as_of: datetime.date
) -> Dict[str, CurrencyGroup]:
    # ... (idéntico) ...
    processed_entries: List[ReceivableEntry] = []
    for row in raw_data:
        entry = ReceivableEntry(
            customer_name=row.Cliente,
            module=row.Modulo or "",
            invoice_date=row.InvoiceDate,
            folio=row.Folio,
            arrival_date=row.ArrivalDate,
            due_date=row.Vencimiento,
            reference=row.Referencia or "",
            currency=row.Moneda or "",
            fx_rate=float(row.TC or 0.0),
            subtotal=float(row.SubTotal or 0.0),
            total=float(row.Total or 0.0),
            paid=float(row.Pagado or 0.0),
            balance=float(row.Saldo or 0.0),
            days_since=0,
            aging_bucket="N/A"
        )
        entry.days_since = _calculate_days_since(as_of, entry.arrival_date)
        d = entry.days_since
        if d <= 0: entry.aging_bucket = "Not Due"
        elif 0 <= d <= 21: entry.aging_bucket = "0-21"
        elif 22 <= d <= 30: entry.aging_bucket = "22-30"
        elif 31 <= d <= 45: entry.aging_bucket = "31-45"
        else: entry.aging_bucket = "45+"
        processed_entries.append(entry)
    
    final_data: Dict[str, CurrencyGroup] = {}
    currencies = sorted({e.currency for e in processed_entries if e.currency})
    for cur in currencies:
        cur_entries = [e for e in processed_entries if e.currency == cur]
        cur_totals = {
            "total": sum(e.total for e in cur_entries),
            "paid": sum(e.paid for e in cur_entries),
            "balance": sum(e.balance for e in cur_entries),
        }
        aging_by_customer = defaultdict(AgingSummary)
        for e in cur_entries:
            agg = aging_by_customer[e.customer_name]
            saldo = e.balance
            d = e.days_since
            agg.total_balance += saldo
            if d <= 0: agg.not_yet_due += saldo
            else: agg.overdue += saldo
            if 0 <= d <= 21: agg.bucket_0_21 += saldo
            elif 22 <= d <= 30: agg.bucket_22_30 += saldo
            elif 31 <= d <= 45: agg.bucket_31_45 += saldo
            elif d > 45: agg.bucket_45_plus += saldo
        final_data[cur] = CurrencyGroup(
            currency=cur,
            entries=cur_entries,
            totals=cur_totals,
            aging_summary=dict(aging_by_customer)
        )
    return final_data

# --- ¡NUEVO! ENDPOINTS DEFINIDOS CON DECORADORES ---

@router.get("/filters/customers", response_model=List[CustomerFilterItem])
def get_customer_list(
    current_user: CurrentUser,
    sql_conn: SqlServerConnDep
) -> List[CustomerFilterItem]:
    query = "SELECT BusinessEntityID AS id, BusinessEntity AS name FROM dbo.vwLBSCustomerList WHERE ISNULL([Deleted],0)=0 ORDER BY BusinessEntity;"
    try:
        rows = fetch_all(sql_conn, query)
        customers = [{"id": row.id, "name": row.name} for row in rows]
        return customers
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/receivables-preview", response_model=ReceivablesReportData)
def run_receivables_report(
    filters: ReportFilters,
    current_user: CurrentUser,
    sql_conn: SqlServerConnDep
) -> ReceivablesReportData:
    try:
        raw_data = fetch_report_data(
            conn=sql_conn, as_of=filters.as_of, customer_id=filters.customer_id
        )
        if not raw_data:
            raise HTTPException(status_code=404, detail="No data found for the selected filters.")
        
        processed_data = process_report_data(
            raw_data=raw_data, as_of=filters.as_of
        )
        return ReceivablesReportData(data_by_currency=processed_data)
    except Exception as e:
        raise e

# --- Importaciones para descarga ---
from starlette.responses import StreamingResponse
import io
from . import report_builder

@router.post("/receivables-download-excel")
def download_receivables_report_excel(
    filters: ReportFilters,
    current_user: CurrentUser,
    sql_conn: SqlServerConnDep
):
    try:
        raw_data = fetch_report_data(conn=sql_conn, as_of=filters.as_of, customer_id=filters.customer_id)
        if not raw_data:
            raise HTTPException(status_code=404, detail="No data found for selected filters.")
        processed_data = process_report_data(raw_data=raw_data, as_of=filters.as_of)
        excel_file_stream = report_builder.create_excel_report(data=processed_data, logo_path="", filters=filters.model_dump())
        date_str = filters.as_of.strftime('%Y%m%d')
        filename = f"Accounts_Receivable_Aging_{date_str}.xlsx"
        return StreamingResponse(
            content=excel_file_stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=\"{filename}\""}
        )
    except Exception as e:
        print(f"Error building Excel: {e}")
        raise e

@router.post("/receivables-download-pdf")
def download_receivables_report_pdf(
    filters: ReportFilters,
    current_user: CurrentUser,
    sql_conn: SqlServerConnDep
):
    try:
        raw_data = fetch_report_data(conn=sql_conn, as_of=filters.as_of, customer_id=filters.customer_id)
        if not raw_data:
            raise HTTPException(status_code=404, detail="No data found for selected filters.")
        processed_data = process_report_data(raw_data=raw_data, as_of=filters.as_of)
        pdf_file_stream = report_builder.create_pdf_report(data=processed_data, logo_path="", filters=filters.model_dump())
        date_str = filters.as_of.strftime('%Y%m%d')
        filename = f"Accounts_Receivable_Aging_{date_str}.pdf"
        return StreamingResponse(
            content=pdf_file_stream,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=\"{filename}\""}
        )
    except Exception as e:
        print(f"Error building PDF: {e}")
        raise e

@router.post("/receivables-download-html")
def download_receivables_report_html(
    filters: ReportFilters,
    current_user: CurrentUser,
    sql_conn: SqlServerConnDep
):
    try:
        raw_data = fetch_report_data(conn=sql_conn, as_of=filters.as_of, customer_id=filters.customer_id)
        if not raw_data:
            raise HTTPException(status_code=404, detail="No data found for selected filters.")
        processed_data = process_report_data(raw_data=raw_data, as_of=filters.as_of)
        html_file_stream = report_builder.create_html_report(data=processed_data, logo_path="", filters=filters.model_dump())
        date_str = filters.as_of.strftime('%Y%m%d')
        filename = f"Accounts_Receivable_Aging_{date_str}.html"
        return StreamingResponse(
            content=html_file_stream,
            media_type="text/html",
            headers={"Content-Disposition": f"attachment; filename=\"{filename}\""}
        )
    except Exception as e:
        print(f"Error building HTML: {e}")
        raise e