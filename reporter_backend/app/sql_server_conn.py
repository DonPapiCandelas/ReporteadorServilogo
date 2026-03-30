# app/sql_server_conn.py
import pyodbc
from fastapi import HTTPException, status, Request
import os
from dotenv import load_dotenv

from .tenants import TENANTS, get_company_or_default

# Carga variables de entorno (ej. host, user, password) desde el archivo .env
load_dotenv()

# Configuración base de SQL Server (el servidor, usuario y contraseña son compartidos
# independientemente del tenant o base de datos específica a la que nos conectemos).
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
    """
    Dependencia de FastAPI: Retorna una conexión a la base de datos de SQL Server
    dependiendo de la empresa o tenant seleccionado en el Frontend.

    El frontend debe enviar obligatoriamente el header HTTP: X-Company: <tenant_key>
    (Por ejemplo: growers_union o sofresco) para identificar a qué BD conectarse.

    Esto establece la base para nuestro modelo Multi-Tenant.
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
        # Se establece autocommit = False para tener control sobre las transacciones manually.
        # Yield suspende temporalmente la ejecución devolviendo la conexión para que el router la use.
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
    """
    Función utilitaria para ejecutar un query de SQL de forma segura parametrizado.
    Recibe la conexión y la query, devuelve la lista de resultados usando .fetchall().
    """
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
