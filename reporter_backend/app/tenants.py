# app/tenants.py
"""Multi-empresa (multi-tenant) configuration.

El frontend envía una clave de empresa (tenant) en el header: X-Company
y el backend resuelve a qué base de datos conectarse.

IMPORTANTE:
- NO aceptar nombres de BD arbitrarios desde el usuario.
- Solo permitir claves en este diccionario (whitelist).
"""

import os
from typing import Dict, Any, List

# --- Mapeo de empresa -> Base de Datos ---
# Puedes sobreescribir con variables de entorno:
#   DB_GROWERS_UNION=GROWERS_UNION_2025
#   DB_SOFRESCO=SOFRESCO_GMBH_25
# Si no se define, Growers usa DB_DATABASE (compatibilidad con tu .env actual).
TENANTS: Dict[str, Dict[str, Any]] = {
    "growers_union": {
        "name": "Growers Union",
        "database": os.getenv("DB_GROWERS_UNION", os.getenv("DB_DATABASE", "GROWERS_UNION_2025")),
    },
    "sofresco": {
        "name": "Sofresco GmbH",
        "database": os.getenv("DB_SOFRESCO", "SOFRESCO_GMBH_25"),
    },
    "produce_lovers": {
        "name": "Produce Lovers",
        "database": os.getenv("DB_PRODUCE_LOVERS", "PRODUCE_LOVERS_2025"),
    },
    "licencias": {
        "name": "Licencias y Servicios",
        "database": os.getenv("DB_LICENCIAS", "LICENCIAS_Y_SERVICIOS_PRODUCE"),
    },
}

DEFAULT_COMPANY = os.getenv("DEFAULT_COMPANY", "growers_union")

def get_company_or_default(company_key: str | None) -> str:
    key = (company_key or "").strip() or DEFAULT_COMPANY
    if key not in TENANTS:
        raise KeyError(key)
    return key

def list_companies() -> List[dict]:
    return [{"key": k, "name": v.get("name", k)} for k, v in TENANTS.items()]
