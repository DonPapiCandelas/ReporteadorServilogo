# app/reports/report_schemas.py
from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Optional
import datetime

# Es la versión Pydantic de tu dataclass 'ReceivableEntry'
class ReceivableEntry(BaseModel):
    customer_name: str
    module: Optional[str] = None
    invoice_date: datetime.date
    folio: Optional[str] = None    # <-- ¡AQUÍ ESTÁ LA CORRECCIÓN!
    arrival_date: datetime.date
    due_date: datetime.date
    reference: Optional[str] = None
    currency: Optional[str] = None
    fx_rate: float
    subtotal: float
    total: float
    paid: float
    balance: float
    days_since: int
    aging_bucket: str

    model_config = ConfigDict(from_attributes=True)

# Es la versión Pydantic de tu dataclass 'AgingSummary'
class AgingSummary(BaseModel):
    total_balance: float = 0.0
    not_yet_due: float = 0.0
    overdue: float = 0.0
    bucket_0_21: float = 0.0
    bucket_22_30: float = 0.0
    bucket_31_45: float = 0.0
    bucket_45_plus: float = 0.0

    model_config = ConfigDict(from_attributes=True)

# Es la versión Pydantic de tu dataclass 'CurrencyGroup'
class CurrencyGroup(BaseModel):
    currency: str
    entries: List[ReceivableEntry]
    totals: Dict[str, float]
    aging_summary: Dict[str, AgingSummary] # { 'customer_name': AgingSummary }

    model_config = ConfigDict(from_attributes=True)

# Este será el modelo de respuesta de nuestro endpoint de preview
class ReceivablesReportData(BaseModel):
    # La clave será la moneda (ej. "USD", "MXN")
    data_by_currency: Dict[str, CurrencyGroup]

    model_config = ConfigDict(from_attributes=True)

# Este será el modelo de ENTRADA (los filtros que envía React)
class ReportFilters(BaseModel):
    as_of: datetime.date
    customer_id: Optional[int] = None
    customer_name: Optional[str] = "(All Customers)"