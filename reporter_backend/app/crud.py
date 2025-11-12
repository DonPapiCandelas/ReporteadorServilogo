# app/crud.py
from sqlalchemy.orm import Session
from typing import Optional, List
from . import models, schemas, security

def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.username == username).first()

# --- ¡FUNCIÓN ACTUALIZADA! ---
def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    """
    Crea un nuevo usuario en la base de datos.
    El usuario se creará como INACTIVO por defecto (is_active=False).
    """
    hashed_password = security.get_password_hash(user.password)
    
    db_user = models.User(
        username=user.username,
        hashed_password=hashed_password,
        first_name=user.first_name, # <-- NUEVO
        last_name=user.last_name     # <-- NUEVO
        # is_active y is_admin usan sus valores por defecto (False)
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- El resto de funciones (por ahora sin cambios) ---

def get_user_by_id(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    return db.query(models.User).offset(skip).limit(limit).all()

def update_user_status(db: Session, user: models.User, is_active: bool) -> models.User:
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user

def update_user_password(db: Session, user: models.User, new_password: str) -> models.User:
    user.hashed_password = security.get_password_hash(new_password)
    db.commit()
    db.refresh(user)
    return user

# app/crud.py
# ... (después de la función update_user_password)

# --- ¡NUEVA FUNCIÓN! ---
def update_user_profile(db: Session, user: models.User, profile: schemas.UserProfileUpdate) -> models.User:
    """Actualiza el nombre y apellido de un usuario."""

    # Actualiza solo los campos que no son nulos
    if profile.first_name is not None:
        user.first_name = profile.first_name

    if profile.last_name is not None:
        user.last_name = profile.last_name

    db.commit()
    db.refresh(user)
    return user