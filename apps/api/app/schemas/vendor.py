from pydantic import BaseModel
import uuid
from datetime import datetime


class VendorProfileCreate(BaseModel):
    business_name: str
    description: str | None = None
    address: str | None = None


class VendorProfileUpdate(BaseModel):
    business_name: str | None = None
    description: str | None = None
    address: str | None = None


class VendorProfileOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    business_name: str
    description: str | None
    address: str | None
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}
