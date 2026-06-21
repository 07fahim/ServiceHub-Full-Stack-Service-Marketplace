import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import api from '@/lib/api'
import { User, TokenResponse } from '@/lib/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (data: RegisterData) => Promise<User>
  logout: () => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  full_name: string
  phone?: string
  role: 'end_user' | 'vendor'
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token')
      if (!token) { setLoading(false); return }
      try {
        const res = await api.get('/auth/me')
        setUser(res.data)
      } catch {
        // Access token expired — try refresh token before logging out
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          try {
            const { data } = await api.post('/auth/refresh', { refresh_token: refreshToken })
            localStorage.setItem('access_token', data.access_token)
            localStorage.setItem('refresh_token', data.refresh_token)
            const me = await api.get('/auth/me')
            setUser(me.data)
          } catch {
            localStorage.clear()
            setUser(null)
          }
        } else {
          localStorage.clear()
          setUser(null)
        }
      } finally {
        setLoading(false)
      }
    }
    initAuth()
  }, [])

  const storeTokens = (tokens: TokenResponse) => {
    localStorage.setItem('access_token', tokens.access_token)
    localStorage.setItem('refresh_token', tokens.refresh_token)
  }

  const login = async (email: string, password: string): Promise<User> => {
    const { data } = await api.post<TokenResponse>('/auth/login', { email, password })
    storeTokens(data)
    const me = await api.get<User>('/auth/me')
    setUser(me.data)
    return me.data
  }

  const register = async (payload: RegisterData): Promise<User> => {
    const { data } = await api.post<TokenResponse>('/auth/register', payload)
    storeTokens(data)
    const me = await api.get<User>('/auth/me')
    setUser(me.data)
    return me.data
  }

  const logout = async () => {
    const refresh_token = localStorage.getItem('refresh_token')
    if (refresh_token) {
      await api.post('/auth/logout', { refresh_token }).catch(() => {})
    }
    localStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
