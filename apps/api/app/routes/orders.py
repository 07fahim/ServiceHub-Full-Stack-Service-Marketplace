import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.order import Order
from app.models.service import Service
from app.schemas.order import OrderCreate, OrderOut
from app.services.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderOut, status_code=201)
def create_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = db.query(Service).filter(Service.id == data.service_id, Service.is_active == True).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    order = Order(
        user_id=current_user.id,
        service_id=service.id,
        vendor_id=service.vendor_id,
        total_amount=service.price,
        scheduled_at=data.scheduled_at,
        address=data.address,
        notes=data.notes,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.get("", response_model=list[OrderOut])
def my_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
