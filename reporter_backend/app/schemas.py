# app/schemas.py
from pydantic import BaseModel, ConfigDict
from typing import Optional
import datetime # <-- ¡Añade datetime!

# --- Esquemas para Tokens ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- Esquemas para Usuarios ---
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    """Esquema para crear un usuario (desde la página de registro)"""
    password: str
    first_name: str
    last_name: str

class User(UserBase):
    """Esquema para LEER un usuario (lo que devuelve la API)"""
    id: int
    is_active: bool
    is_admin: bool
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    
    # --- ¡NUEVO CAMPO! ---
    last_login: Optional[datetime.datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
    
class UserStatusUpdate(BaseModel):
    is_active: bool

class UserPasswordChange(BaseModel):
    new_password: str
    
class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None

# --- El esquema que nos faltaba la última vez ---
class CustomerFilterItem(BaseModel):
    id: int
    name: str