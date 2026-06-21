import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import api from '@/lib/api'
import { Order } from '@/lib/types'
import toast from 'react-hot-toast'

export default function OrderSuccess() {
  const { orderId } = useParams<{ orderId: string }>()
  const [searchParams] = useSearchParams()
  const status = searchParams.get('status') ?? 'success'
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (!orderId) return
    api.get(`/orders/${orderId}`).then(r => setOrder(r.data)).catch(() => toast.error('Could not load order details'))
  }, [orderId])

  const isSuccess = status === 'success'
  const isCancelled = status === 'cancelled'

  const config = isSuccess
    ? { icon: '🎉', title: 'Booking Confirmed!', sub: 'Your payment was processed successfully. The vendor will contact you shortly.', iconBg: 'var(--green-bg)', iconBorder: 'var(--green-border)' }
    : isCancelled
    ? { icon: '🚫', title: 'Payment Cancelled', sub: 'You cancelled the payment. Your order is still pending — you can retry anytime from your dashboard.', iconBg: 'var(--amber-bg)', iconBorder: 'var(--amber-border)' }
    : { icon: '❌', title: 'Payment Failed', sub: 'Your payment could not be completed. Please try again or contact support.', iconBg: 'var(--red-bg)', iconBorder: 'var(--red-border)' }

  return (
    <div className="result-page">
      <div className="result-card">
        {/* Icon */}
        <div style={{ width: '80px', height: '80px', background: config.iconBg, border: `2px solid ${config.iconBorder}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '2.2rem' }}>
          {config.icon}
        </div>

        <h1 className="result-title">{config.title}</h1>
        <p className="result-sub">{config.sub}</p>

        {/* Order details */}
        {order && (
          <div className="checkout-summary" style={{ marginBottom: '1.75rem', textAlign: 'left' }}>
            <div className="checkout-row">
              <span style={{ fontSize: '0.88rem', color: 'var(--text-3)' }}>Order ID</span>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>#{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="checkout-row" style={{ marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-3)' }}>Status</span>
              <span style={{ fontWeight: 600, color: isSuccess ? 'var(--green)' : 'var(--red)', fontSize: '0.88rem' }}>{order.status}</span>
            </div>
            <hr className="divider" />
            <div className="checkout-row">
              <span style={{ fontWeight: 700 }}>Amount</span>
              <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>৳{order.total_amount}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/dashboard" className="btn btn-primary btn-lg">View my orders</Link>
          {!isSuccess && orderId && (
            <Link to={`/checkout/${orderId}`} className="btn btn-success btn-lg">Retry payment</Link>
          )}
          <Link to="/services" className="btn btn-secondary btn-lg">Browse more</Link>
        </div>
      </div>
    </div>
  )
}
