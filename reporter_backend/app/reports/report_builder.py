# app/reports/report_builder.py
import io
import datetime
import decimal
from typing import Dict, Any, List
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.drawing.image import Image as XLImage
from openpyxl.formatting.rule import CellIsRule
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, PageBreak, Spacer, Image as RLImage
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas as rl_canvas

# Importamos los esquemas que definimos
from .report_schemas import CurrencyGroup, AgingSummary

# --- Tus Helpers de Estilo Originales ---
THEME = {
    "primary": "2E86AB",
    "secondary": "A7C957",
    "head": "2E86AB",
    "bg_soft": "F8FAFC",
    "line": "D1D5DB",
    "ink": "1F2937",
    "total": "D1EFB5",
}

def fill(hex_):
    return PatternFill("solid", fgColor=hex_)

def border_all():
    edge = Side(style="thin", color=THEME["line"])
    return Border(left=edge, right=edge, top=edge, bottom=edge)

def set_col_widths(ws, widths):
    for i, w in enumerate(widths, start=1):
        ws.column_dimensions[chr(64 + i)].width = w

def insert_logo(ws, tl_cell, logo_path, max_w=170, max_h=42):
    # Por ahora, no implementamos el logo_path, pero dejamos la función
    pass
    # try:
    #     if not logo_path or not Path(logo_path).exists():
    #         return
    #     img = XLImage(logo_path)
    #     scale = min(max_w / img.width, max_h / img.height, 1.0)
    #     img.width = int(img.width * scale)
    #     img.height = int(img.height * scale)
    #     ws.add_image(img, tl_cell)
    # except Exception as e:
    #     logging.warning(f"No se pudo insertar el logo de Excel: {e}")

def _safe_excel_title(s: str) -> str:
    bad = '[]:*?/\\'
    for ch in bad:
        s = s.replace(ch, ' ')
    return (s[:31] or "Sheet").rstrip()

def fmt_date(v, out_fmt="%m/%d/%y"):
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.strftime(out_fmt)
    return str(v) if v is not None else ""

def _ordinal(n: int) -> str:
    if 10 <= n % 100 <= 20:
        suf = "th"
    else:
        suf = {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suf}"

def fmt_date_ordinal(d: datetime.date) -> str:
    if isinstance(d, datetime.datetime):
        d = d.date()
    return f"{d.strftime('%B')} {_ordinal(d.day)}, {d.year}"

def _rl_logo(logo_path, max_w=30 * mm, max_h=12 * mm):
    # Por ahora, no implementamos el logo_path
    return None

def _pdf_header_footer(canv: rl_canvas.Canvas, doc):
    canv.saveState()
    canv.setFont("Helvetica", 7)
    w, h = landscape(A4)
    canv.drawString(8 * mm, 8 * mm, f"Generado: {datetime.date.today():%Y-%m-%d}")
    canv.drawRightString(w - 8 * mm, 8 * mm, f"Página {doc.page}")
    canv.restoreState()

# --- La Lógica de 'build_excel' (Adaptada) ---

