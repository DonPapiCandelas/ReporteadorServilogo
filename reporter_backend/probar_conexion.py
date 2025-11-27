import pyodbc
import os

# --- DATOS DE CONEXIÓN (Pégalos tal cual los tienes en tu .env o hardcodealos aquí para probar) ---
# Intenta primero con el nombre de tu PC, y si falla, prueba con "." o "localhost"
SERVER_NAME = r"DESKTOP-M8U5A9S\COMPAC"  
DATABASE = "GROWERS_UNION_2025"
USER = "sa"
PASSWORD = "Limac00"

print("--- DIAGNÓSTICO DE CONEXIÓN SQL SERVER ---")

# 1. VERIFICAR DRIVERS INSTALADOS
print(f"\n[1] Verificando Drivers ODBC instalados en este Windows...")
drivers = pyodbc.drivers()
print(f"    Drivers encontrados: {drivers}")
if "ODBC Driver 17 for SQL Server" not in drivers:
    print("    ¡ALERTA! No veo 'ODBC Driver 17 for SQL Server'. Tienes que descargarlo e instalarlo.")
else:
    print("    OK: Driver 17 encontrado.")

# 2. PRUEBA DE CONEXIÓN DIRECTA
def probar_conexion(server_address):
    print(f"\n[2] Probando conexión a: {server_address} ...")
    conn_str = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={server_address};"
        f"DATABASE={DATABASE};"
        f"UID={USER};PWD={PASSWORD};"
        "Encrypt=no;TrustServerCertificate=yes;"
    )
    try:
        conn = pyodbc.connect(conn_str, timeout=5)
        print("    ¡ÉXITO! Conexión establecida correctamente.")
        conn.close()
        return True
    except Exception as e:
        print(f"    FALLÓ. Error: {e}")
        return False

# Intentamos las 3 variantes más comunes para local
variantes = [
    SERVER_NAME,           # Tu nombre original: DESKTOP-M8U5A9S\COMPAC
    r".\COMPAC",           # Opción local rápida: .\COMPAC
    r"localhost\COMPAC",   # Opción localhost: localhost\COMPAC
    r"127.0.0.1\COMPAC"    # IP local explícita
]

exito = False
for var in variantes:
    if probar_conexion(var):
        exito = True
        print(f"\n>>> SOLUCIÓN: Cambia en tu .env la variable DB_SERVER por: {var}")
        break

if not exito:
    print("\n>>> RESULTADO: Ninguna conexión funcionó. Revisa Firewall, TCP/IP o SQL Browser.")