import io
import datetime
from typing import Dict
from app.reports.report_schemas import ReceivableEntry, CurrencyGroup, AgingSummary, CustomerCreditInfo
from app.reports.report_builder import create_excel_report, create_pdf_report, create_html_report

def main():
    # Mock Data
    entry1 = ReceivableEntry(
        customer_name="Test Customer",
        module="Invoice",
        invoice_date=datetime.date(2023, 1, 1),
        folio="INV-001",
        arrival_date=datetime.date(2023, 1, 5),
        due_date=datetime.date(2023, 2, 5),
        reference="REF-001",
        currency="USD",
        fx_rate=1.0,
        subtotal=100.0,
        total=116.0,
        paid=0.0,
        balance=116.0,
        po_balance=0.0,
        real_balance=116.0,
        days_since=30,
        aging_bucket="22-30"
    )
    
    entry2 = ReceivableEntry(
        customer_name="Test Customer",
        module="Sales Order",
        invoice_date=datetime.date(2023, 2, 1),
        folio="SO-001",
        arrival_date=datetime.date(2023, 2, 5),
        due_date=datetime.date(2023, 3, 5),
        reference="REF-002",
        currency="USD",
        fx_rate=1.0,
        subtotal=200.0,
        total=232.0,
        paid=0.0,
        balance=232.0,
        po_balance=232.0,
        real_balance=0.0,
        days_since=10,
        aging_bucket="0-21"
    )

    entries = [entry1, entry2]
    
    totals = {
        "total": sum(e.total for e in entries),
        "paid": sum(e.paid for e in entries),
        "balance": sum(e.balance for e in entries),
        "po_balance": sum(e.po_balance for e in entries),
        "real_balance": sum(e.real_balance for e in entries),
    }

    aging_summary = {
        "Test Customer": AgingSummary(
            total_balance=totals["balance"],
            bucket_0_21=232.0,
            bucket_22_30=116.0
        )
    }

    data: Dict[str, CurrencyGroup] = {
        "USD": CurrencyGroup(
            currency="USD",
            entries=entries,
            totals=totals,
            aging_summary=aging_summary
        )
    }

    filters = {
        "as_of": datetime.date(2023, 3, 1),
        "customer_name": "Test Customer",
        "customer_id": 123 
    }

    # Mock Credit Info
    credit_info = CustomerCreditInfo(
        credit_limit=50000.00,
        payment_terms="Net 30",
        currency="USD"
    )

    # 1. Generate Excel
    print("Generating Excel...")
    excel_io = create_excel_report(data, "", filters, credit_info=credit_info)
    with open("test_report.xlsx", "wb") as f:
        f.write(excel_io.getvalue())
    print("Excel generated: test_report.xlsx")

    # 2. Generate PDF
    print("Generating PDF...")
    pdf_io = create_pdf_report(data, "", filters, credit_info=credit_info)
    with open("test_report.pdf", "wb") as f:
        f.write(pdf_io.getvalue())
    print("PDF generated: test_report.pdf")

    # 3. Generate HTML
    print("Generating HTML...")
    html_io = create_html_report(data, "", filters, credit_info=credit_info)
    with open("test_report.html", "wb") as f:
        f.write(html_io.getvalue())
    print("HTML generated: test_report.html")

if __name__ == "__main__":
    main()
