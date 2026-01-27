
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

def test_column(col_name):
    print(f"Testing column: {col_name}")
    try:
        conn = get_conn()
        cursor = conn.cursor()
        # Select top 1000 to try to hit the bad row, or just all
        # We use a cursor to fetch to trigger the error
        cursor.execute(f"SELECT {col_name} FROM zzReporteSaldoDocuments")
        row_count = 0
        while True:
            rows = cursor.fetchmany(1000)
            if not rows:
                break
            row_count += len(rows)
        print(f"  Success! Fetched {row_count} rows.")
        conn.close()
    except Exception as e:
        print(f"  FAILED: {e}")

if __name__ == "__main__":
    columns = [
        "Cliente", "BusinessEntityID", "Modulo", "InvoiceDate", "Folio", 
        "ArrivalDate", "Vencimiento", "Referencia", "PO", "Moneda", "TC", 
        "SubTotal", "Total", "Pagado", "Saldo"
    ]
    for col in columns:
        test_column(col)
