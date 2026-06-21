from pydantic import BaseModel
from decimal import Decimal
import uuid
from datetime import datetime
from app.schemas.vendor import VendorProfileOut
from app.schemas.category import CategoryOut


class ServiceCreate(BaseModel):
    category_id: uuid.UUID
    name: str
    description: str | None = None
    price: Decimal
    duration_minutes: int | None = None


class ServiceUpdate(BaseModel):
    category_id: uuid.UUID | None = None
    name: str | None = None
    description: str | None = None
    price: Decimal | None = None
    duration_minutes: int | None = None
    is_active: bool | None = None


class ServiceOut(BaseModel):
    id: uuid.UUID
    vendor_id: uuid.UUID
    category_id: uuid.UUID | None
    name: str
    description: str | None
    price: Decimal
    duration_minutes: int | None
    is_active: bool
    created_at: datetime
    vendor: VendorProfileOut | None = None
    category: CategoryOut | None = None

    model_config = {"from_attributes": True}