def create_excel_report(
    data: Dict[str, CurrencyGroup], 
    logo_path: str, # Aún no lo usamos, pero lo pasamos
    filters: dict
) -> io.BytesIO:
    """
    Toma los datos procesados y construye un archivo Excel EN MEMORIA.
    Devuelve un objeto io.BytesIO.
    """

    as_of = filters['as_of']
    customer_name = filters['customer_name']
    is_single_customer = filters.get('customer_id') is not None
    
    all_entries = [entry for group in data.values() for entry in group.entries]

    wb = Workbook()
    default_ws = wb.active
    wb.remove(default_ws)

    # ===== 1. Hojas por moneda (Currency Sheets) - PRIMERAS =====
    for cur, cur_group in data.items():
        cur_rows = cur_group.entries

        ws2 = wb.create_sheet(_safe_excel_title(f"CURRENCY {cur}"))
        insert_logo(ws2, "A1", logo_path)
        
        merge_end = "J1" if is_single_customer else "K1"
        merge_end_row2 = "J2" if is_single_customer else "K2"
        
        ws2.merge_cells(f"C1:{merge_end}")
        a1 = ws2["C1"]
        a1.value = f"Receivables Aging — {cur}"
        a1.font = Font(bold=True, size=16, color=THEME["primary"])
        a1.alignment = Alignment(horizontal="center")
        
        ws2.merge_cells(f"C2:{merge_end_row2}")
        a2 = ws2["C2"]
        a2.value = f"As Of: {as_of:%m/%d/%Y} • Customer: {customer_name}"
        a2.font = Font(color=THEME["ink"])
        a2.alignment = Alignment(horizontal="center")

        if is_single_customer:
            headers2 = [
                "REFERENCE", "DOCUMENT", "NO.", "INVOICE DATE", 
                "TOTAL AMOUNT", "ARRIVAL DATE", "PAYMENTS", "BALANCE", 
                "DUE DATE", "DAYS SINCE ARRIVAL"
            ]
        else:
            headers2 = [
                "CUSTOMER", "REFERENCE", "DOCUMENT", "NO.", "INVOICE DATE", 
                "TOTAL AMOUNT", "ARRIVAL DATE", "PAYMENTS", "BALANCE", 
                "DUE DATE", "DAYS SINCE ARRIVAL"
            ]

        for i, h in enumerate(headers2, start=1):
            c = ws2.cell(4, i, h)
            c.font = Font(bold=True, color="FFFFFF")
            c.alignment = Alignment(horizontal="center")
            c.fill = fill(THEME["head"])
            c.border = border_all()

        r0 = 5
        for idx, entry in enumerate(cur_rows, start=r0):
            if is_single_customer:
                out = [
                    entry.reference, entry.module, entry.folio, entry.invoice_date,
                    entry.total, entry.arrival_date, entry.paid, entry.balance,
                    entry.due_date, entry.days_since
                ]
            else:
                out = [
                    entry.customer_name, entry.reference, entry.module, entry.folio, entry.invoice_date,
                    entry.total, entry.arrival_date, entry.paid, entry.balance,
                    entry.due_date, entry.days_since
                ]
            
            for i, v in enumerate(out, start=1):
                if isinstance(v, (datetime.datetime, datetime.date)):
                    ws2.cell(idx, i).value = v
                elif isinstance(v, (int, float, decimal.Decimal)):
                    ws2.cell(idx, i).value = v
                else:
                    ws2.cell(idx, i).value = str(v) if v is not None else ""

        if cur_rows:
            last2 = r0 + len(cur_rows) - 1
            _apply_currency_sheet_formats_excel_custom(ws2, r0, last2, is_single_customer)
            
            if is_single_customer:
                widths = [30, 14, 8, 12, 16, 14, 16, 16, 14, 14]
            else:
                widths = [28, 30, 14, 8, 12, 16, 14, 16, 16, 14, 14]
            set_col_widths(ws2, widths)

    # ===== 2. Hojas Summary (Summary Sheets) - SEGUNDAS =====
    for cur, cur_group in data.items():
        ws3 = wb.create_sheet(_safe_excel_title(f"SUMMARY {cur}"))
        insert_logo(ws3, "A1", logo_path)
        ws3.merge_cells("C1:H1")
        s1 = ws3["C1"]
        s1.value = f"ACCOUNTS RECEIVABLE — SUMMARY ({cur})"
        s1.font = Font(bold=True, size=14, color=THEME["primary"])
        s1.alignment = Alignment(horizontal="center")
        ws3.merge_cells("C2:H2")
        s2 = ws3["C2"]
        s2.value = f"As Of: {as_of:%m/%d/%Y} • Customer: {customer_name}"
        s2.alignment = Alignment(horizontal="center")

        hdr = [
            "CUSTOMER", "TOTAL BALANCE", "NOT YET DUE", "OVERDUE",
            "0-21", "22-30", "31-45", "45+ DAYS",
        ]
        for i, h in enumerate(hdr, start=1):
            c = ws3.cell(3, i, h)
            c.font = Font(bold=True, color="FFFFFF")
            c.alignment = Alignment(horizontal="center")
            c.fill = fill(THEME["head"])
            c.border = border_all()

        r = 4
        for cust, agg in sorted(cur_group.aging_summary.items()):
            ws3.cell(r, 1).value = cust
            vals = [
                agg.total_balance, agg.not_yet_due, agg.overdue,
                agg.bucket_0_21, agg.bucket_22_30, agg.bucket_31_45, agg.bucket_45_plus
            ]
            for i, v in enumerate(vals, start=2):
                ws3.cell(r, i).value = v
            r += 1

        if r > 4:
            last3 = r - 1
            _apply_summary_formats_excel(ws3, 4, last3)
            set_col_widths(ws3, [30, 18, 18, 18, 12, 12, 12, 12])

    # ===== 3. Main Report - AL FINAL =====
    ws = wb.create_sheet("Main Report")
    
    for r in range(1, 6):
        for c in range(1, 15):
            ws.cell(r, c).fill = fill(THEME["bg_soft"])
    insert_logo(ws, "A1", logo_path)
    ws.merge_cells("C1:N2")
    t = ws["C1"]
    t.value = "ACCOUNTS RECEIVABLE AGING REPORT"
    t.font = Font(name="Segoe UI Semibold", size=18, color=THEME["primary"])
    t.alignment = Alignment(horizontal="center", vertical="center")
    ws["C4"].value = "AS OF:"
    ws["C4"].font = Font(bold=True)
    ws["D4"].value = as_of
    ws["D4"].number_format = "mmmm d, yyyy"
    ws["G4"].value = "CUSTOMER:"
    ws["G4"].font = Font(bold=True)
    ws["H4"].value = customer_name
    for a in ("C4", "D4", "G4", "H4"):
        ws[a].alignment = Alignment(horizontal="left", vertical="center")

    headers = [
        "CUSTOMER", "REFERENCE", "DOCUMENT", "INVOICE DATE", "NO.",
        "ARRIVAL DATE", "DUE DATE", "CURRENCY", "FX RATE", "TOTAL AMOUNT",
        "PAYMENTS", "BALANCE", "DAYS SINCE ARRIVAL",
    ]
    for i, h in enumerate(headers, start=1):
        c = ws.cell(6, i, h)
        c.font = Font(bold=True, color="FFFFFF")
        c.alignment = Alignment(horizontal="center", vertical="center")
        c.fill = fill(THEME["head"])
        c.border = border_all()

    start = 7
    for r, entry in enumerate(all_entries, start=start):
        out = [
            entry.customer_name, entry.reference, entry.module, entry.invoice_date,
            entry.folio, entry.arrival_date, entry.due_date, entry.currency,
            entry.fx_rate, entry.total, entry.paid, entry.balance, entry.days_since,
        ]
        for i, v in enumerate(out, start=1):
            if isinstance(v, (datetime.datetime, datetime.date)):
                ws.cell(r, i).value = v
            elif isinstance(v, (int, float, decimal.Decimal)):
                ws.cell(r, i).value = v
            else:
                ws.cell(r, i).value = str(v) if v is not None else ""

    last = start + len(all_entries) - 1 if all_entries else start
    if all_entries:
        _apply_main_report_formats_excel(ws, start, last)

    set_col_widths(ws, [28, 30, 14, 12, 8, 14, 14, 10, 10, 16, 16, 16, 14])

    if len(wb.sheetnames) > 0:
        wb.active = 0

    virtual_workbook = io.BytesIO()
    wb.save(virtual_workbook)
    virtual_workbook.seek(0)
    return virtual_workbook

