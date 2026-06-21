from pydantic import BaseModel
from decimal import Decimal
import uuid
from datetime import datetime
from app.models.transaction import TransactionStatus


class PaymentInitiateRequest(BaseModel):
    order_id: uuid.UUID


class PaymentInitiateResponse(BaseModel):
    gateway_url: str
    tran_id: str


class TransactionOut(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    gateway_tran_id: str | None
    gateway_val_id: str | None
    amount: Decimal
    currency: str
    status: TransactionStatus
    created_at: datetime

    model_config = {"from_attributes": True}
