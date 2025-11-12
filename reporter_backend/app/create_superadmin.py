# app/create_superadmin.py
import sys
sys.path.append('.')

from app.database import SessionLocal, engine
from app.models import Base, User
from app.security import get_password_hash

# --- Configura tu admin ---
ADMIN_USER = "sistemas"
ADMIN_PASS = "Era.2000" # <-- ¡Ponle una contraseña fuerte!
ADMIN_FNAME = "Sistemas"
ADMIN_LNAME = "Reportes"
# -------------------------

Base.metadata.bind = engine
db = SessionLocal()

print(f"--- Creando/Actualizando Super-Admin: '{ADMIN_USER}' ---")

user = db.query(User).filter(User.username == ADMIN_USER).first()

if not user:
    print("Usuario no encontrado, creando uno nuevo...")
    hashed_password = get_password_hash(ADMIN_PASS)
    user = User(
        username=ADMIN_USER,
        hashed_password=hashed_password,
        first_name=ADMIN_FNAME,
        last_name=ADMIN_LNAME,
        is_admin=True,  # ¡Lo hace Admin!
        is_active=True  # ¡Lo hace Activo! (para que puedas hacer login)
    )
    db.add(user)
    db.commit()
    print(f"¡ÉXITO! Super-admin '{ADMIN_USER}' creado y activado.")
else:
    print("Usuario ya existe. Reseteando contraseña y promoviendo...")
    hashed_password = get_password_hash(ADMIN_PASS)
    user.hashed_password = hashed_password
    user.is_admin = True
    user.is_active = True
    user.first_name = ADMIN_FNAME
    user.last_name = ADMIN_LNAME
    db.commit()
    print(f"¡ÉXITO! Contraseña de '{ADMIN_USER}' reseteada y promovido/activado.")

db.close()
