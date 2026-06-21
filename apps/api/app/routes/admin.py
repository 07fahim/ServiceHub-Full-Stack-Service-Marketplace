from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.user import User
from app.models.vendor import VendorProfile
from app.models.order import Order
from app.schemas.auth import UserOut
from app.schemas.vendor import VendorProfileOut
from app.schemas.order import OrderOut
from app.services.dependencies import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(User).all()


@router.patch("/users/{user_id}/toggle-active", response_model=UserOut)
def toggle_user(user_id: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user


@router.get("/vendors", response_model=list[VendorProfileOut])
def list_vendors(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(VendorProfile).all()


@router.patch("/vendors/{vendor_id}/verify", response_model=VendorProfileOut)
def verify_vendor(vendor_id: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    vendor = db.query(VendorProfile).filter(VendorProfile.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    vendor.is_verified = True
    db.commit()
    db.refresh(vendor)
    return vendor


@router.get("/orders", response_model=list[OrderOut])
def list_all_orders(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(Order).order_by(Order.created_at.desc()).all()
