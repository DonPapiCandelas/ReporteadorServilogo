import os
from dotenv import load_dotenv
# app/security.py
from fastapi import Depends, HTTPException, status, APIRouter
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
# ¡Añadimos timezone!
from datetime import datetime, timedelta, timezone 
from typing import Optional, Annotated, List

from . import schemas, crud, models
from .database import SessionLocal
from sqlalchemy.orm import Session
load_dotenv()
# --- Router ---
router = APIRouter(tags=["Auth & Admin"])

# --- Configuración (sin cambios) ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# ... (el resto de la configuración sin cambios) ...
SECRET_KEY = os.environ.get("SECRET_KEY", "un-secreto-por-defecto-si-falla")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8

# --- Funciones Helper (sin cambios) ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
# ... (get_password_hash, create_access_token sin cambios) ...
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- Dependencias (Guardias) (sin cambios) ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

def get_db_session():
    db = SessionLocal()
    try: 
        yield db
    finally: 
        db.close()

DbSessionDep = Annotated[Session, Depends(get_db_session)]
TokenDep = Annotated[str, Depends(oauth2_scheme)]

def get_current_user(token: TokenDep, db: DbSessionDep) -> models.User:
    # ... (sin cambios)
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(
    current_user: Annotated[models.User, Depends(get_current_user)]
) -> models.User:
    # ... (sin cambios)
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user

def get_current_admin_user(
    current_user: Annotated[models.User, Depends(get_current_active_user)]
) -> models.User:
    # ... (sin cambios)
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user

# --- Alias (sin cambios) ---
CurrentUser = Annotated[models.User, Depends(get_current_active_user)]
AdminUser = Annotated[models.User, Depends(get_current_admin_user)]

# --- ENDPOINTS ---

@router.post("/token", response_model=schemas.Token)
def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: DbSessionDep
):
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not activated. Please wait for administrator approval.",
        )
        
    # --- ¡NUEVA LÓGICA! ---
    # Si el login es exitoso, actualiza la hora de 'last_login'
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    # --- FIN DE LA NUEVA LÓGICA ---
        
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

# ... (El resto de endpoints: /users/me, /users/, /approve, etc. se quedan
#      exactamente igual que en el archivo anterior) ...

@router.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: CurrentUser):
    return current_user

@router.post("/users/", response_model=schemas.User)
def register_user(
    user: schemas.UserCreate, 
    db: DbSessionDep
):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    return crud.create_user(db=db, user=user)

@router.get("/users/", response_model=List[schemas.User])
def read_users(
    admin: AdminUser,
    db: DbSessionDep
) -> List[schemas.User]:
    return crud.get_users(db)

@router.put("/users/{user_id}/approve", response_model=schemas.User)
def approve_user(
    user_id: int, 
    admin: AdminUser,
    db: DbSessionDep
):
    db_user = crud.get_user_by_id(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.update_user_status(db=db, user=db_user, is_active=True)

@router.put("/users/{user_id}/status", response_model=schemas.User)
def update_user_active_status(
    user_id: int, 
    status_update: schemas.UserStatusUpdate, 
    admin: AdminUser,
    db: DbSessionDep
):
    db_user = crud.get_user_by_id(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.update_user_status(db=db, user=db_user, is_active=status_update.is_active)

@router.put("/users/{user_id}/profile", response_model=schemas.User)
def update_user_profile_by_admin(
    user_id: int, 
    profile: schemas.UserProfileUpdate,
    admin: AdminUser,
    db: DbSessionDep
):
    db_user = crud.get_user_by_id(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.update_user_profile(db=db, user=db_user, profile=profile)

@router.put("/users/{user_id}/password", response_model=schemas.User)
def admin_change_user_password(
    user_id: int, 
    password_change: schemas.UserPasswordChange, 
    admin: AdminUser,
    db: DbSessionDep
):
    db_user = crud.get_user_by_id(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.update_user_password(
        db=db, user=db_user, new_password=password_change.new_password
    )