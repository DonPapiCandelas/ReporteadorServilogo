
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

def check_column_type():
    try:
        conn = get_conn()
        cursor = conn.cursor()
        
        print("Checking data type of dbo.docDocumentExt.YourPO...")
        cursor.execute("""
            SELECT DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'docDocumentExt' AND COLUMN_NAME = 'YourPO'
        """)
        row = cursor.fetchone()
        if row:
            print(f"Data Type: {row[0]}")
        else:
            print("Column not found.")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_column_type()
