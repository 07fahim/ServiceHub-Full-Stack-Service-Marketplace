import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '@/lib/api'
import { Order } from '@/lib/types'
import toast from 'react-hot-toast'

export default function Checkout() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    if (!orderId) {
      navigate('/dashboard', { replace: true })
      return
    }
    api.get(`/orders/${orderId}`)
      .then((r) => setOrder(r.data))
      .catch(() => { toast.error('Order not found'); navigate('/dashboard') })
      .finally(() => setLoading(false))
  }, [orderId, navigate])

  const handlePay = async () => {
    if (!orderId) return
    setPaying(true)
    try {
      const { data } = await api.post('/payments/initiate', { order_id: orderId })
      window.location.href = data.gateway_url
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to initiate payment'
      toast.error(msg)
      setPaying(false)
    }
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>
  if (!order) return (
    <div className="result-page">
      <div className="result-card">
        <div className="result-icon">❌</div>
        <div className="result-title">Order not found</div>
        <p className="result-sub">This order doesn't exist or you don't have access to it.</p>
        <Link to="/dashboard" className="btn btn-primary btn-lg">Back to dashboard</Link>
      </div>
    </div>
  )

  return (
    <div className="result-page" style={{ alignItems: 'flex-start', paddingTop: '3rem' }}>
      <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
        {/* Back link */}
        <Link to="/dashboard" style={{ fontSize: '0.85rem', color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1.25rem' }}>
          ← Back to dashboard
        </Link>

        <div className="card card-pad-lg">
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.4px', marginBottom: '0.25rem' }}>
            Checkout
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
            Review your order and pay securely
          </p>

          {/* Order summary */}
          <div className="checkout-summary" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.85rem' }}>
              Order Summary
            </h3>
            <div className="checkout-row">
              <span style={{ fontSize: '0.88rem', color: 'var(--text-3)' }}>Order ID</span>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>#{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
            {order.scheduled_at && (
              <div className="checkout-row">
                <span style={{ fontSize: '0.88rem', color: 'var(--text-3)' }}>Scheduled</span>
                <span style={{ fontSize: '0.85rem' }}>{new Date(order.scheduled_at).toLocaleString()}</span>
              </div>
            )}
            {order.address && (
              <div className="checkout-row" style={{ alignItems: 'flex-start', gap: '1rem' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-3)', flexShrink: 0 }}>Address</span>
                <span style={{ fontSize: '0.85rem', textAlign: 'right' }}>{order.address}</span>
              </div>
            )}
            <div className="checkout-row" style={{ marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-3)' }}>Status</span>
              <span className="badge badge-amber">{order.status}</span>
            </div>
            <hr className="divider" />
            <div className="checkout-row">
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Total</span>
              <span className="checkout-total">৳{order.total_amount}</span>
            </div>
          </div>

          {/* Notices */}
          <div className="alert alert-warning" style={{ marginBottom: '0.75rem' }}>
            <span>🔒</span>
            <span>You'll be redirected to <strong>SSLCommerz</strong> to complete payment. No card data is stored on our servers.</span>
          </div>
          <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
            <span>🧪</span>
            <span><strong>Sandbox mode</strong> — use SSLCommerz test credentials. No real charge applies.</span>
          </div>

          {/* Pay button */}
          <button
            onClick={handlePay}
            disabled={paying || order.status !== 'pending'}
            className={`btn btn-xl btn-full ${order.status === 'pending' ? 'btn-success' : 'btn-secondary'}`}
          >
            {paying
              ? 'Redirecting to SSLCommerz…'
              : order.status !== 'pending'
              ? 'Already processed'
              : '🔐 Pay ৳' + order.total_amount + ' with SSLCommerz'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-4)' }}>
            By completing payment you agree to our terms of service.
          </p>
        </div>
      </div>
    </div>
  )
}
