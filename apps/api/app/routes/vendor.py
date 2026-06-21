from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.vendor import VendorProfile
from app.models.order import Order
from app.schemas.vendor import VendorProfileCreate, VendorProfileUpdate, VendorProfileOut
from app.schemas.order import OrderOut, OrderStatusUpdate
from app.services.dependencies import require_vendor
from app.models.user import User

router = APIRouter(prefix="/vendor", tags=["vendor"])


@router.post("/profile", response_model=VendorProfileOut, status_code=201)
def create_profile(
    data: VendorProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    if db.query(VendorProfile).filter(VendorProfile.user_id == current_user.id).first():
        raise HTTPException(status_code=400, detail="Vendor profile already exists")
    profile = VendorProfile(user_id=current_user.id, **data.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/profile", response_model=VendorProfileOut)
def get_profile(db: Session = Depends(get_db), current_user: User = Depends(require_vendor)):
    profile = db.query(VendorProfile).filter(VendorProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    return profile


@router.patch("/profile", response_model=VendorProfileOut)
def update_profile(
    data: VendorProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    profile = db.query(VendorProfile).filter(VendorProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/orders", response_model=list[OrderOut])
def vendor_orders(db: Session = Depends(get_db), current_user: User = Depends(require_vendor)):
    profile = db.query(VendorProfile).filter(VendorProfile.user_id == current_user.id).first()
    if not profile:
        return []
    return db.query(Order).filter(Order.vendor_id == profile.id).order_by(Order.created_at.desc()).all()


@router.patch("/orders/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: str,
    data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    profile = db.query(VendorProfile).filter(VendorProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    order = db.query(Order).filter(Order.id == order_id, Order.vendor_id == profile.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = data.status
    db.commit()
    db.refresh(order)
    return order
