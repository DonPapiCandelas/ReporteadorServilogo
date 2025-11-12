# app/reset_password.py
import sys

# --- ¡CONFIGURA ESTO! ---
USERNAME_TO_RESET = "admin"
NEW_PASSWORD = "Soylameraverga" # ¡Asegúrate de que esta sea la que quieres!
# -------------------------

# Añadimos la ruta del proyecto para que encuentre los módulos
sys.path.append('.') 

from app.database import SessionLocal, engine
from app.models import Base, User
from app.security import get_password_hash # ¡Importamos el encriptador!

# Carga los modelos y crea la sesión
Base.metadata.bind = engine
db = SessionLocal()

print(f"--- Reseteando contraseña para: '{USERNAME_TO_RESET}' ---")

# Busca al usuario en la base de datos
user = db.query(User).filter(User.username == USERNAME_TO_RESET).first()

if user:
    print(f"¡Usuario encontrado! (ID: {user.id})")

    # Encripta la nueva contraseña
    hashed_password = get_password_hash(NEW_PASSWORD)

    # Actualiza el usuario
    user.hashed_password = hashed_password
    db.commit()

    print(f"¡ÉXITO! La contraseña se ha reseteado.")
    print(f"Usuario: {USERNAME_TO_RESET}")
    print(f"Nueva Contraseña: {NEW_PASSWORD}")

else:
    print(f"ERROR: No se pudo encontrar al usuario con el username '{USERNAME_TO_RESET}'.")
    print("Revisa el 'USERNAME_TO_RESET' en el script o regístralo primero.")

db.close()