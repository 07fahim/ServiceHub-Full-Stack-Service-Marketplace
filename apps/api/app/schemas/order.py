from pydantic import BaseModel
from decimal import Decimal
import uuid
from datetime import datetime
from app.models.order import OrderStatus


class OrderCreate(BaseModel):
    service_id: uuid.UUID
    scheduled_at: datetime | None = None
    address: str | None = None
    notes: str | None = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    service_id: uuid.UUID | None
    vendor_id: uuid.UUID | None
    status: OrderStatus
    scheduled_at: datetime | None
    address: str | None
    notes: str | None
    total_amount: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}
