import sys
import os
import pyodbc

# Add project root to path
sys.path.append(os.getcwd())

from reporter_backend.app.sql_server_conn import get_sql_server_conn, fetch_all

def debug_duplicates():
    print("Connecting to DB...")
    conn_gen = get_sql_server_conn()
    conn = next(conn_gen)

    print("\n--- Checking engModule columns ---")
    sql_cols = "SELECT TOP 1 * FROM dbo.engModule"
    rows = fetch_all(conn, sql_cols)
    if rows:
        # Print column names from the row cursor description if possible, or just the row itself
        # Since pyodbc Row object doesn't show keys easily, I'll use INFORMATION_SCHEMA again
        pass
    
    sql_info = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'engModule'"
    rows_info = fetch_all(conn, sql_info)
    print([r.COLUMN_NAME for r in rows_info])

    print("\n--- Checking distinct Modulo in zzReporteSaldoDocuments ---")
    sql_distinct = "SELECT DISTINCT Modulo FROM zzReporteSaldoDocuments"
    rows_distinct = fetch_all(conn, sql_distinct)
    modules = [r.Modulo for r in rows_distinct]
    print(modules)

    print("\n--- Testing Exact Join Logic for Folio 284 ---")
    sql_join_test = """
        SELECT T1.Folio, T1.Modulo, T2.DocumentID, T2.ModuleID, T3.IDExtra, T3.YourPO
        FROM zzReporteSaldoDocuments T1
        LEFT JOIN dbo.docDocument T2 ON (
            (T1.Folio = T2.Folio OR (T1.Modulo = 'Sales Order' AND T1.Folio = 'P' + T2.Folio))
            AND T2.ModuleID = CASE T1.Modulo 
                WHEN 'Invoice' THEN 21 
                WHEN 'Credit Note' THEN 142 
                WHEN 'Sales Order' THEN 967 
                ELSE T2.ModuleID 
            END
        )
        LEFT JOIN dbo.docDocumentExt T3 ON T2.DocumentID = T3.IDExtra
        WHERE T1.Folio = '284'
    """
    rows_join = fetch_all(conn, sql_join_test)
    print(f"Join returned {len(rows_join)} rows.")
    for r in rows_join:
        print(f"  Row: Modulo='{r.Modulo}', DocID={r.DocumentID}, ModuleID={r.ModuleID}, ExtID={r.IDExtra}, PO='{r.YourPO}'")

    print("\n--- Checking for multiple docDocument entries with ModuleID 142 ---")
    sql_check_142 = "SELECT * FROM dbo.docDocument WHERE Folio = '284' AND ModuleID = 142"
    rows_142 = fetch_all(conn, sql_check_142)
    for r in rows_142:
        print(f"  Doc 142: ID={r.DocumentID}, Folio='{r.Folio}'")

    print("\n--- Checking for multiple docDocumentExt entries ---")
    if rows_142:
        doc_id = rows_142[0].DocumentID
        sql_ext = "SELECT * FROM dbo.docDocumentExt WHERE IDExtra = ?"
        rows_ext = fetch_all(conn, sql_ext, [doc_id])
        for r in rows_ext:
            print(f"  Ext: IDExtra={r.IDExtra}, YourPO='{r.YourPO}'")

if __name__ == "__main__":
    debug_duplicates()
