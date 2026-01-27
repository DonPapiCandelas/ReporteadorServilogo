
import pyodbc
import os
from dotenv import load_dotenv

load_dotenv()

DB_SERVER = os.environ.get("DB_SERVER", r"LOCALHOST\SQLEXPRESS")
DB_USER = os.environ.get("DB_USER", "sa")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "tu_contraseña_secreta")
DATABASE_NAME = "GROWERS_UNION_2025" 

def get_conn():
    conn_str = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={DB_SERVER};DATABASE={DATABASE_NAME};"
        f"UID={DB_USER};PWD={DB_PASSWORD};"
        "Encrypt=no;TrustServerCertificate=yes;"
    )
    return pyodbc.connect(conn_str)

def inspect_view():
    try:
        conn = get_conn()
        cursor = conn.cursor()
        
        # Check columns
        cursor.execute("SELECT TOP 1 * FROM zzReporteSaldoDocuments")
        columns = [column[0] for column in cursor.description]
        print(f"Columns in zzReporteSaldoDocuments: {columns}")
        
        if 'PO' in columns:
            print("PO column FOUND in view.")
            # Check if there is any data in PO
            cursor.execute("SELECT TOP 5 Folio, PO FROM zzReporteSaldoDocuments WHERE PO IS NOT NULL AND PO <> ''")
            rows = cursor.fetchall()
            if rows:
                print(f"Found {len(rows)} rows with PO data:")
                for r in rows:
                    print(f"Folio: {r.Folio}, PO: {r.PO}")
            else:
                print("PO column exists but NO data found (or all empty/null).")
        else:
            print("PO column NOT FOUND in view.")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_view()
