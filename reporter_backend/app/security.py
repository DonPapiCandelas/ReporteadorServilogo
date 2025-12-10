# reporter_backend/app/security.py
from datetime import datetime, timedelta
from typing import Optional, List, Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import os

from . import crud, models, schemas, database

# Configuración
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey_change_me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
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
    except JWTError:
        raise credentials_exception
    
    user = crud.get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

CurrentUser = Annotated[models.User, Depends(get_current_active_user)]

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user.last_login = datetime.utcnow()
    db.commit()

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "username": user.username,
        "is_admin": user.is_admin
    }

@router.post("/register", response_model=schemas.User)
async def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    """Endpoint público para registro - no requiere autenticación"""
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud.create_user(db=db, user=user)

@router.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_active_user)):
    return current_user

@router.get("/users/", response_model=List[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_active_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_active_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud.create_user(db=db, user=user)

@router.delete("/users/{user_id}")
def delete_user_endpoint(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    success = crud.delete_user(db,user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "deleted"}

@router.put("/users/{user_id}/role")
def update_user_role_endpoint(
    user_id: int,
    is_admin: bool, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if current_user.id == user_id and is_admin is False:
        raise HTTPException(status_code=400, detail="Cannot remove admin rights from yourself")

    user = crud.update_user_role(db, user_id, is_admin)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "updated", "is_admin": user.is_admin}

@router.put("/users/{user_id}/status")
def update_user_status_endpoint(
    user_id: int,
    is_active: bool,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = crud.update_user_status(db, user_id, is_active)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "updated", "is_active": user.is_active}

@router.put("/users/{user_id}/profile")
def update_user_profile_endpoint(
    user_id: int,
    first_name: str,
    last_name: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = crud.update_user_profile(db, user_id, first_name, last_name)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "updated"}

@router.put("/users/{user_id}/password")
def update_user_password_endpoint(
    user_id: int,
    new_password: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = crud.update_user_password(db, user_id, new_password)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "password_updated"}