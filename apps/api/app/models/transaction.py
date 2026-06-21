import uuid
import enum
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Numeric, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.config.database import Base
from decimal import Decimal


class TransactionStatus(str, enum.Enum):
    pending = "pending"
    succeeded = "succeeded"
    failed = "failed"
    cancelled = "cancelled"
    refunded = "refunded"


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False)
    # SSLCommerz transaction ID (tran_id sent to gateway) and val_id returned after payment
    gateway_tran_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    gateway_val_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="BDT")
    status: Mapped[TransactionStatus] = mapped_column(SAEnum(TransactionStatus), nullable=False, default=TransactionStatus.pending)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    order: Mapped["Order"] = relationship("Order", back_populates="transaction")
