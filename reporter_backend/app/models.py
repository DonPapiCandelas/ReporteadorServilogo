# app/models.py
from sqlalchemy import Boolean, Column, Integer, String, DateTime # <-- ¡Añade DateTime!
from .database import Base
import datetime # <-- ¡Añade datetime!

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    
    is_active = Column(Boolean, default=False) 
    is_admin = Column(Boolean, default=False)
    
    # --- ¡NUEVA COLUMNA! ---
    # Guardará la fecha y hora del último inicio de sesión
    last_login = Column(DateTime, nullable=True, default=None)