import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  SprayCan, Wrench, Zap, Wand2,
  GraduationCap, Truck, ChefHat, Leaf,
  Search, ArrowRight, Star, Shield, Clock, CalendarCheck, Users, Sparkles,
} from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Category } from '@/lib/types'

/* ─── Per-category accent config ─────────────────────────── */
interface CatConfig {
  Icon: React.ElementType
  accent: string
  bg: string
  desc: string
}

const CAT_CONFIG: Record<string, CatConfig> = {
  cleaning:    { Icon: SprayCan,      accent: '#0ea5e9', bg: '#e0f2fe', desc: 'Home & office cleaning' },
  plumbing:    { Icon: Wrench,        accent: '#f59e0b', bg: '#fef3c7', desc: 'Pipe, drain & fixture repair' },
  electrical:  { Icon: Zap,           accent: '#8b5cf6', bg: '#ede9fe', desc: 'Wiring & installation' },
  beauty:      { Icon: Wand2,         accent: '#ec4899', bg: '#fce7f3', desc: 'Salon, grooming & spa' },
  tutoring:    { Icon: GraduationCap, accent: '#10b981', bg: '#d1fae5', desc: 'Academic & skill coaching' },
  moving:      { Icon: Truck,         accent: '#f97316', bg: '#ffedd5', desc: 'Furniture & relocation' },
  cooking:     { Icon: ChefHat,       accent: '#ef4444', bg: '#fee2e2', desc: 'Personal chef & catering' },
  gardening:   { Icon: Leaf,          accent: '#84cc16', bg: '#ecfccb', desc: 'Lawn care & landscaping' },
}

const DEFAULT_CONFIG: CatConfig = {
  Icon: Wrench, accent: '#4f46e5', bg: '#eef2ff', desc: 'Professional services',
}

