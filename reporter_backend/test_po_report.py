
import sys
import os
import datetime
# Add the parent directory to sys.path to allow importing app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.reports.receivables import process_report_data
from app.reports.report_schemas import ReceivableEntry, ReportFilters
from app.reports import report_builder
from typing import List
from collections import namedtuple

# Mock pyodbc.Row
Row = namedtuple('Row', ['Cliente', 'Modulo', 'InvoiceDate', 'Folio', 'ArrivalDate', 'Vencimiento', 'Referencia', 'Moneda', 'TC', 'SubTotal', 'Total', 'Pagado', 'Saldo', 'PO'])

def test_report_generation():
    # Create mock data
    mock_data = [
        Row(
            Cliente="Test Customer",
            Modulo="Invoice",
            InvoiceDate=datetime.date(2024, 1, 1),
            Folio="12345",
            ArrivalDate=datetime.date(2024, 1, 5),
            Vencimiento=datetime.date(2024, 2, 1),
            Referencia="REF-001",
            Moneda="USD",
            TC=1.0,
            SubTotal=100.0,
            Total=116.0,
            Pagado=0.0,
            Saldo=116.0,
            PO="PO-9999"
        )
    ]

    as_of = datetime.date(2024, 1, 31)
    
    print("Processing report data...")
    processed_data = process_report_data(mock_data, as_of)
    
    # Verify PO is in processed data
    entries = processed_data["USD"].entries
    if entries[0].po == "PO-9999":
        print("SUCCESS: PO field correctly mapped in processed data.")
    else:
        print(f"FAILURE: PO field not mapped correctly. Got: {entries[0].po}")

    filters = {
        "as_of": as_of,
        "customer_name": "Test Customer",
        "customer_id": 1
    }

    print("Generating Excel report...")
    try:
        excel_io = report_builder.create_excel_report(processed_data, "", filters)
        with open("test_report_po.xlsx", "wb") as f:
            f.write(excel_io.getvalue())
        print("SUCCESS: Excel report generated.")
    except Exception as e:
        print(f"FAILURE: Excel report generation failed: {e}")

    print("Generating PDF report...")
    try:
        pdf_io = report_builder.create_pdf_report(processed_data, "", filters)
        with open("test_report_po.pdf", "wb") as f:
            f.write(pdf_io.getvalue())
        print("SUCCESS: PDF report generated.")
    except Exception as e:
        print(f"FAILURE: PDF report generation failed: {e}")

    print("Generating HTML report...")
    try:
        html_io = report_builder.create_html_report(processed_data, "", filters)
        with open("test_report_po.html", "wb") as f:
            f.write(html_io.getvalue())
        print("SUCCESS: HTML report generated.")
    except Exception as e:
        print(f"FAILURE: HTML report generation failed: {e}")

if __name__ == "__main__":
    test_report_generation()