# --- Helpers de formato de Excel ---

def _apply_main_report_formats_excel(ws, start, last):
    if start > last: return
    for row in range(start, last + 1):
        ws.cell(row, 4).number_format = "mm/dd/yyyy"
        ws.cell(row, 6).number_format = "mm/dd/yyyy"
        ws.cell(row, 7).number_format = "mm/dd/yyyy"
        ws.cell(row, 9).number_format = "0.0000"
        for col in (10, 11, 12):
            ws.cell(row, col).number_format = "$#,##0.00"
        ws.cell(row, 13).number_format = "0"
        ws.cell(row, 1).alignment = Alignment(horizontal="left")
        ws.cell(row, 2).alignment = Alignment(horizontal="left")
        for col in range(3, 14):
            ws.cell(row, col).alignment = Alignment(horizontal="center")
        for col in range(1, 14):
            ws.cell(row, col).border = border_all()
    tr = last + 1
    ws.merge_cells(f"A{tr}:I{tr}")
    ws.cell(tr, 1).value = "TOTALS:"
    ws.cell(tr, 1).alignment = Alignment(horizontal="right")
    for col in (10, 11, 12):
        ws.cell(tr, col).value = f"=SUM({chr(64 + col)}{start}:{chr(64 + col)}{last})"
        ws.cell(tr, col).number_format = "$#,##0.00"
        ws.cell(tr, col).font = Font(bold=True)
        ws.cell(tr, col).fill = fill(THEME["total"])
        ws.cell(tr, col).alignment = Alignment(horizontal="center")
        ws.cell(tr, col).border = border_all()
    ws.freeze_panes = "A7"
    ws.auto_filter.ref = f"A6:M{last}"
    overdue_fill = PatternFill("solid", fgColor="FDE68A")
    ws.conditional_formatting.add(
        f"M{start}:M{last}",
        CellIsRule(operator='greaterThan', formula=['45'], stopIfTrue=True, fill=overdue_fill)
    )

