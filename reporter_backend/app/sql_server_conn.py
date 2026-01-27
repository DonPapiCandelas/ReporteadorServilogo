# app/sql_server_conn.py
import pyodbc
from fastapi import HTTPException, status, Request
import os
from dotenv import load_dotenv

from .tenants import TENANTS, get_company_or_default

# Carga variables del archivo .env
load_dotenv()

# Config base (servidor/usuario/password son compartidos)
DB_SERVER = os.environ.get("DB_SERVER", r"LOCALHOST\SQLEXPRESS")
DB_USER = os.environ.get("DB_USER", "sa")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "tu_contraseña_secreta")

def _build_connection_string(database_name: str) -> str:
    return (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={DB_SERVER};DATABASE={database_name};"
        f"UID={DB_USER};PWD={DB_PASSWORD};"
        "Encrypt=no;TrustServerCertificate=yes;"
    )

def get_sql_server_conn(request: Request):
    """Dependency: retorna una conexión a la BD según la empresa seleccionada.

    El frontend debe enviar header: X-Company: <tenant_key>
    Ej: growers_union, sofresco
    """
    company_header = request.headers.get("X-Company")
    
    # --- DEBUG LOGGING ---
    import logging
    logger = logging.getLogger("app.sql_server_conn")
    logger.info(f"Connection Request - X-Company Header: '{company_header}'")
    # ---------------------

    try:
        company_key = get_company_or_default(company_header)
    except KeyError:
        allowed = ", ".join(TENANTS.keys())
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid company. Allowed: {allowed}"
        )

    database_name = TENANTS[company_key]["database"]
    logger.info(f"Resolved Company: '{company_key}' -> Database: '{database_name}'")
    
    conn_str = _build_connection_string(database_name)

    try:
        conn = pyodbc.connect(conn_str, autocommit=False)
        # Guardamos el tenant por si quieres loguearlo o usarlo en queries
        conn.autocommit = False
        yield conn
    except pyodbc.Error as e:
        logger.error(f"Connection Failed to {database_name}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection error ({company_key}/{database_name}): {e}"
        )
    finally:
        if 'conn' in locals():
            conn.close()

def fetch_all(conn: pyodbc.Connection, sql: str, params: list = None) -> list[pyodbc.Row]:
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
