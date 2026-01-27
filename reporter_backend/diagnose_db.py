import pyodbc
import os
from dotenv import load_dotenv

load_dotenv()

DB_SERVER = os.environ.get("DB_SERVER", r"LOCALHOST\SQLEXPRESS")
DB_USER = os.environ.get("DB_USER", "sa")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "tu_contraseña_secreta")
DB_DATABASE = os.environ.get("DB_DATABASE", "GROWERS_UNION_2025")

conn_str = (
    f"DRIVER={{ODBC Driver 17 for SQL Server}};"
    f"SERVER={DB_SERVER};DATABASE={DB_DATABASE};"
    f"UID={DB_USER};PWD={DB_PASSWORD};"
    "Encrypt=no;TrustServerCertificate=yes;"
)

print(f"Connecting to {DB_SERVER}...")

try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()

    print("\n--- Available Databases ---")
    cursor.execute("SELECT name FROM sys.databases WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')")
    dbs = cursor.fetchall()
    for db in dbs:
        print(db.name)

    print(f"\n--- Columns in {DB_DATABASE}.dbo.zzReporteSaldoDocuments ---")
    try:
        cursor.execute(f"SELECT TOP 0 * FROM {DB_DATABASE}.dbo.zzReporteSaldoDocuments")
        columns = [column[0] for column in cursor.description]
        print(", ".join(columns))
    except Exception as e:
        print(f"Error querying view: {e}")

    conn.close()

except Exception as e:
    print(f"Connection failed: {e}")
