import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Order } from '@/lib/types'
import toast from 'react-hot-toast'

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-amber', confirmed: 'badge-blue', in_progress: 'badge-violet',
  completed: 'badge-green', cancelled: 'badge-red',
}

export default function UserDashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/orders')
      .then((r) => setOrders(r.data))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    { label: 'Total orders',  value: orders.length,                                      color: 'var(--primary)' },
    { label: 'Pending',       value: orders.filter(o => o.status === 'pending').length,   color: 'var(--amber)'   },
    { label: 'Completed',     value: orders.filter(o => o.status === 'completed').length, color: 'var(--green)'   },
    { label: 'Cancelled',     value: orders.filter(o => o.status === 'cancelled').length, color: 'var(--red)'     },
  ]

  return (
    <div className="page">
      {/* Header */}
      <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="dash-title">Welcome back, {user?.full_name?.split(' ')[0]} 👋</h1>
          <p className="dash-sub">Here's an overview of your bookings</p>
        </div>
        <Link to="/services" className="btn btn-primary btn-md">+ Book a service</Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Browse CTA */}
      <div className="alert alert-info" style={{ marginBottom: '1.75rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <span>🛠️ <strong>Need something done?</strong> Browse services from verified vendors near you.</span>
        <Link to="/services" className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>Browse services →</Link>
      </div>

      {/* Orders */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-1)' }}>My Orders</h2>

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : orders.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📋</div>
          <div className="empty-text">No orders yet. <Link to="/services" style={{ color: 'var(--primary)' }}>Book your first service!</Link></div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {orders.map((order) => (
            <div key={order.id} className="order-row">
              <div>
                <div className="order-id">Order #{order.id.slice(0, 8).toUpperCase()}</div>
                <div className="order-date">{new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                {order.scheduled_at && (
                  <div className="order-date">📅 {new Date(order.scheduled_at).toLocaleString()}</div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-1)' }}>৳{order.total_amount}</span>
                <span className={`badge ${STATUS_BADGE[order.status] ?? 'badge-gray'}`}>
                  {order.status.replace('_', ' ')}
                </span>
                {order.status === 'pending' && (
                  <Link to={`/checkout/${order.id}`} className="btn btn-success btn-sm">Pay now</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
