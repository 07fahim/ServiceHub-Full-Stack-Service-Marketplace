import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '@/lib/api'
import { Service } from '@/lib/types'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    api.get(`/services/${id}`)
      .then((r) => setService(r.data))
      .catch(() => toast.error('Service not found'))
      .finally(() => setLoading(false))
  }, [id])

  const handleBook = async () => {
    if (!user) { navigate('/login'); return }
    setBooking(true)
    try {
      const { data: order } = await api.post('/orders', { service_id: id })
      toast.success('Order created!')
      navigate(`/checkout/${order.id}`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Booking failed'
      toast.error(msg)
    } finally {
      setBooking(false)
    }
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>
  if (!service) return (
    <div className="result-page">
      <div className="result-card">
        <div className="result-icon">😕</div>
        <div className="result-title">Service not found</div>
        <Link to="/services" className="btn btn-primary btn-lg" style={{ marginTop: '1rem' }}>Browse services</Link>
      </div>
    </div>
  )

  const canBook = user && user.role === 'end_user'

  return (
    <div className="page-md" style={{ paddingTop: '2.5rem' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-4)' }}>
        <Link to="/services" style={{ color: 'var(--text-3)' }}>Services</Link>
        {service.category && <> · <Link to={`/services?category_id=${service.category.id}`} style={{ color: 'var(--text-3)' }}>{service.category.name}</Link></>}
        {' '}· <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>{service.name}</span>
      </div>

      <div className="card card-pad-lg">
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <div>
            {service.category && (
              <span className="badge badge-primary" style={{ marginBottom: '0.6rem', display: 'inline-block' }}>
                {service.category.name}
              </span>
            )}
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
              {service.name}
            </h1>
            {service.vendor && (
              <p style={{ color: 'var(--text-3)', marginTop: '0.4rem', fontSize: '0.9rem' }}>
                by <strong style={{ color: 'var(--text-2)' }}>{service.vendor.business_name}</strong>
                {service.vendor.is_verified && <span className="verified" style={{ marginLeft: '6px' }}>✓ Verified</span>}
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-1px' }}>৳{service.price}</div>
            {service.duration_minutes && (
              <div className="badge badge-gray" style={{ marginTop: '0.3rem' }}>⏱ {service.duration_minutes} min</div>
            )}
          </div>
        </div>

        <hr className="divider" />

        {/* Description */}
        <h3 style={{ fontWeight: 700, color: 'var(--text-1)', marginBottom: '0.6rem' }}>About this service</h3>
        <p style={{ color: 'var(--text-3)', lineHeight: 1.75, fontSize: '0.95rem' }}>
          {service.description || 'No description provided by the vendor.'}
        </p>

        {/* Vendor address */}
        {service.vendor?.address && (
          <p style={{ marginTop: '1rem', color: 'var(--text-3)', fontSize: '0.88rem' }}>
            📍 {service.vendor.address}
          </p>
        )}

        <hr className="divider" />

        {/* CTA */}
        {canBook ? (
          <button
            onClick={handleBook}
            disabled={booking}
            className="btn btn-success btn-xl btn-full"
          >
            {booking ? 'Creating booking…' : 'Book this service'}
          </button>
        ) : user?.role === 'vendor' || user?.role === 'admin' ? (
          <div className="alert alert-info">
            <span>ℹ️</span>
            <span>Only customers can book services. Switch to a customer account to book.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/login" className="btn btn-primary btn-xl" style={{ flex: 1 }}>Sign in to book</Link>
            <Link to="/register" className="btn btn-outline-primary btn-xl" style={{ flex: 1 }}>Create account</Link>
          </div>
        )}
      </div>
    </div>
  )
}
