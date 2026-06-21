import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out successfully')
    navigate('/login')
  }

  const dashboardLink = () => {
    if (!user) return '/login'
    if (user.role === 'admin') return '/admin'
    if (user.role === 'vendor') return '/vendor'
    return '/dashboard'
  }

  const roleLabel = () => {
    if (user?.role === 'admin') return 'Admin'
    if (user?.role === 'vendor') return 'Vendor'
    return 'Customer'
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">ServiceHub</Link>

        <div className="nav-links">
          <Link to="/services" className="nav-link">Browse</Link>

          {user ? (
            <>
              <Link to={dashboardLink()} className="nav-link">Dashboard</Link>
              <span className="nav-user">{user.full_name} · {roleLabel()}</span>
              <button
                onClick={handleLogout}
                className="btn btn-sm"
                style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-border)', marginLeft: '0.25rem' }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Sign in</Link>
              <Link
                to="/register"
                className="btn btn-primary btn-sm"
                style={{ marginLeft: '0.25rem' }}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
