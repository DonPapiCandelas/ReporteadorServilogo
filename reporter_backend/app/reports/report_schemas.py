# app/reports/report_schemas.py
from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Optional, Any
import datetime

# Es la versión Pydantic de tu dataclass 'ReceivableEntry'
class ReceivableEntry(BaseModel):
    customer_name: str
    module: Optional[str] = None
    invoice_date: datetime.date
    folio: Optional[str] = None
    arrival_date: datetime.date
    due_date: datetime.date
    reference: Optional[str] = None
    currency: Optional[str] = None
    fx_rate: float
    subtotal: float
    total: float
    paid: float
    balance: float
    po_balance: float = 0.0
    real_balance: float = 0.0
    days_since: int
    aging_bucket: str
    po: Optional[str] = None

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

class CustomerCreditInfo(BaseModel):
    credit_limit: float
    payment_terms: str
    currency: str

# Es la versión Pydantic de tu dataclass 'CurrencyGroup'
class CurrencyGroup(BaseModel):
    currency: str
    customer_name: Optional[str] = "(All Customers)"
    entries: List[ReceivableEntry] = []
    totals: Dict[str, float] = {}
    aging_summary: Dict[str, AgingSummary] = {}

    model_config = ConfigDict(from_attributes=True)

class ReportFilters(BaseModel):
    as_of: datetime.date
    customer_id: Optional[int] = None
    customer_name: str = "All Customers"
    # New filters
    filter_mode: str = "to_date" # "current_month", "to_date", "date_range"
    start_date: Optional[datetime.date] = None
    end_date: Optional[datetime.date] = None

class ReceivablesReportData(BaseModel):
    data_by_currency: Dict[str, CurrencyGroup]
    customer_credit_info: Optional[CustomerCreditInfo] = None