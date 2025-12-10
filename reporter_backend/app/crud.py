# reporter_backend/app/crud.py
from sqlalchemy.orm import Session
from . import models, schemas
from passlib.context import CryptContext

# Configuración de hashing de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = models.User(
        username=user.username,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        is_active=False,  # REQUIERE APROBACIÓN
        is_admin=False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- FUNCIONES DE ADMINISTRACIÓN ---

def delete_user(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
        return True
    return False

def update_user_role(db: Session, user_id: int, is_admin: bool):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.is_admin = is_admin
        db.commit()
        db.refresh(user)
    return user

def update_user_status(db: Session, user_id: int, is_active: bool):
    """Aprobar o desactivar un usuario"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.is_active = is_active
        db.commit()
        db.refresh(user)
    return user

def update_user_profile(db: Session, user_id: int, first_name: str, last_name: str):
    """Actualizar nombre y apellido"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.first_name = first_name
        user.last_name = last_name
        db.commit()
        db.refresh(user)
    return user

def update_user_password(db: Session, user_id: int, new_password: str):
    """Cambiar contraseña de un usuario"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.hashed_password = pwd_context.hash(new_password)
        db.commit()
        db.refresh(user)
    return user