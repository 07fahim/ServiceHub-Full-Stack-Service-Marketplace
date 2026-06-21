import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { UserRole } from '@/lib/types'
import toast from 'react-hot-toast'

const DASHBOARD: Record<UserRole, string> = {
  admin: '/admin',
  vendor: '/vendor',
  end_user: '/dashboard',
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '', role: 'end_user' as 'end_user' | 'vendor',
  })
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const me = await register(form)
      toast.success('Account created! Welcome to ServiceHub.')
      navigate(DASHBOARD[me.role])
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Registration failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Header */}
        <div className="auth-header">
          <Link to="/" style={{ display: 'inline-block', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#c7d2fe', letterSpacing: '-0.3px' }}>
              ← ServiceHub
            </span>
          </Link>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: '0.3rem' }}>
            Create your account
          </h1>
          <p style={{ color: '#a5b4fc', fontSize: '0.9rem' }}>Join thousands of happy customers and vendors</p>
        </div>

        {/* Form */}
        <div className="auth-body">
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input className="form-input" required value={form.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder="John Doe" />
            </div>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input className="form-input" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>(optional)</span></label>
              <input className="form-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+880 1700 000000" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" required value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Create a strong password" />
            </div>
            <div className="form-group">
              <label className="form-label">I am a…</label>
              <select className="form-input form-select" value={form.role} onChange={(e) => set('role', e.target.value)}>
                <option value="end_user">Customer — looking for services</option>
                <option value="vendor">Vendor — offering services</option>
              </select>
            </div>
            <button
              type="submit" disabled={loading}
              className="btn btn-primary btn-lg btn-full"
              style={{ marginTop: '0.25rem' }}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-3)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
