import sys
import os
sys.path.append(os.path.abspath("c:/Proyectos/ReportesWeb/reporter_backend"))
from app.sql_server_conn import get_sql_server_conn, fetch_all

def check_view():
    print("Checking ZZCredito view...")
    try:
        gen = get_sql_server_conn()
        conn = next(gen)
        
        # Try to select top 1 from ZZCredito
        try:
            rows = fetch_all(conn, "SELECT TOP 1 * FROM ZZCredito")
            if rows:
                print("View ZZCredito exists. Columns:")
                # pyodbc Row object doesn't easily show keys, but we can print the row
                print(rows[0])
                # To get column names we might need cursor.description if fetch_all returned cursor, but it returns rows.
                # We can infer from printing.
            else:
                print("View ZZCredito exists but is empty.")
        except Exception as e:
            print(f"Error selecting from ZZCredito: {e}")
            print("Trying the raw SQL provided by user...")
            
            sql = """
            SELECT TOP 1 dbo.orgCustomer.CustomerID, dbo.orgCustomer.BusinessEntityID, dbo.engPaymentTerm.PaymentTermName, dbo.orgCustomer.CreditLimit
            FROM dbo.orgCustomer LEFT OUTER JOIN
            dbo.engPaymentTerm ON dbo.orgCustomer.PaymentTermID = dbo.engPaymentTerm.PaymentTermID
            """
            try:
                rows = fetch_all(conn, sql)
                print("Raw SQL worked. Columns:")
                print(rows[0])
            except Exception as e2:
                print(f"Error with raw SQL: {e2}")

    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    check_view()
