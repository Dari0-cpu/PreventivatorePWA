from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from decimal import Decimal
from uuid import UUID

class QuoteLineCreate(BaseModel):
    description: str
    qty: Decimal
    unit_price: Decimal
    vat_rate: int
    sort_order: int

    @field_validator('vat_rate')
    def validate_vat(cls, v):
        if v not in (4, 10, 22):
            raise ValueError("L'aliquota IVA deve essere 4, 10 o 22")
        return v

class QuoteSectionCreate(BaseModel):
    title: str
    is_optional: bool = False
    sort_order: int
    lines: List[QuoteLineCreate] = []

class QuoteCreate(BaseModel):
    client_id: UUID
    object_title: str
    payment_terms: Optional[str] = None
    notes: Optional[str] = None
    sections: List[QuoteSectionCreate] = []