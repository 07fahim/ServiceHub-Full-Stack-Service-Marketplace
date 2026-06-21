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

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const me = await login(email, password)
      toast.success('Welcome back!')
      navigate(DASHBOARD[me.role])
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Invalid credentials'
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
            Welcome back
          </h1>
          <p style={{ color: '#a5b4fc', fontSize: '0.9rem' }}>Sign in to your account to continue</p>
        </div>

        {/* Form */}
        <div className="auth-body">
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className="form-input"
                type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="btn btn-primary btn-lg btn-full"
              style={{ marginTop: '0.25rem' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-3)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create one free</Link>
          </p>

          {/* Demo credentials */}
          <div className="alert alert-info" style={{ marginTop: '1.25rem', fontSize: '0.8rem' }}>
            <span>🔑</span>
            <span><strong>Demo admin:</strong> admin@marketplace.com / Admin1234!</span>
          </div>
        </div>
      </div>
    </div>
  )
}
