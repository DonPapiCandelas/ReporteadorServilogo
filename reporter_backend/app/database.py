# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os

# Define la URL de la base de datos.
# Usará un archivo llamado 'reporter.db' en la carpeta raíz (reporter_backend)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQLALCHEMY_DATABASE_URL = "sqlite:///" + os.path.join(BASE_DIR, "reporter.db")

# Crea el "motor" de SQLAlchemy
# check_same_thread=False es necesario solo para SQLite.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Crea una "Sesión" que usaremos para hablar con la base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Una clase Base de la que heredarán todos nuestros modelos (tablas)
class Base(DeclarativeBase):
    pass

# --- Dependencia para obtener la sesión de BD ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()