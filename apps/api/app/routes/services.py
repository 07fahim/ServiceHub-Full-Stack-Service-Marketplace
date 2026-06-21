import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.config.database import get_db
from app.models.service import Service
from app.models.vendor import VendorProfile
from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceOut
from app.services.dependencies import get_current_user, require_vendor
from app.models.user import User

router = APIRouter(prefix="/services", tags=["services"])


@router.get("", response_model=list[ServiceOut])
def list_services(
    category_id: uuid.UUID | None = Query(None),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Service).options(
        joinedload(Service.vendor),
        joinedload(Service.category),
    ).filter(Service.is_active == True)

    if category_id:
        q = q.filter(Service.category_id == category_id)
    if search:
        q = q.filter(Service.name.ilike(f"%{search}%"))

    return q.all()


@router.get("/{service_id}", response_model=ServiceOut)
def get_service(service_id: uuid.UUID, db: Session = Depends(get_db)):
    svc = db.query(Service).options(
        joinedload(Service.vendor),
        joinedload(Service.category),
    ).filter(Service.id == service_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    return svc


@router.post("", response_model=ServiceOut, status_code=201)
def create_service(
    data: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    vendor = db.query(VendorProfile).filter(VendorProfile.user_id == current_user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found. Create one first.")
    svc = Service(vendor_id=vendor.id, **data.model_dump())
    db.add(svc)
    db.commit()
    db.refresh(svc)
    return svc


@router.patch("/{service_id}", response_model=ServiceOut)
def update_service(
    service_id: uuid.UUID,
    data: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    vendor = db.query(VendorProfile).filter(VendorProfile.user_id == current_user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    svc = db.query(Service).filter(Service.id == service_id, Service.vendor_id == vendor.id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(svc, field, value)
    db.commit()
    db.refresh(svc)
    return svc


@router.delete("/{service_id}", status_code=204)
def delete_service(
    service_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_vendor),
):
    vendor = db.query(VendorProfile).filter(VendorProfile.user_id == current_user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    svc = db.query(Service).filter(Service.id == service_id, Service.vendor_id == vendor.id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    svc.is_active = False
    db.commit()