const STATS = [
  { Icon: Users,  value: '2,400+', label: 'Verified professionals' },
  { Icon: Star,   value: '4.9★',   label: 'Average rating'         },
  { Icon: CalendarCheck, value: 'Same-day', label: 'Service available' },
  { Icon: Shield, value: '100%',   label: 'Secure payments'        },
]

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([])
  const [heroSearch, setHeroSearch] = useState('')
  const [catSearch, setCatSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/categories')
      .then((r) => setCategories(r.data))
      .catch(() => toast.error('Failed to load categories'))
  }, [])

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (heroSearch.trim()) navigate(`/services?search=${encodeURIComponent(heroSearch.trim())}`)
  }

  const filteredCats = categories.filter(c =>
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  )

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-tag">✦ Trusted by 18,000+ customers in Bangladesh</div>
          <h1 className="hero-title">
            Find skilled professionals<br />
            <span>for every job at home</span>
          </h1>
          <p className="hero-sub">
            Book verified service providers for cleaning, plumbing, beauty, tutoring and more — right from your browser.
          </p>
          <form onSubmit={handleHeroSearch} className="hero-search">
            <Search size={16} style={{ color: '#64748b', flexShrink: 0, marginLeft: '0.5rem' }} />
            <input
              className="hero-search-input"
              value={heroSearch}
              onChange={(e) => setHeroSearch(e.target.value)}
              placeholder="Search for a service — e.g. 'AC cleaning'"
            />
            <button type="submit" className="btn btn-primary btn-md">Search</button>
          </form>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────── */}
      <section style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto', padding: '0 2rem',
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
        }}>
          {STATS.map(({ Icon, value, label }, i) => (
            <div
              key={label}
              style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '0.9rem',
                padding: '1.5rem 1.5rem',
                borderLeft: i !== 0 ? '1px solid var(--border)' : 'none',
              }}
            >
              {/* Icon pill — matches screenshot's small rounded square */}
              <div style={{
                width: '38px', height: '38px', borderRadius: '9px',
                background: 'var(--primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={17} color="var(--primary)" strokeWidth={1.75} />
              </div>
              <div>
                <div style={{
                  fontWeight: 800, fontSize: '1.05rem',
                  color: 'var(--text-1)', letterSpacing: '-0.2px', lineHeight: 1.25,
                }}>
                  {value}
                </div>
                <div style={{
                  fontSize: '0.78rem', color: 'var(--text-3)',
                  marginTop: '0.15rem', fontWeight: 500,
                }}>
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────── */}
      <section className="cat-section">
        <div className="cat-section-inner">

          {/* Header */}
          <div className="cat-section-header">
            <div className="cat-section-label">
              <Sparkles size={12} /> Services
            </div>
            <h2 className="cat-section-title">Browse by Category</h2>
            <p className="cat-section-sub">
              Find the right professional for any task — from home repairs to personal care.
            </p>

            {/* Inline category search */}
            <div className="cat-search-wrap">
              <Search size={16} className="cat-search-icon" />
              <input
                className="cat-search-input"
                placeholder="Search categories…"
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Grid */}
          <div className="cat-grid">
            {filteredCats.length === 0 && (
              <div className="cat-empty">
                No categories match "<strong>{catSearch}</strong>"
              </div>
            )}
            {filteredCats.map((cat) => {
              const cfg = CAT_CONFIG[cat.slug] ?? DEFAULT_CONFIG
              const { Icon, accent, bg, desc } = cfg
              return (
                <Link
                  key={cat.id}
                  to={`/services?category_id=${cat.id}`}
                  className="cat-card"
                  style={{ '--cat-accent': accent } as React.CSSProperties}
                >
                  {/* Icon box */}
                  <div className="cat-icon-box" style={{ background: bg }}>
                    <Icon size={26} color={accent} strokeWidth={1.75} />
                  </div>

                  <div className="cat-name">{cat.name}</div>
                  <div className="cat-desc">{desc}</div>

                  {/* Hover arrow */}
                  <div className="cat-arrow">
                    View services <ArrowRight size={13} />
                  </div>
                </Link>
              )
            })}
          </div>

          {/* "See all" link */}
          {!catSearch && (
            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <Link to="/services" className="btn btn-outline-primary btn-lg">
                Explore all services <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="page" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--green-bg)', color: '#065f46', borderRadius: 'var(--radius-full)', padding: '0.3rem 1rem', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              <Shield size={12} /> How it works
            </div>
            <h2 style={{ fontSize: 'clamp(1.4rem,3vw,1.9rem)', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '-0.5px', marginBottom: '0.5rem' }}>
              Book a service in 3 easy steps
            </h2>
            <p style={{ color: 'var(--text-3)', fontSize: '1rem', maxWidth: '440px', margin: '0 auto' }}>
              No calls, no hassle — just browse, book and get it done.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '1.5rem', position: 'relative' }}>
            {[
              { num: '01', Icon: Search,    color: '#4f46e5', bg: '#eef2ff', title: 'Find a service',   desc: 'Browse our catalog or search by keyword or category to find the right professional.' },
              { num: '02', Icon: Clock, color: '#f59e0b', bg: '#fef3c7', title: 'Book & schedule', desc: 'Choose a time slot and confirm your booking in under a minute — no phone calls needed.' },
              { num: '03', Icon: Shield,    color: '#10b981', bg: '#d1fae5', title: 'Pay securely',     desc: 'Pay via SSLCommerz sandbox. Your money is protected until the job is done.' },
            ].map((step) => (
              <div key={step.num} className="card card-pad" style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '1.1rem', right: '1.1rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--border)', letterSpacing: '0.05em' }}>{step.num}</div>
                <div style={{ width: '56px', height: '56px', background: step.bg, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>
                  <step.Icon size={24} color={step.color} strokeWidth={1.75} />
                </div>
                <h3 style={{ fontWeight: 700, color: 'var(--text-1)', marginBottom: '0.45rem', fontSize: '1rem' }}>{step.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-3)', lineHeight: 1.65 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Vendor CTA ───────────────────────────────────── */}
      <section className="page" style={{ paddingTop: '3.5rem', paddingBottom: '4rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%)', borderRadius: 'var(--radius-xl)', padding: '3rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem', position: 'relative', overflow: 'hidden' }}>
          {/* Background glow */}
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 'var(--radius-full)', padding: '0.3rem 0.9rem', fontSize: '0.78rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '0.85rem' }}>
              <Users size={12} /> For professionals
            </div>
            <h2 style={{ fontSize: 'clamp(1.2rem,3vw,1.6rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: '0.5rem' }}>
              Are you a service professional?
            </h2>
            <p style={{ color: '#a5b4fc', fontSize: '0.95rem', maxWidth: '440px', lineHeight: 1.6 }}>
              List your services, set your own prices and connect with thousands of customers across Bangladesh.
            </p>
          </div>
          <Link
            to="/register"
            className="btn btn-lg"
            style={{ background: '#fff', color: 'var(--primary)', fontWeight: 700, flexShrink: 0, position: 'relative' }}
          >
            Become a vendor <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}
