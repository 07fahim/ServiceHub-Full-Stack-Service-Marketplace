import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { User, VendorProfile, Order } from '@/lib/types'
import toast from 'react-hot-toast'

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-amber', confirmed: 'badge-blue', in_progress: 'badge-violet',
  completed: 'badge-green', cancelled: 'badge-red',
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<'users' | 'vendors' | 'orders'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [vendors, setVendors] = useState<VendorProfile[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    api.get('/admin/users').then(r => setUsers(r.data)).catch(() => {})
    api.get('/admin/vendors').then(r => setVendors(r.data)).catch(() => {})
    api.get('/admin/orders').then(r => setOrders(r.data)).catch(() => {})
  }, [])

  const toggleUser = async (id: string) => {
    try { const { data } = await api.patch(`/admin/users/${id}/toggle-active`); setUsers(u => u.map(x => x.id === id ? data : x)); toast.success('User status updated') }
    catch { toast.error('Failed') }
  }

  const verifyVendor = async (id: string) => {
    try { const { data } = await api.patch(`/admin/vendors/${id}/verify`); setVendors(v => v.map(x => x.id === id ? data : x)); toast.success('Vendor verified!') }
    catch { toast.error('Failed') }
  }

  const roleClass: Record<string, string> = { admin: 'badge-amber', vendor: 'badge-violet', end_user: 'badge-blue' }
  const roleLabel: Record<string, string> = { admin: 'Admin', vendor: 'Vendor', end_user: 'Customer' }

  const stats = [
    { label: 'Total users',        value: users.length,                           color: 'var(--primary)' },
    { label: 'Vendors',            value: vendors.length,                         color: 'var(--violet)'  },
    { label: 'Awaiting verification', value: vendors.filter(v => !v.is_verified).length, color: 'var(--amber)' },
    { label: 'Total orders',       value: orders.length,                          color: 'var(--green)'   },
  ]

  return (
    <div className="page">
      <div className="dash-header">
        <h1 className="dash-title">Admin Panel</h1>
        <p className="dash-sub">Platform-wide oversight and management</p>
      </div>

      <div className="stats-grid">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        {(['users', 'vendors', 'orders'] as const).map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'users' ? `Users (${users.length})` : t === 'vendors' ? `Vendors (${vendors.length})` : `Orders (${orders.length})`}
          </button>
        ))}
      </div>

      {/* Users */}
      {tab === 'users' && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-1)' }}>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td><span className={`badge ${roleClass[u.role] ?? 'badge-gray'}`}>{roleLabel[u.role] ?? u.role}</span></td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => toggleUser(u.id)} className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`}>
                      {u.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Vendors */}
      {tab === 'vendors' && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Business</th><th>Address</th><th>Verified</th><th>Action</th></tr>
            </thead>
            <tbody>
              {vendors.map(v => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-1)' }}>{v.business_name}</td>
                  <td>{v.address ?? <span style={{ color: 'var(--text-4)' }}>—</span>}</td>
                  <td>
                    {v.is_verified
                      ? <span className="badge badge-green">✓ Verified</span>
                      : <span className="badge badge-amber">Pending</span>}
                  </td>
                  <td>
                    {!v.is_verified && (
                      <button onClick={() => verifyVendor(v.id)} className="btn btn-success btn-sm">Verify</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Orders */}
      {tab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {orders.length === 0 ? (
            <div className="empty"><div className="empty-icon">📦</div><div className="empty-text">No orders yet.</div></div>
          ) : orders.map(o => (
            <div key={o.id} className="order-row">
              <div>
                <div className="order-id">#{o.id.slice(0, 8).toUpperCase()}</div>
                <div className="order-date">{new Date(o.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span style={{ fontWeight: 800 }}>৳{o.total_amount}</span>
                <span className={`badge ${STATUS_BADGE[o.status] ?? 'badge-gray'}`}>{o.status.replace('_', ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
