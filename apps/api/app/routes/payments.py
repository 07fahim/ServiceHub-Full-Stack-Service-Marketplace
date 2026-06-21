import uuid
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.config.settings import settings
from app.models.order import Order, OrderStatus
from app.models.transaction import Transaction, TransactionStatus
from app.schemas.payment import PaymentInitiateRequest, PaymentInitiateResponse, TransactionOut
from app.services.dependencies import get_current_user
from app.models.user import User

try:
    from sslcommerz_lib import SSLCOMMERZ
    SSLCOMMERZ_AVAILABLE = True
except ImportError:
    SSLCOMMERZ_AVAILABLE = False

router = APIRouter(prefix="/payments", tags=["payments"])


def _get_sslcz():
    if not SSLCOMMERZ_AVAILABLE:
        raise HTTPException(status_code=500, detail="sslcommerz-lib not installed. Run: pip install sslcommerz-lib")
    return SSLCOMMERZ({
        "store_id": settings.SSLCOMMERZ_STORE_ID,
        "store_pass": settings.SSLCOMMERZ_STORE_PASSWD,
        "issandbox": settings.SSLCOMMERZ_IS_SANDBOX,
    })


@router.post("/initiate", response_model=PaymentInitiateResponse)
def initiate_payment(
    data: PaymentInitiateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(
        Order.id == data.order_id,
        Order.user_id == current_user.id,
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != OrderStatus.pending:
        raise HTTPException(status_code=400, detail="Order is not in a payable state")

    tran_id = f"TXN-{order.id}"

    base = settings.BACKEND_URL + "/api/v1/payments"
    post_body = {
        "total_amount": float(order.total_amount),
        "currency": "BDT",
        "tran_id": tran_id,
        "success_url": f"{base}/success",
        "fail_url": f"{base}/fail",
        "cancel_url": f"{base}/cancel",
        "ipn_url": f"{base}/ipn",
        "emi_option": 0,
        "cus_name": current_user.full_name,
        "cus_email": current_user.email,
        "cus_phone": current_user.phone or "01700000000",
        "cus_add1": order.address or "N/A",
        "cus_city": "Dhaka",
        "cus_country": "Bangladesh",
        "shipping_method": "NO",
        "num_of_item": 1,
        "product_name": "Service Booking",
        "product_category": "Service",
        "product_profile": "general",
    }

    sslcz = _get_sslcz()
    response = sslcz.createSession(post_body)

    if response.get("status") != "SUCCESS":
        raise HTTPException(
            status_code=502,
            detail=f"SSLCommerz session creation failed: {response.get('failedreason', 'Unknown error')}",
        )

    # Persist or update transaction record
    existing = db.query(Transaction).filter(Transaction.order_id == order.id).first()
    if existing:
        existing.gateway_tran_id = tran_id
        existing.status = TransactionStatus.pending
    else:
        db.add(Transaction(
            order_id=order.id,
            gateway_tran_id=tran_id,
            amount=order.total_amount,
            currency="BDT",
            status=TransactionStatus.pending,
        ))
    db.commit()

    return PaymentInitiateResponse(
        gateway_url=response["GatewayPageURL"],
        tran_id=tran_id,
    )


@router.post("/success")
async def payment_success(request: Request, db: Session = Depends(get_db)):
    form = await request.form()
    tran_id = form.get("tran_id", "")
    val_id = form.get("val_id", "")
    status = form.get("status", "")

    if status != "VALID" and status != "VALIDATED":
        # Optionally validate via SSLCommerz API
        try:
            sslcz = _get_sslcz()
            validation = sslcz.validationTransaction(val_id)
            status = validation.get("status", "FAILED")
        except Exception:
            pass

    tx = db.query(Transaction).filter(Transaction.gateway_tran_id == tran_id).first()
    if tx:
        tx.gateway_val_id = val_id
        if status in ("VALID", "VALIDATED"):
            tx.status = TransactionStatus.succeeded
            order = db.query(Order).filter(Order.id == tx.order_id).first()
            if order:
                order.status = OrderStatus.confirmed
        else:
            tx.status = TransactionStatus.failed
        db.commit()

    order_id = tran_id.replace("TXN-", "")
    return RedirectResponse(
        url=f"{settings.FRONTEND_URL}/order-success/{order_id}?status=success",
        status_code=303,
    )


@router.post("/fail")
async def payment_fail(request: Request, db: Session = Depends(get_db)):
    form = await request.form()
    tran_id = form.get("tran_id", "")

    tx = db.query(Transaction).filter(Transaction.gateway_tran_id == tran_id).first()
    if tx:
        tx.status = TransactionStatus.failed
        db.commit()

    order_id = tran_id.replace("TXN-", "")
    return RedirectResponse(
        url=f"{settings.FRONTEND_URL}/order-success/{order_id}?status=failed",
        status_code=303,
    )


@router.post("/cancel")
async def payment_cancel(request: Request, db: Session = Depends(get_db)):
    form = await request.form()
    tran_id = form.get("tran_id", "")

    tx = db.query(Transaction).filter(Transaction.gateway_tran_id == tran_id).first()
    if tx:
        tx.status = TransactionStatus.cancelled
        db.commit()

    order_id = tran_id.replace("TXN-", "")
    return RedirectResponse(
        url=f"{settings.FRONTEND_URL}/order-success/{order_id}?status=cancelled",
        status_code=303,
    )


@router.post("/ipn")
async def payment_ipn(request: Request, db: Session = Depends(get_db)):
    """Instant Payment Notification — silent background update from SSLCommerz."""
    form = await request.form()
    tran_id = form.get("tran_id", "")
    val_id = form.get("val_id", "")
    status = form.get("status", "")

    tx = db.query(Transaction).filter(Transaction.gateway_tran_id == tran_id).first()
    if tx:
        tx.gateway_val_id = val_id
        if status in ("VALID", "VALIDATED"):
            tx.status = TransactionStatus.succeeded
            order = db.query(Order).filter(Order.id == tx.order_id).first()
            if order:
                order.status = OrderStatus.confirmed
        elif status == "FAILED":
            tx.status = TransactionStatus.failed
        db.commit()

    return {"received": True}


@router.get("/transaction/{order_id}", response_model=TransactionOut)
def get_transaction(
    order_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    tx = db.query(Transaction).filter(Transaction.order_id == order_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx
