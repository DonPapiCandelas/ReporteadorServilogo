# app/reports/receivables.py
import pyodbc
import datetime
from typing import List, Dict, Any, Annotated
from collections import defaultdict
from fastapi import Depends, HTTPException, APIRouter

# Importamos nuestros conectores y esquemas
from ..sql_server_conn import get_sql_server_conn, fetch_all
from .report_schemas import ReceivableEntry, AgingSummary, CurrencyGroup, ReportFilters, ReceivablesReportData, CustomerCreditInfo
from ..schemas import CustomerFilterItem
from ..security import CurrentUser

# --- ¡NUEVO! Creamos un Router ---
router = APIRouter(tags=["Reports"])

# Alias para la conexión a SQL Server
SqlServerConnDep = Annotated[pyodbc.Connection, Depends(get_sql_server_conn)]

# --- Lógica de SQL (Directa de tu script) ---
def _get_sql_base() -> str:
    """
    Genera la consulta base de SQL Server que extrae los saldos vencidos y por vencer de los clientes.
    Consta de dos CTE (Common Table Expressions) y una consulta principal:
    
    1. StudentCredit: Obtiene los días de crédito predeterminados del cliente buscando el plazo máximo 
       asociado a sus términos de pago (desde engPaymentTerm y engPaymentTermDetail).
    2. DocumentTerm: Obtiene los días de crédito específicos aplicados al documento particular (factura/nota).
       Esto es útil por si a un documento se le dio un crédito distinto al predeterminado del cliente.
    
    Consulta principal:
    Realiza la lectura de la vista zzReporteSaldoDocuments y cruza con las condiciones de crédito.
    El campo vital 'Vencimiento' se calcula sumando la fecha de llegada (ArrivalDate) más los días de crédito.
    Tiene mayor prioridad el crédito específico del documento (DocCreditDays) sobre el predeterminado (MaxCreditDays).
    """
    return """
        WITH StudentCredit AS (
            SELECT 
                pt.PaymentTermID,
                pt.PaymentTermName,
                MAX(ptd.PaymentPeriod + ptd.PaymentUnit) as MaxCreditDays
            FROM dbo.engPaymentTerm pt
            JOIN dbo.engPaymentTermDetail ptd ON pt.PaymentTermID = ptd.PaymentTermID
            GROUP BY pt.PaymentTermID, pt.PaymentTermName
        ),
        DocumentTerm AS (
             SELECT 
                doc.BusinessEntityID,
                doc.Folio,
                MAX(ptd.PaymentUnit) as DocCreditDays,
                MAX(pt.PaymentTermName) as DocTermName
             FROM dbo.docDocument doc
             JOIN dbo.engPaymentTerm pt ON doc.PaymentTermID = pt.PaymentTermID
             JOIN dbo.engPaymentTermDetail ptd ON pt.PaymentTermID = ptd.PaymentTermID
             GROUP BY doc.BusinessEntityID, doc.Folio
        )
        SELECT 
            d.Cliente, 
            d.BusinessEntityID, 
            d.Modulo, 
            d.InvoiceDate, 
            CAST(d.Folio AS varchar(50)) AS Folio, 
            d.ArrivalDate, 
            -- Nueva Lógica: Fecha de Llegada + Días de Crédito. 
            -- Prioridad: Término específico del documento > Término por defecto del cliente
            DATEADD(day, ISNULL(dt.DocCreditDays, ISNULL(sc.MaxCreditDays, 0)), ISNULL(d.ArrivalDate, d.InvoiceDate)) AS Vencimiento,
            d.Referencia, 
            CAST(d.PO AS varchar(50)) AS PO, 
            d.Moneda, 
            d.TC, 
            d.SubTotal, 
            d.Total, 
            d.Pagado, 
            d.Saldo,
            ISNULL(dt.DocTermName, sc.PaymentTermName) AS CreditDaysLabel
        FROM zzReporteSaldoDocuments d
        LEFT JOIN dbo.orgCustomer c ON d.BusinessEntityID = c.BusinessEntityID AND ISNULL(c.DeletedBy, 0) = 0
        LEFT JOIN StudentCredit sc ON c.PaymentTermID = sc.PaymentTermID
        LEFT JOIN DocumentTerm dt ON d.BusinessEntityID = dt.BusinessEntityID AND d.Folio = dt.Folio
    """

