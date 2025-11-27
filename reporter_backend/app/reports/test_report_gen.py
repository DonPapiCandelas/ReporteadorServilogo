
import sys
import os
import datetime
from decimal import Decimal

# Add parent directory to path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from reporter_backend.app.reports.report_builder import create_excel_report, create_pdf_report, create_html_report
from reporter_backend.app.reports.report_schemas import CurrencyGroup, AgingSummary, ReceivableEntry

def test_reports():
    # Dummy Data
    entry = ReceivableEntry(
        customer_name="Test Customer",
        module="Invoice",
        invoice_date=datetime.date.today(),
        folio="123",
        arrival_date=datetime.date.today(),
        due_date=datetime.date.today(),
        reference="REF123",
        currency="USD",
        fx_rate=1.0,
        subtotal=100.0,
        total=116.0,
        paid=0.0,
        balance=116.0,
        days_since=10,
        aging_bucket="0-21"
    )
    
    aging = AgingSummary(
        total_balance=116.0,
        not_yet_due=0.0,
        overdue=116.0,
        bucket_0_21=116.0
    )
    
    group = CurrencyGroup(
        currency="USD",
        entries=[entry],
        totals={"total": 116.0, "paid": 0.0, "balance": 116.0},
        aging_summary={"Test Customer": aging}
    )
    
    data = {"USD": group}
    filters = {
        "as_of": datetime.date.today(),
        "customer_name": "Test Customer",
        "customer_id": 1 # Simulate single customer
    }
    
    print("Testing Excel Report (Single Customer)...")
    try:
        excel_buffer = create_excel_report(data, "", filters)
        print(f"Excel Report Generated: {len(excel_buffer.getvalue())} bytes")
    except Exception as e:
        print(f"Excel Report Failed: {e}")
        import traceback
        traceback.print_exc()

    print("\nTesting Excel Report (Multi Customer)...")
    filters_multi = filters.copy()
    filters_multi["customer_id"] = None
    try:
        excel_buffer_multi = create_excel_report(data, "", filters_multi)
        print(f"Excel Report Multi Generated: {len(excel_buffer_multi.getvalue())} bytes")
    except Exception as e:
        print(f"Excel Report Multi Failed: {e}")
        import traceback
        traceback.print_exc()

    print("\nTesting PDF Report...")
    try:
        pdf_buffer = create_pdf_report(data, "", filters)
        print(f"PDF Report Generated: {len(pdf_buffer.getvalue())} bytes")
    except Exception as e:
        print(f"PDF Report Failed: {e}")
        import traceback
        traceback.print_exc()

    print("\nTesting HTML Report...")
    try:
        html_buffer = create_html_report(data, "", filters)
        print(f"HTML Report Generated: {len(html_buffer.getvalue())} bytes")
    except Exception as e:
        print(f"HTML Report Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_reports()
