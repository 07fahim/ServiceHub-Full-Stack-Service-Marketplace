from pydantic import BaseModel
import uuid
from datetime import datetime


class CategoryCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None
    icon: str | None = None


class CategoryOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: str | None
    icon: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
