import sys
import os
import pyodbc

# Add project root to path
sys.path.append(os.getcwd())

from reporter_backend.app.sql_server_conn import get_sql_server_conn, fetch_all

def debug_join():
    print("Connecting to DB...")
    conn_gen = get_sql_server_conn()
    conn = next(conn_gen)

    print("\n--- Checking columns of zzReporteSaldoDocuments ---")
    try:
        cols = fetch_all(conn, "SELECT TOP 0 * FROM zzReporteSaldoDocuments")
        if cols:
            print("Columns found (via cursor description):")
            # pyodbc rows don't have .cursor_description directly accessible on the Row object easily without the cursor, 
            # but fetch_all uses a cursor. Let's just select top 1 and print keys if possible or use INFORMATION_SCHEMA.
            pass
    except Exception as e:
        print(f"Error selecting: {e}")

    # Better way to get columns
    cols_info = fetch_all(conn, "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'zzReporteSaldoDocuments'")
    print([r.COLUMN_NAME for r in cols_info])

    print("\n--- Checking sample data for 'Sales Order' ---")
    # Get a sample Sales Order to see its Folio
    sql_sample = "SELECT TOP 5 Folio, Modulo, Cliente FROM zzReporteSaldoDocuments WHERE Modulo = 'Sales Order'"
    rows = fetch_all(conn, sql_sample)
    for r in rows:
        print(f"Sales Order - Folio: '{r.Folio}', Client: '{r.Cliente}'")
        
        # Try to find this Folio in docDocument
        # Try exact match
        sql_doc = "SELECT DocumentID, Folio FROM dbo.docDocument WHERE Folio = ?"
        doc_rows = fetch_all(conn, sql_doc, [r.Folio])
        
        # Try stripping 'P' if it starts with P
        if not doc_rows and r.Folio.startswith('P'):
            stripped_folio = r.Folio[1:]
            print(f"  -> Trying stripped folio: '{stripped_folio}'")
            doc_rows = fetch_all(conn, sql_doc, [stripped_folio])

        if doc_rows:
            for dr in doc_rows:
                print(f"  -> MATCH in docDocument: ID={dr.DocumentID}, Folio='{dr.Folio}'")
                
                # Check docDocumentExt
                sql_ext = "SELECT YourPO FROM dbo.docDocumentExt WHERE IDExtra = ?"
                ext_rows = fetch_all(conn, sql_ext, [dr.DocumentID])
                for er in ext_rows:
                    print(f"    -> MATCH in docDocumentExt: YourPO='{er.YourPO}'")
        else:
            print("  -> NO MATCH in docDocument")

    print("\n--- Checking specific case from user screenshot (if possible) ---")
    # User showed DocumentID 34461. Let's see if we can find it via Folio from zzReporteSaldoDocuments
    # First, what is the Folio for DocumentID 34461?
    doc_34461 = fetch_all(conn, "SELECT Folio, DocumentID FROM dbo.docDocument WHERE DocumentID = 34461")
    if doc_34461:
        f = doc_34461[0].Folio
        print(f"DocumentID 34461 has Folio: '{f}'")
        
        # Does this Folio exist in zzReporteSaldoDocuments?
        zz_rows = fetch_all(conn, "SELECT * FROM zzReporteSaldoDocuments WHERE Folio = ?", [f])
        if zz_rows:
            print(f"  -> Found in zzReporteSaldoDocuments: {len(zz_rows)} rows.")
        else:
            print("  -> NOT FOUND in zzReporteSaldoDocuments.")
    else:
        print("DocumentID 34461 not found in docDocument.")

if __name__ == "__main__":
    debug_join()