def _apply_currency_sheet_formats_excel_custom(ws2, r0, last2, is_single_customer):
    if r0 > last2: return
    
    if is_single_customer:
        date_cols = (4, 6, 9)
        money_cols = (5, 7, 8)
        int_cols = (10,)
        total_cols = (5, 7, 8)
        days_col = 10
        last_col = 10
        merge_range_end = 4
    else:
        date_cols = (5, 7, 10)
        money_cols = (6, 8, 9)
        int_cols = (11,)
        total_cols = (6, 8, 9)
        days_col = 11
        last_col = 11
        merge_range_end = 5

    for row in range(r0, last2 + 1):
        for col in date_cols:
            ws2.cell(row, col).number_format = "mm/dd/yyyy"
        for col in money_cols:
            ws2.cell(row, col).number_format = "$#,##0.00"
        for col in int_cols:
            ws2.cell(row, col).number_format = "0"
            
        ws2.cell(row, 1).alignment = Alignment(horizontal="left")
        if not is_single_customer:
            ws2.cell(row, 2).alignment = Alignment(horizontal="left")
        
        for col in range(1, last_col + 1):
            if col > (2 if not is_single_customer else 1):
                ws2.cell(row, col).alignment = Alignment(horizontal="center")
            ws2.cell(row, col).border = border_all()

    tr2 = last2 + 1
    merge_char = chr(64 + merge_range_end)
    ws2.merge_cells(f"A{tr2}:{merge_char}{tr2}")
    ws2.cell(tr2, 1).value = f"TOTALS ({ws2.title.split(' ', 1)[-1]}):"
    ws2.cell(tr2, 1).alignment = Alignment(horizontal="right")
    
    for col in total_cols:
        ws2.cell(tr2, col).value = f"=SUM({chr(64 + col)}{r0}:{chr(64 + col)}{last2})"
        ws2.cell(tr2, col).number_format = "$#,##0.00"
        ws2.cell(tr2, col).font = Font(bold=True)
        ws2.cell(tr2, col).fill = fill(THEME["total"])
        ws2.cell(tr2, col).alignment = Alignment(horizontal="center")
        ws2.cell(tr2, col).border = border_all()
        
    ws2.freeze_panes = "A5"
    last_col_char = chr(64 + last_col)
    ws2.auto_filter.ref = f"A4:{last_col_char}{last2}"
    
    overdue_fill = PatternFill("solid", fgColor="FDE68A")
    days_col_char = chr(64 + days_col)
    ws2.conditional_formatting.add(
        f"{days_col_char}{r0}:{days_col_char}{last2}",
        CellIsRule(operator='greaterThan', formula=['45'], stopIfTrue=True, fill=overdue_fill)
    )