def fetch_report_data(
    conn: pyodbc.Connection, 
    as_of: datetime.date, 
    customer_id: int | None,
    start_date: datetime.date | None = None,
    end_date: datetime.date | None = None,
    filter_mode: str = "to_date"
) -> List[pyodbc.Row]:

    sql = _get_sql_base()
    params = []

    # "basado en la fecha de Arrival Date"
    sql += " WHERE 1=1 "

    if filter_mode == "date_range" or filter_mode == "current_month":
        if start_date:
            sql += " AND d.ArrivalDate >= ? "
            params.append(start_date)
        if end_date:
            sql += " AND d.ArrivalDate <= ? "
            params.append(end_date)
    else:
        # "to_date" or default (Desde el inicio hasta la fecha X)
        # Use end_date if present, else as_of
        cutoff = end_date if end_date else as_of
        sql += " AND d.ArrivalDate <= ? "
        params.append(cutoff)

    if customer_id:
        sql += " AND d.BusinessEntityID = ? " 
        params.append(customer_id)

    sql += " ORDER BY Cliente, InvoiceDate, Folio;"

    return fetch_all(conn, sql, params)

def fetch_customer_credit_info(conn: pyodbc.Connection, customer_id: int) -> CustomerCreditInfo | None:
    """
    Obtiene el límite de crédito predeterminado y el término de pago (en días o nombre)
    específico para un cliente. Esta información aparecerá en el encabezado del reporte para referencia.
    Filtra los clientes eliminados usando ISNULL(c.DeletedBy, 0) = 0.
    """
    sql = """
        SELECT TOP 1 
            c.CreditLimit, 
            t.PaymentTermName,
            ISNULL(cr.Currency, 'MXN') AS Currency
        FROM dbo.orgCustomer c
        LEFT OUTER JOIN dbo.engPaymentTerm t ON c.PaymentTermID = t.PaymentTermID
        LEFT OUTER JOIN dbo.engRefCurrency cr ON c.CurrencyID = cr.CurrencyID
        WHERE c.BusinessEntityID = ? AND ISNULL(c.DeletedBy, 0) = 0
    """
    try:
        rows = fetch_all(conn, sql, [customer_id])
        if rows:
            row = rows[0]
            return CustomerCreditInfo(
                credit_limit=float(row.CreditLimit or 0.0),
                payment_terms=row.PaymentTermName or "N/A",
                currency=row.Currency
            )
    except Exception as e:
        print(f"Error fetching credit info: {e}")
    return None

# --- Lógica de Procesamiento (Directa de tu script) ---
def _calculate_days_since(as_of: datetime.date, arrival: datetime.date) -> int:
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
    """
    Procesa las filas crudas (raw data) extraídas de SQL.
    Realiza lo siguiente:
    1.  Mapea cada fila a un objeto ReceivableEntry.
    2.  Calcula los días transcurridos (`days_since`) que el saldo lleva como abierto basado en la fecha `as_of` objetivo.
    3.  Aplica el bucket de envejecimiento (Aging Bucket) según los días transcurridos: Not Due, 0-21, 22-30, 31-45, 45+.
    4.  Separa el saldo de Facturas (Real Balance) del saldo exclusivo de Pedidos (P.O. Balance).
    5.  Agrupa todo este resultado separando por tipo de 'Moneda'.
    """
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
            days_overdue=0,
            credit_days=row.CreditDaysLabel,
            aging_bucket="N/A",
            po=row.PO or ""
        )
        # Calculamos los días totales transcurridos y vencidos vs la fecha al día de hoy (o la fecha del reporte)
        entry.days_since = _calculate_days_since(as_of, entry.arrival_date)
        entry.days_overdue = _calculate_days_since(as_of, entry.due_date)
        
        # Calcular Balance de P.O. (Purchase Order/Pedidos) vs Balance Real (Facturas/Notas/Pagos)
        # Esto nos permite saber qué parte de la deuda es solo producto preventivo y qué de facturas timbradas.
        if entry.module == "Sales Order":
            entry.po_balance = entry.balance
            entry.real_balance = 0.0
        else:
            entry.po_balance = 0.0
            entry.real_balance = entry.balance

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
            "po_balance": sum(e.po_balance for e in cur_entries),
            "real_balance": sum(e.real_balance for e in cur_entries),
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

