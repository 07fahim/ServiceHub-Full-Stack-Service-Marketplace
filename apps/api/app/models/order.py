import uuid
import enum
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, Numeric, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.config.database import Base
from decimal import Decimal


class OrderStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    service_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("services.id", ondelete="SET NULL"), nullable=True)
    vendor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vendor_profiles.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[OrderStatus] = mapped_column(SAEnum(OrderStatus), nullable=False, default=OrderStatus.pending)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="orders")
    service: Mapped["Service"] = relationship("Service", back_populates="orders")
    vendor: Mapped["VendorProfile"] = relationship("VendorProfile", back_populates="orders")
    transaction: Mapped["Transaction"] = relationship("Transaction", back_populates="order", uselist=False)
