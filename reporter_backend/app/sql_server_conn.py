# app/sql_server_conn.py
import pyodbc
from fastapi import HTTPException, status
import os
from dotenv import load_dotenv # <-- ¡NUEVO!

# --- ¡NUEVO! Carga las variables del archivo .env ---
load_dotenv() 

# --- ¡CAMBIO! Lee la configuración desde las variables de entorno ---
DB_SERVER = os.environ.get("DB_SERVER", r"LOCALHOST\SQLEXPRESS")
DB_DATABASE = os.environ.get("DB_DATABASE", "mi_base_de_datos")
DB_USER = os.environ.get("DB_USER", "sa")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "tu_contraseña_secreta")

CONNECTION_STRING = (
    f"DRIVER={{ODBC Driver 17 for SQL Server}};"
    f"SERVER={DB_SERVER};DATABASE={DB_DATABASE};"
    f"UID={DB_USER};PWD={DB_PASSWORD};"
    "Encrypt=no;TrustServerCertificate=yes;"
)

def get_sql_server_conn():
    # ... (El resto del archivo es idéntico) ...
    try:
        conn = pyodbc.connect(CONNECTION_STRING, autocommit=False)
        yield conn
    except pyodbc.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection error: {e}"
        )
    finally:
        if 'conn' in locals():
            conn.close()

def fetch_all(conn: pyodbc.Connection, sql: str, params: list = None) -> list[pyodbc.Row]:
    # ... (idéntico) ...
    try:
        with conn.cursor() as cursor:
            if params:
                cursor.execute(sql, params)
            else:
                cursor.execute(sql)
            return cursor.fetchall()
    except pyodbc.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database query error: {e}"
        )