# --- Endpoints ---

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
    # current_user: CurrentUser,
    sql_conn: SqlServerConnDep
) -> ReceivablesReportData:
    try:
        raw_data = fetch_report_data(
            conn=sql_conn, 
            as_of=filters.as_of, 
            customer_id=filters.customer_id,
            start_date=filters.start_date,
            end_date=filters.end_date,
            filter_mode=filters.filter_mode
        )
        if not raw_data:
            raise HTTPException(status_code=404, detail="No data found for the selected filters.")
        
        processed_data = process_report_data(
            raw_data=raw_data, as_of=filters.as_of
        )
        
        credit_info = None
        if filters.customer_id:
            credit_info = fetch_customer_credit_info(sql_conn, filters.customer_id)
            
        return ReceivablesReportData(
            data_by_currency=processed_data,
            customer_credit_info=credit_info
        )
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
        raw_data = fetch_report_data(
            conn=sql_conn, 
            as_of=filters.as_of, 
            customer_id=filters.customer_id,
            start_date=filters.start_date,
            end_date=filters.end_date,
            filter_mode=filters.filter_mode
        )
        if not raw_data:
            raise HTTPException(status_code=404, detail="No data found for selected filters.")
        processed_data = process_report_data(raw_data=raw_data, as_of=filters.as_of)
        
        credit_info = None
        if filters.customer_id:
            credit_info = fetch_customer_credit_info(sql_conn, filters.customer_id)
            
        excel_file_stream = report_builder.create_excel_report(
            data=processed_data, 
            logo_path="", 
            filters=filters.model_dump(),
            credit_info=credit_info
        )
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
        raw_data = fetch_report_data(
            conn=sql_conn, 
            as_of=filters.as_of, 
            customer_id=filters.customer_id,
            start_date=filters.start_date,
            end_date=filters.end_date,
            filter_mode=filters.filter_mode
        )
        if not raw_data:
            raise HTTPException(status_code=404, detail="No data found for selected filters.")
        processed_data = process_report_data(raw_data=raw_data, as_of=filters.as_of)
        
        credit_info = None
        if filters.customer_id:
            credit_info = fetch_customer_credit_info(sql_conn, filters.customer_id)

        pdf_file_stream = report_builder.create_pdf_report(
            data=processed_data, 
            logo_path="", 
            filters=filters.model_dump(),
            credit_info=credit_info
        )
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
        raw_data = fetch_report_data(
            conn=sql_conn, 
            as_of=filters.as_of, 
            customer_id=filters.customer_id,
            start_date=filters.start_date,
            end_date=filters.end_date,
            filter_mode=filters.filter_mode
        )
        if not raw_data:
            raise HTTPException(status_code=404, detail="No data found for selected filters.")
        processed_data = process_report_data(raw_data=raw_data, as_of=filters.as_of)
        
        credit_info = None
        if filters.customer_id:
            credit_info = fetch_customer_credit_info(sql_conn, filters.customer_id)

        html_file_stream = report_builder.create_html_report(
            data=processed_data, 
            logo_path="", 
            filters=filters.model_dump(),
            credit_info=credit_info
        )
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