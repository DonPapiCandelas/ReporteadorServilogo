# app/companies.py
from fastapi import APIRouter
from .security import CurrentUser
from .tenants import list_companies

router = APIRouter(tags=["Companies"])

@router.get("/companies")
def get_companies(current_user: CurrentUser):
    # En el futuro puedes filtrar por usuario/rol.
    # Por ahora devolvemos el catálogo completo permitido.
    return list_companies()
