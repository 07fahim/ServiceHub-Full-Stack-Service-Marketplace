import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '@/lib/api'
import { Service, Category } from '@/lib/types'
import toast from 'react-hot-toast'

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const search = searchParams.get('search') ?? ''
  const categoryId = searchParams.get('category_id') ?? ''

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data)).catch(() => toast.error('Failed to load categories'))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (search) params.search = search
    if (categoryId) params.category_id = categoryId
    api.get('/services', { params })
      .then((r) => setServices(r.data))
      .catch(() => toast.error('Failed to load services'))
      .finally(() => setLoading(false))
  }, [search, categoryId])

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) { next.set(key, value) } else { next.delete(key) }
    setSearchParams(next)
  }

  const activeCat = categories.find(c => c.id === categoryId)

  return (
    <div>
      {/* Filter bar */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="page" style={{ paddingTop: '1.25rem', paddingBottom: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              className="form-input"
              style={{ flex: 1, minWidth: '200px', maxWidth: '380px' }}
              placeholder="Search services…"
              defaultValue={search}
              onChange={(e) => updateParam('search', e.target.value)}
            />
            <select
              className="form-input form-select"
              style={{ minWidth: '200px', width: 'auto' }}
              value={categoryId}
              onChange={(e) => updateParam('category_id', e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {(search || categoryId) && (
              <button
                className="btn btn-secondary btn-md"
                onClick={() => setSearchParams({})}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="page">
        {/* Heading */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 className="section-title">
            {activeCat ? activeCat.name : search ? `Results for "${search}"` : 'All Services'}
          </h1>
          {!loading && (
            <p className="section-subtitle">{services.length} service{services.length !== 1 ? 's' : ''} found</p>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : services.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🔍</div>
            <div className="empty-text">No services match your filters. Try adjusting your search.</div>
          </div>
        ) : (
          <div className="svc-grid">
            {services.map((svc) => (
              <Link key={svc.id} to={`/services/${svc.id}`} className="svc-card card-hover">
                <div className="svc-card-top">
                  <div>
                    {svc.category && (
                      <span className="badge badge-primary" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
                        {svc.category.name}
                      </span>
                    )}
                    <div className="svc-card-title">{svc.name}</div>
                  </div>
                  <div className="svc-price">৳{svc.price}</div>
                </div>
                <p className="svc-desc">
                  {svc.description
                    ? svc.description.slice(0, 110) + (svc.description.length > 110 ? '…' : '')
                    : 'No description provided.'}
                </p>
                <div className="svc-meta">
                  {svc.duration_minutes && (
                    <span className="badge badge-gray">⏱ {svc.duration_minutes} min</span>
                  )}
                  {svc.vendor && (
                    <span className="svc-vendor">
                      by <strong>{svc.vendor.business_name}</strong>
                      {svc.vendor.is_verified && <span className="verified" style={{ marginLeft: '4px' }}>✓</span>}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
