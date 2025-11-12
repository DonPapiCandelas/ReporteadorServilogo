# app/make_admin.py
from .database import SessionLocal, engine
from .models import Base, User

# IMPORTANTE: Asegúrate de que este sea el username que registraste
USERNAME_TO_PROMOTE = "admin"

# --- No necesitas modificar nada debajo de esta línea ---

# Carga los modelos y crea la sesión
Base.metadata.bind = engine
db = SessionLocal()

print(f"Buscando al usuario: '{USERNAME_TO_PROMOTE}'...")

# Busca al usuario en la base de datos
user = db.query(User).filter(User.username == USERNAME_TO_PROMOTE).first()

if user:
    print(f"¡Usuario encontrado! ID: {user.id}, Admin actual: {user.is_admin}")

    # Promueve al usuario a admin
    user.is_admin = True
    user.is_active = True # Aseguramos que esté activo
    db.commit()

    print(f"¡ÉXITO! El usuario '{user.username}' ahora es un administrador.")
else:
    print(f"ERROR: No se pudo encontrar al usuario con el username '{USERNAME_TO_PROMOTE}'.")
    print("Asegúrate de haberlo registrado primero desde la página /docs.")

db.close()