def _apply_summary_formats_excel(ws3, start, last):
    for row in range(start, last + 1):
        ws3.cell(row, 1).alignment = Alignment(horizontal="left")
        for col in range(2, 9):
            ws3.cell(row, col).number_format = "$#,##0.00"
            ws3.cell(row, col).alignment = Alignment(horizontal="center")
        for col in range(1, 9):
            ws3.cell(row, col).border = border_all()
    ws3[f"A{last + 1}"].value = "TOTALS:"
    ws3[f"A{last + 1}"].font = Font(bold=True)
    for col in range(2, 9):
        L = chr(64 + col)
        cell = ws3[f"{L}{last + 1}"]
        cell.value = f"=SUM({L}{start}:{L}{last})"
        cell.number_format = "$#,##0.00"
        cell.font = Font(bold=True)
        cell.fill = fill(THEME["total"])
        cell.alignment = Alignment(horizontal="center")
        cell.border = border_all()

# --- NUEVA FUNCIÓN DE PDF ---

def create_pdf_report(
    data: Dict[str, CurrencyGroup], 
    logo_path: str, # Aún no lo usamos
    filters: dict
) -> io.BytesIO:
    """
    Toma los datos procesados y construye un archivo PDF EN MEMORIA.
    Devuelve un objeto io.BytesIO.
    """

    as_of = filters['as_of']
    customer_name = filters['customer_name']

    # --- ¡CAMBIO CLAVE! Guardar en memoria ---
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer, pagesize=landscape(A4),
        leftMargin=8 * mm, rightMargin=8 * mm, topMargin=12 * mm, bottomMargin=12 * mm,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "Title", parent=styles["Heading1"], fontSize=12, textColor=colors.HexColor("#2E86AB"), spaceAfter=2 * mm
    )
    meta_style = ParagraphStyle(
        "Meta", parent=styles["Normal"], fontSize=7, textColor=colors.HexColor("#6B7280"), spaceAfter=4 * mm
    )

    story = []
    head_color = colors.HexColor("#2E86AB")
    line_color = colors.HexColor("#D1D5DB")
    alt_color = colors.HexColor("#F8F9FA")
    total_color = colors.HexColor("#D1EFB5")

    for idx, (cur, cur_group) in enumerate(data.items()):
        if idx > 0:
            story.append(PageBreak())

        lg = _rl_logo(logo_path)
        if lg:
            story.append(lg)
            story.append(Spacer(2 * mm, 0))

        story.append(Paragraph(f"CURRENCY — {cur}", title_style))
        story.append(
            Paragraph(
                f"As Of: <b>{as_of:%m/%d/%y}</b> &nbsp;|&nbsp; Customer: <b>{customer_name}</b> &nbsp;|&nbsp; Records: <b>{len(cur_group.entries)}</b>",
                meta_style,
            )
        )

        headers = [
            "CUSTOMER", "REFERENCE", "DOC", "INV\nDATE", "NO.", "ARR\nDATE",
            "DUE\nDATE", "TOTAL", "PAYMT", "BALANCE", "DAYS",
        ]
        widths = [50, 60, 14, 14, 12, 14, 14, 25, 22, 26, 18] # mm

        tbl_data = [headers]
        for entry in cur_group.entries:
            customer_display = entry.customer_name or ""
            if len(customer_display) > 25:
                customer_display = customer_display[:25] + "\n" + customer_display[25:45]

            reference_display = entry.reference or ""
            if len(reference_display) > 30:
                reference_display = reference_display[:30] + "\n" + reference_display[30:55]

            doc_abbr = (
                "Inv" if entry.module == "Invoice"
                else "CrNote" if entry.module == "Credit Note"
                else "SO" if entry.module == "Sales Order"
                else "Pmt" if entry.module == "Customer Payment"
                else (entry.module or "")[:5]
            )
            tbl_data.append([
                customer_display,
                reference_display,
                doc_abbr,
                fmt_date(entry.invoice_date, "%m/%d/%y"),
                str(entry.folio or ""),
                fmt_date(entry.arrival_date, "%m/%d/%y"),
                fmt_date(entry.due_date, "%m/%d/%y"),
                f"{entry.total:,.2f}",
                f"{entry.paid:,.2f}",
                f"{entry.balance:,.2f}",
                str(entry.days_since),
            ])

        t = Table(tbl_data, colWidths=[w * mm for w in widths], repeatRows=1, splitByRow=True)
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), head_color),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 6),
            ("FONT", (0, 1), (-1, -1), "Helvetica", 6),
            ("GRID", (0, 0), (-1, -1), 0.25, line_color),
            ("ALIGN", (2, 1), (6, -1), "CENTER"),
            ("ALIGN", (7, 1), (-1, -1), "RIGHT"),
            ("ALIGN", (0, 1), (1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, alt_color]),
            ("LINEBELOW", (0, 0), (-1, 0), 1, colors.white),
        ]))
        story.append(t)

        cur_total = cur_group.totals['total']
        cur_pays = cur_group.totals['paid']
        cur_bal = cur_group.totals['balance']
        totals_row = [["", "", "", "", "", "", "TOTALS:", f"{cur_total:,.2f}", f"{cur_pays:,.2f}", f"{cur_bal:,.2f}", ""]]
        tt = Table(totals_row, colWidths=[w * mm for w in widths])
        tt.setStyle(TableStyle([
            ("SPAN", (0, 0), (6, 0)),
            ("ALIGN", (6, 0), (6, 0), "RIGHT"),
            ("BACKGROUND", (7, 0), (9, 0), total_color),
            ("FONT", (6, 0), (9, 0), "Helvetica-Bold", 6),
            ("ALIGN", (7, 0), (9, 0), "RIGHT"),
        ]))
        story.append(tt)
        story.append(Spacer(0, 6 * mm))

        story.append(Paragraph(f"SUMMARY — {cur}", title_style))
        hdr_summary = ["CUSTOMER", "TOTAL", "NOT DUE", "OVERDUE", "0-21", "22-30", "31-45", "45+"]
        widths_summary = [65, 30, 30, 30, 30, 30, 30, 30]

        tbl_summary = [hdr_summary]

        grand_agg = AgingSummary(total_balance=0.0) # Iniciamos con nuestro esquema

        for cust, agg in sorted(cur_group.aging_summary.items()):
            cust_display = cust or ""
            if len(cust_display) > 30:
                cust_display = cust_display[:30] + "\n" + cust_display[30:50]
            vals = [
                agg.total_balance, agg.not_yet_due, agg.overdue,
                agg.bucket_0_21, agg.bucket_22_30, agg.bucket_31_45, agg.bucket_45_plus
            ]
            tbl_summary.append([cust_display] + [f"{v:,.2f}" for v in vals])

            grand_agg.total_balance += agg.total_balance
            grand_agg.not_yet_due += agg.not_yet_due
            grand_agg.overdue += agg.overdue
            grand_agg.bucket_0_21 += agg.bucket_0_21
            grand_agg.bucket_22_30 += agg.bucket_22_30
            grand_agg.bucket_31_45 += agg.bucket_31_45
            grand_agg.bucket_45_plus += agg.bucket_45_plus

        t_summary = Table(tbl_summary, colWidths=[w * mm for w in widths_summary], repeatRows=1, splitByRow=True)
        t_summary.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), head_color),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 6),
            ("FONT", (0, 1), (-1, -1), "Helvetica", 6),
            ("GRID", (0, 0), (-1, -1), 0.25, line_color),
            ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
            ("ALIGN", (0, 1), (0, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, alt_color]),
        ]))
        story.append(t_summary)

        total_vals = [
            grand_agg.total_balance, grand_agg.not_yet_due, grand_agg.overdue,
            grand_agg.bucket_0_21, grand_agg.bucket_22_30, grand_agg.bucket_31_45, grand_agg.bucket_45_plus
        ]
        total_summary_row = [["TOTALS:"] + [f"{v:,.2f}" for v in total_vals]]
        tsr = Table(total_summary_row, colWidths=[w * mm for w in widths_summary])
        tsr.setStyle(TableStyle([
            ("ALIGN", (0, 0), (0, 0), "RIGHT"),
            ("BACKGROUND", (0, 0), (-1, -1), total_color),
            ("FONT", (0, 0), (-1, -1), "Helvetica-Bold", 6),
            ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ]))
        story.append(tsr)

    doc.build(story, onFirstPage=_pdf_header_footer, onLaterPages=_pdf_header_footer)

    # Rebobina el buffer y devuélvelo
    buffer.seek(0)
    return buffer

