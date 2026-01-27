
import pyodbc
import os
import datetime
from dotenv import load_dotenv

load_dotenv()

DB_SERVER = os.environ.get("DB_SERVER", r"LOCALHOST\SQLEXPRESS")
DB_USER = os.environ.get("DB_USER", "sa")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "tu_contraseña_secreta")
DATABASE_NAME = "SOFRESCO_GMBH_25" 

def get_conn():
    conn_str = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={DB_SERVER};DATABASE={DATABASE_NAME};"
        f"UID={DB_USER};PWD={DB_PASSWORD};"
        "Encrypt=no;TrustServerCertificate=yes;"
    )
    return pyodbc.connect(conn_str)

def test_full_query():
    print("Testing full query from receivables.py...")
    try:
        conn = get_conn()
        cursor = conn.cursor()
        
        sql = """
            SELECT 
                Cliente, BusinessEntityID, Modulo, InvoiceDate, Folio, 
                ArrivalDate, Vencimiento, Referencia, PO, Moneda, TC, 
                SubTotal, Total, Pagado, Saldo
            FROM zzReporteSaldoDocuments
            WHERE InvoiceDate < DATEADD(day,1,?)
            ORDER BY Cliente, InvoiceDate, Folio;
        """
        as_of = datetime.date(2026, 1, 23) # Use today's date or similar
        
        print(f"Executing query with as_of={as_of}...")
        cursor.execute(sql, (as_of,))
        
        rows = cursor.fetchall()
        print(f"  Success! Fetched {len(rows)} rows.")
        conn.close()
    except Exception as e:
        print(f"  FAILED: {e}")

if __name__ == "__main__":
    test_full_query()
