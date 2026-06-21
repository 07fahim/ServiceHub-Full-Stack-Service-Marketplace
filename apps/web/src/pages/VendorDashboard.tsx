import { useEffect, useState, FormEvent } from 'react'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { VendorProfile, Service, Order, Category } from '@/lib/types'
import toast from 'react-hot-toast'

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-amber', confirmed: 'badge-blue', in_progress: 'badge-violet',
  completed: 'badge-green', cancelled: 'badge-red',
}

export default function VendorDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<VendorProfile | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tab, setTab] = useState<'overview' | 'services' | 'orders'>('overview')
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [editService, setEditService] = useState<Service | null>(null)
  const [pf, setPf] = useState({ business_name: '', description: '', address: '' })
  const [sf, setSf] = useState({ name: '', description: '', price: '', category_id: '', duration_minutes: '' })

  const refreshServices = (vendorId: string) =>
    api.get('/services').then(r => setServices(r.data.filter((s: Service) => s.vendor_id === vendorId))).catch(() => {})

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {})
    api.get('/vendor/profile')
      .then(r => { setProfile(r.data); setPf({ business_name: r.data.business_name, description: r.data.description ?? '', address: r.data.address ?? '' }); return r.data })
      .then(p => refreshServices(p.id))
      .catch(() => {})
    api.get('/vendor/orders').then(r => setOrders(r.data)).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const { data } = profile ? await api.patch('/vendor/profile', pf) : await api.post('/vendor/profile', pf)
      setProfile(data); setShowProfileForm(false)
      toast.success('Profile saved!')
      await refreshServices(data.id)
    } catch { toast.error('Failed to save profile') }
  }

  const saveService = async (e: FormEvent) => {
    e.preventDefault()
    const payload = { ...sf, price: parseFloat(sf.price), duration_minutes: sf.duration_minutes ? parseInt(sf.duration_minutes) : null }
    try {
      editService ? await api.patch(`/services/${editService.id}`, payload) : await api.post('/services', payload)
      toast.success(editService ? 'Service updated!' : 'Service created!')
      setShowServiceForm(false); setEditService(null)
      setSf({ name: '', description: '', price: '', category_id: '', duration_minutes: '' })
      if (profile) await refreshServices(profile.id)
    } catch { toast.error('Failed to save service') }
  }

  const deleteService = async (id: string) => {
    try { await api.delete(`/services/${id}`); setServices(s => s.filter(x => x.id !== id)); toast.success('Service removed') }
    catch { toast.error('Failed') }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/vendor/orders/${orderId}/status`, { status })
      setOrders(o => o.map(x => x.id === orderId ? { ...x, status: status as Order['status'] } : x))
      toast.success('Status updated')
    } catch { toast.error('Failed') }
  }

  const openEdit = (svc: Service) => {
    setEditService(svc)
    setSf({ name: svc.name, description: svc.description ?? '', price: svc.price, category_id: svc.category_id ?? '', duration_minutes: svc.duration_minutes?.toString() ?? '' })
    setShowServiceForm(true)
  }

  const stats = [
    { label: 'Active services', value: services.filter(s => s.is_active).length, color: 'var(--primary)' },
    { label: 'Total orders',   value: orders.length,                                      color: 'var(--violet)' },
    { label: 'Pending orders', value: orders.filter(o => o.status === 'pending').length,   color: 'var(--amber)'  },
    { label: 'Completed',      value: orders.filter(o => o.status === 'completed').length, color: 'var(--green)'  },
  ]

  return (
    <div className="page">
      {/* Header */}
      <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="dash-title">Vendor Dashboard</h1>
          <p className="dash-sub">{user?.full_name} {profile ? `· ${profile.business_name}` : '— set up your profile to get started'}</p>
        </div>
        <button onClick={() => setShowProfileForm(v => !v)} className="btn btn-secondary btn-md">
          {profile ? '✏️ Edit profile' : '+ Create profile'}
        </button>
      </div>

      {/* Profile form */}
      {showProfileForm && (
        <div className="card card-pad" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--text-1)' }}>Business Profile</h3>
          <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label">Business name</label>
              <input className="form-input" required value={pf.business_name} onChange={e => setPf(f => ({ ...f, business_name: e.target.value }))} placeholder="e.g. Ahmed's Cleaning Services" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input form-textarea" value={pf.description} onChange={e => setPf(f => ({ ...f, description: e.target.value }))} placeholder="Tell customers about your business…" />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-input" value={pf.address} onChange={e => setPf(f => ({ ...f, address: e.target.value }))} placeholder="e.g. Gulshan, Dhaka" />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary btn-md">Save profile</button>
              <button type="button" onClick={() => setShowProfileForm(false)} className="btn btn-secondary btn-md">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        {(['overview','services','orders'] as const).map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'overview' ? 'Overview' : t === 'services' ? `Services (${services.length})` : `Orders (${orders.length})`}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="stats-grid">
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Services */}
      {tab === 'services' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)' }}>My Services</h2>
            {profile && !showServiceForm && (
              <button
                onClick={() => { setEditService(null); setSf({ name: '', description: '', price: '', category_id: '', duration_minutes: '' }); setShowServiceForm(true) }}
                className="btn btn-primary btn-md"
              >+ Add service</button>
            )}
          </div>

          {!profile && <div className="alert alert-warning"><span>⚠️</span><span>Create your business profile first to add services.</span></div>}

          {showServiceForm && (
            <div className="card card-pad" style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>{editService ? 'Edit Service' : 'New Service'}</h3>
              <form onSubmit={saveService} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="form-group"><label className="form-label">Service name</label>
                  <input className="form-input" required value={sf.name} onChange={e => setSf(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Deep House Cleaning" /></div>
                <div className="form-group"><label className="form-label">Description</label>
                  <textarea className="form-input form-textarea" value={sf.description} onChange={e => setSf(f => ({ ...f, description: e.target.value }))} placeholder="Describe your service in detail…" /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group"><label className="form-label">Price (BDT)</label>
                    <input className="form-input" required type="number" min="0" step="0.01" value={sf.price} onChange={e => setSf(f => ({ ...f, price: e.target.value }))} placeholder="0.00" /></div>
                  <div className="form-group"><label className="form-label">Duration (minutes)</label>
                    <input className="form-input" type="number" value={sf.duration_minutes} onChange={e => setSf(f => ({ ...f, duration_minutes: e.target.value }))} placeholder="e.g. 90" /></div>
                </div>
                <div className="form-group"><label className="form-label">Category</label>
                  <select className="form-input form-select" required value={sf.category_id} onChange={e => setSf(f => ({ ...f, category_id: e.target.value }))}>
                    <option value="">Select a category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select></div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="submit" className="btn btn-primary btn-md">{editService ? 'Update' : 'Create'} service</button>
                  <button type="button" onClick={() => { setShowServiceForm(false); setEditService(null) }} className="btn btn-secondary btn-md">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {services.length === 0 && profile && !showServiceForm && (
            <div className="empty"><div className="empty-icon">🛠️</div><div className="empty-text">No services yet. Add your first service!</div></div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {services.map(svc => (
              <div key={svc.id} className="order-row">
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-1)' }}>{svc.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginTop: '0.15rem' }}>
                    {svc.category?.name} · ৳{svc.price} {svc.duration_minutes ? `· ${svc.duration_minutes} min` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className={`badge ${svc.is_active ? 'badge-green' : 'badge-red'}`}>{svc.is_active ? 'Active' : 'Inactive'}</span>
                  <button onClick={() => openEdit(svc)} className="btn btn-secondary btn-sm">Edit</button>
                  <button onClick={() => deleteService(svc.id)} className="btn btn-danger btn-sm">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders */}
      {tab === 'orders' && (
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '1rem' }}>Received Orders</h2>
          {orders.length === 0 ? (
            <div className="empty"><div className="empty-icon">📦</div><div className="empty-text">No orders received yet.</div></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {orders.map(order => (
                <div key={order.id} className="order-row">
                  <div>
                    <div className="order-id">Order #{order.id.slice(0, 8).toUpperCase()}</div>
                    <div className="order-date">{new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                    {order.notes && <div style={{ fontSize: '0.8rem', color: 'var(--text-4)', marginTop: '0.15rem' }}>Note: {order.notes}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, color: 'var(--text-1)' }}>৳{order.total_amount}</span>
                    <span className={`badge ${STATUS_BADGE[order.status] ?? 'badge-gray'}`}>{order.status.replace('_', ' ')}</span>
                    <select
                      className="form-input form-select"
                      style={{ padding: '0.35rem 2rem 0.35rem 0.6rem', fontSize: '0.82rem', width: 'auto', minWidth: '130px' }}
                      value={order.status}
                      onChange={e => updateOrderStatus(order.id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
