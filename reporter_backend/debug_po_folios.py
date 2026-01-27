
import pyodbc
import os
from dotenv import load_dotenv

load_dotenv()

DB_SERVER = os.environ.get("DB_SERVER", r"LOCALHOST\SQLEXPRESS")
DB_USER = os.environ.get("DB_USER", "sa")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "tu_contraseña_secreta")

# Databases from tenants.py logic
DB_GROWERS = os.getenv("DB_GROWERS_UNION", os.getenv("DB_DATABASE", "GROWERS_UNION_2025"))
DB_SOFRESCO = os.getenv("DB_SOFRESCO", "SOFRESCO_GMBH_25")

FOLIOS_TO_CHECK = [
    "1312", # From single customer screenshot
    "P178", "1101", "1102", "P175", "P173", "P174", "P186", "P187", 
    "248", "252", "1256", "1301", "278", "1366", "P184", "P185" # From all customers screenshot
]

def get_conn(db_name):
    conn_str = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={DB_SERVER};DATABASE={db_name};"
        f"UID={DB_USER};PWD={DB_PASSWORD};"
        "Encrypt=no;TrustServerCertificate=yes;"
    )
    return pyodbc.connect(conn_str)

def check_folios(db_name):
    print(f"\n--- Checking Database: {db_name} ---")
    try:
        conn = get_conn(db_name)
        cursor = conn.cursor()
        
        # Check if PO column exists
        try:
            cursor.execute("SELECT TOP 1 PO FROM zzReporteSaldoDocuments")
            print("PO column EXISTS in zzReporteSaldoDocuments.")
        except Exception as e:
            print(f"PO column DOES NOT EXIST in zzReporteSaldoDocuments. Error: {e}")
            conn.close()
            return

        # Check specific folios
        print(f"Checking {len(FOLIOS_TO_CHECK)} folios...")
        found_count = 0
        for folio in FOLIOS_TO_CHECK:
            # Try exact match on Folio column (string)
            # Folio column in view is constructed: Prefix + Folio
            # We'll try LIKE match just in case
            cursor.execute("SELECT Folio, PO FROM zzReporteSaldoDocuments WHERE Folio LIKE ?", (f"%{folio}%",))
            rows = cursor.fetchall()
            for r in rows:
                print(f"  Found Folio: '{r.Folio}', PO: '{r.PO}'")
                found_count += 1
        
        if found_count == 0:
            print("  No matching folios found in this database.")

        conn.close()
    except Exception as e:
        print(f"Error connecting/querying {db_name}: {e}")

if __name__ == "__main__":
    check_folios(DB_GROWERS)
    check_folios(DB_SOFRESCO)
