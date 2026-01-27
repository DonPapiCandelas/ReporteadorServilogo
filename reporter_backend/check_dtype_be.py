
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
        
        print("Checking data type of BusinessEntityID...")
        cursor.execute("""
            SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE COLUMN_NAME = 'BusinessEntityID' 
            AND TABLE_NAME IN ('orgBusinessEntity', 'docFinancialOperation')
        """)
        rows = cursor.fetchall()
        for row in rows:
            print(f"Table: {row[0]}, Column: {row[1]}, Data Type: {row[2]}")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_column_type()