# app/reports/report_builder.py
# ... (después de la función create_pdf_report)

# --- NUEVA FUNCIÓN DE HTML ---

def create_html_report(
    data: Dict[str, CurrencyGroup], 
    logo_path: str, # Aún no lo usamos
    filters: dict
) -> io.BytesIO:
    """
    Toma los datos procesados y construye un archivo HTML EN MEMORIA.
    Devuelve un objeto io.BytesIO.
    """
    as_of = filters['as_of']
    customer_name = filters['customer_name']
    all_entries = [entry for group in data.values() for entry in group.entries]

    # Esta es tu lógica de CSS original
    css = """
    <style>
      :root{--p:#2E86AB;--pL:#F0F9FF;--s:#A7C957;--ink:#1F2937;--muted:#6B7280;--line:#D1D5DB;--alt:#F8F9FA}
      body{font-family:"Segoe UI",system-ui,-apple-system,sans-serif;color:var(--ink);margin:0;padding:24px}
      .header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid var(--p);padding-bottom:16px;margin-bottom:20px}
      .title{color:var(--p);font-size:24px;font-weight:700;margin:0}
      .sub{color:var(--muted);margin:4px 0 0 0}
      .logo{height:46px}
      h2{color:var(--p)}
      table{width:100%;border-collapse:collapse;font-size:12px;margin:12px 0 28px}
      thead th{background:var(--p);color:#fff;text-transform:uppercase;font-size:11px;padding:8px;border:1px solid var(--p)}
      tbody td{padding:8px;border-bottom:1px solid var(--line)}
      tbody tr:nth-child(even){background:var(--alt)}
      .num{font-variant-numeric:tabular-nums; text-align:right;}
      .center{text-align:center;}
      .tot td{background:var(--s);color:#fff;font-weight:700}
      .meta{background:var(--pL);padding:10px;border-radius:6px;margin:10px 0 18px;display:flex;gap:24px}
      .meta b{color:var(--p)}
    </style>
    """

    logo_img = "" # Logo no implementado

    parts = [
        f"""<!doctype html><html><head><meta charset="utf-8"><title>AR Aging</title>{css}</head><body>
        <div class="header">{logo_img}<div style="flex:1;text-align:center">
          <div class="title">ACCOUNTS RECEIVABLE AGING</div>
          <div class="sub">Detailed Accounts Receivable Analysis</div>
        </div><div style="width:80px"></div></div>"""
    ]

    meta = f"""<div class="meta"><div>As Of: <b>{fmt_date_ordinal(as_of)}</b></div>
                <div>Customer: <b>{customer_name}</b></div>
                <div>Total Records: <b>{len(all_entries)}</b></div></div>"""
    parts.append(meta)

    for cur, cur_group in data.items():
        parts.append(f"<h2>Currency — {cur}</h2>")
        parts.append(
            "<table><thead><tr>"
            "<th>CUSTOMER</th><th>REFERENCE</th><th>DOCUMENT</th><th>INVOICE DATE</th><th>NO.</th>"
            "<th>ARRIVAL DATE</th><th>DUE DATE</th><th>TOTAL AMOUNT</th><th>PAYMENTS</th><th>BALANCE</th><th>DAYS SINCE ARRIVAL</th>"
            "</tr></thead><tbody>"
        )
        for entry in cur_group.entries:
            parts.append(
                f"<tr><td>{entry.customer_name or ''}</td><td>{entry.reference or ''}</td><td class='center'>{entry.module or ''}</td>"
                f"<td class='center'>{fmt_date(entry.invoice_date)}</td><td class='center'>{entry.folio or ''}</td>"
                f"<td class='center'>{fmt_date(entry.arrival_date)}</td><td class='center'>{fmt_date(entry.due_date)}</td>"
                f"<td class='num'>{entry.total:,.2f}</td>"
                f"<td class='num'>{entry.paid:,.2f}</td>"
                f"<td class='num'>{entry.balance:,.2f}</td>"
                f"<td class='num' style='text-align:center'>{entry.days_since}</td></tr>"
            )

        cur_total = cur_group.totals['total']
        cur_pays = cur_group.totals['paid']
        cur_bal = cur_group.totals['balance']
        parts.append(
            f"<tr class='tot'><td colspan='7' style='text-align:right'>TOTALS ({cur}):</td>"
            f"<td class='num'>{cur_total:,.2f}</td>"
            f"<td class='num'>{cur_pays:,.2f}</td>"
            f"<td class='num'>{cur_bal:,.2f}</td><td></td></tr>"
        )
        parts.append("</tbody></table>")

        parts.append(f"<h2>Summary — {cur}</h2>")
        parts.append(
            "<table><thead><tr><th>CUSTOMER</th><th>TOTAL BALANCE</th><th>NOT YET DUE</th><th>OVERDUE</th>"
            "<th>0-21</th><th>22-30</th><th>31-45</th><th>45+ DAYS</th></tr></thead><tbody>"
        )

        # (Usamos un dict simple para los totales, ya que no necesitamos el objeto Pydantic)
        grand_agg = {"total_balance": 0.0, "not_yet_due": 0.0, "overdue": 0.0, "bucket_0_21": 0.0, "bucket_22_30": 0.0, "bucket_31_45": 0.0, "bucket_45_plus": 0.0}

        for k, agg in sorted(cur_group.aging_summary.items()):
            vals = [
                agg.total_balance, agg.not_yet_due, agg.overdue,
                agg.bucket_0_21, agg.bucket_22_30, agg.bucket_31_45, agg.bucket_45_plus
            ]
            parts.append("<tr><td>" + (k or "") + "</td>" + "".join(f"<td class='num'>{v:,.2f}</td>" for v in vals) + "</tr>")

            grand_agg["total_balance"] += agg.total_balance
            grand_agg["not_yet_due"] += agg.not_yet_due
            grand_agg["overdue"] += agg.overdue
            grand_agg["bucket_0_21"] += agg.bucket_0_21
            grand_agg["bucket_22_30"] += agg.bucket_22_30
            grand_agg["bucket_31_45"] += agg.bucket_31_45
            grand_agg["bucket_45_plus"] += agg.bucket_45_plus

        tot = [
            grand_agg["total_balance"], grand_agg["not_yet_due"], grand_agg["overdue"],
            grand_agg["bucket_0_21"], grand_agg["bucket_22_30"], grand_agg["bucket_31_45"], grand_agg["bucket_45_plus"]
        ]
        parts.append(
            "<tr class='tot'><td>TOTALS:</td>"
            + "".join(f"<td class='num'>{v:,.2f}</td>" for v in tot)
            + "</tr>"
        )
        parts.append("</tbody></table>")

    parts.append("</body></html>")

    # --- ¡CAMBIO CLAVE! Guardar en memoria ---
    html_content = "".join(parts)
    buffer = io.BytesIO(html_content.encode('utf-8'))
    buffer.seek(0)
    return buffer