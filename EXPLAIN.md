# Assessment Explanations

## 1. Vibe Coding Engineering Workflow

### Prompt Structure

Prompts followed a **layer-by-layer, one-module-at-a-time** discipline rather than asking for entire subsystems at once.

| Phase | Prompt Strategy |
|---|---|
| Schema design | "Design SQLAlchemy models for Users, VendorProfiles, Services, Orders, and Transactions with correct FK relationships and enums" |
| Auth | "Implement JWT login/register with access token (15 min) + refresh token (7 days) stored in the DB with revocation support" |
| RBAC | "Add FastAPI dependencies: `get_current_user`, `require_admin`, `require_vendor`, `require_end_user` using the role field on the User model" |
| Each route file | "Implement CRUD for `/services` — vendors can create/update/deactivate their own; public GET with search and category filter" |
| Frontend | "Build an AuthContext with login/register/logout, store tokens in localStorage, expose a `useAuth` hook" |
| Payment | "Integrate SSLCommerz sandbox using `sslcommerz-lib`. The flow is: initiate → redirect to gateway → POST callback → redirect to frontend" |

Each prompt was scoped to **one responsibility**. Asking for multiple modules in one prompt produced tangled output that was harder to review.

After each module, the generated file was read in full before moving to the next. AI output was treated as a **first draft** subject to manual code review.

---

### Where the AI Succeeded

- **SQLAlchemy models** — All 7 models with correct FK relationships, enums, and UUID primary keys were generated accurately on the first pass.
- **Pydantic v2 schemas** — Request/response schemas with `model_dump(exclude_unset=True)` for partial updates required no corrections.
- **FastAPI route structure** — CRUD skeletons with dependency injection, status codes, and response models were correct and production-quality.
- **TypeScript types** — Shared `types.ts` matching the backend schemas was accurate.
- **Custom CSS design system** — Variables, component classes, and animations generated without Tailwind in one pass.
- **Smoke test script** — 31-check automated test covering every endpoint was generated correctly and caught real regressions.

---

### Where the AI Failed or Required Manual Intervention

| Problem | AI Output | Manual Fix Applied |
|---|---|---|
| **SSLCommerz package version** | `sslcommerz-lib==0.0.1` — does not exist on PyPI | Corrected to `sslcommerz-lib==1.0` in `requirements.txt` |
| **Port conflict on Windows** | All config hardcoded to port `8000` | Windows reserved port 8000; updated all configs to `8888` |
| **Login redirect** | `login()` returned `void`; page always redirected to `/` | Changed return type to `Promise<User>` so callers redirect by `user.role` |
| **Page refresh logout** | Expired access token on refresh caused immediate logout | Added refresh-token fallback in `AuthContext.initAuth` |
| **SSLCommerz callback logout** | Axios interceptor called `window.location.href = '/login'` on any 401 | Removed forced redirect — silently clears tokens, lets React Router handle navigation |
| **Vendor null crash** | `PATCH /services/{id}` accessed `vendor.id` without checking profile existence | Added `if not vendor: raise HTTPException(404)` guard |
| **TypeScript env error** | `Property 'env' does not exist on type 'ImportMeta'` | Created `vite-env.d.ts` with `/// <reference types="vite/client" />` |
| **CORS on wrong port** | CORS only allowed `localhost:5173`; Vite auto-assigned `5175` | Added `5174` and `5175` to `allow_origins` in `main.py` |
| **React context HMR crash** | Hot module reload caused context mismatch | Hard browser refresh — HMR artifact, not a code bug |
| **`baseUrl` deprecation** | `tsconfig.json` included `"baseUrl": "."` deprecated in TS 6.0 | Removed the field; `moduleResolution: bundler` makes it unnecessary |

---

## 2. Entity-Relationship Diagram

```
┌─────────────────┐       ┌──────────────────┐       ┌───────────────┐
│     users       │       │  vendor_profiles  │       │  categories   │
│─────────────────│       │──────────────────│       │───────────────│
│ id (PK, UUID)   │──┐    │ id (PK, UUID)     │──┐    │ id (PK, UUID) │
│ email (unique)  │  └───▶│ user_id (FK)      │  │    │ name          │
│ password_hash   │       │ business_name     │  │    │ slug          │
│ full_name       │       │ description       │  │    │ description   │
│ phone           │       │ address           │  │    │ icon          │
│ role (enum)     │       │ is_verified       │  │    │ is_active     │
│ is_active       │       └──────────────────┘  │    └───────────────┘
│ created_at      │                │             │            │
│ updated_at      │                │             │            │
└─────────────────┘                │             │            │
        │                          │    ┌─────────────────┐  │
        │                          │    │    services     │  │
        │                          │    │─────────────────│  │
        │                          └───▶│ vendor_id (FK)  │  │
        │                               │ category_id(FK) │◀─┘
        │                               │ name            │
        │                               │ description     │
        │                               │ price           │
        │                               │ duration_minutes│
        │                               │ is_active       │
        │                               │ created_at      │
        │                               └─────────────────┘
        │                                        │
        │            ┌───────────────────────────┘
        │            ▼
        │    ┌─────────────────┐       ┌──────────────────┐
        │    │     orders      │       │  transactions    │
        │    │─────────────────│       │──────────────────│
        └───▶│ user_id (FK)    │──┐    │ id (PK, UUID)    │
             │ service_id (FK) │  └───▶│ order_id (FK)    │
             │ vendor_id (FK)  │       │ gateway_tran_id  │
             │ status (enum)   │       │ gateway_val_id   │
             │ scheduled_at    │       │ amount           │
             │ address         │       │ currency         │
             │ notes           │       │ status (enum)    │
             │ total_amount    │       │ created_at       │
             │ created_at      │       └──────────────────┘
             └─────────────────┘

┌──────────────────┐
│  refresh_tokens  │
│──────────────────│
│ id (PK, UUID)    │
│ user_id (FK)     │──▶ users
│ token (unique)   │
│ expires_at       │
│ is_revoked       │
│ created_at       │
└──────────────────┘
```

### Role Enum

| Role | Capabilities |
|---|---|
| `admin` | Full platform access — manage users, verify vendors, view all orders |
| `vendor` | Create/manage own services, view and update received orders |
| `end_user` | Browse services, place bookings, pay, view own orders |

### Key Design Decisions

- **UUID primary keys** everywhere to prevent sequential enumeration attacks.
- **`vendor_profiles` 1:1 with `users`** — a vendor registers as a user first, then creates a profile. This keeps `users` clean and lets a vendor account exist without a profile while they set one up.
- **`orders.vendor_id` is denormalized** (also available via `service.vendor_id`) for query efficiency — vendor order views never need to join through `services`.
- **`refresh_tokens` table** instead of storing tokens in a cookie or relying on expiry alone — gives server-side revocation (logout invalidates the token immediately).
- **`transactions` separate from `orders`** — an order can exist before payment is attempted, and a failed payment does not corrupt the order record.

---

## 3. State Management & Route Protection

### Frontend State Management

State is managed through two complementary layers:

**AuthContext (React Context API)** — `src/context/AuthContext.tsx`

The single source of truth for the authenticated user. Exposes:

```typescript
interface AuthContextType {
  user: User | null   // null = not logged in
  loading: boolean    // true during initAuth (prevents flash of wrong page)
  login(email, password): Promise<User>
  register(data): Promise<User>
  logout(): Promise<void>
}
```

On app load, `initAuth` restores the session from `localStorage`:

```
1. Read access_token from localStorage
2. Call GET /auth/me
3. If 401 → try POST /auth/refresh with the refresh_token
4. If refresh succeeds → store new tokens → call GET /auth/me again
5. If refresh fails → clear localStorage → user = null
```

`login()` and `register()` return the full `User` object so callers redirect by role without a second round-trip.

**Axios Interceptor** — `src/lib/api.ts`

Handles token expiry transparently during active use:

```
Request → attach Authorization: Bearer <access_token>
Response 401 → call POST /auth/refresh → retry original request with new token
Refresh fails → remove tokens from localStorage
```

The interceptor and `initAuth` handle different scenarios and never conflict:
- **Interceptor** = handles expiry during active API calls mid-session
- **initAuth** = handles expiry on page refresh or return from SSLCommerz redirect

**TanStack Query** — used in vendor and admin dashboards for background refetch and cache invalidation on mutations.

---

### Frontend Route Protection

`ProtectedRoute` (`src/components/layout/ProtectedRoute.tsx`) wraps React Router's `<Outlet />`:

```typescript
// App.tsx — nested route structure
<Route element={<ProtectedRoute allowedRoles={['end_user']} />}>
  <Route path="/dashboard" element={<UserDashboard />} />
  <Route path="/checkout/:orderId" element={<Checkout />} />
</Route>

<Route element={<ProtectedRoute allowedRoles={['vendor']} />}>
  <Route path="/vendor" element={<VendorDashboard />} />
</Route>

<Route element={<ProtectedRoute allowedRoles={['admin']} />}>
  <Route path="/admin" element={<AdminDashboard />} />
</Route>
```

Logic:
```
1. While loading=true → render spinner (prevents flash of wrong page)
2. If user=null → redirect to /login (with ?next= for post-login redirect)
3. If user.role not in allowedRoles → redirect to the user's own dashboard
4. Otherwise → render <Outlet />
```

Role mismatch redirects (not 404s) so a customer visiting `/vendor` lands cleanly on `/dashboard`.

---

### Backend Route Protection (RBAC)

Every protected endpoint uses a FastAPI dependency from `app/services/dependencies.py`:

```python
def require_role(*roles: UserRole):
    def checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return checker

require_vendor = require_role(UserRole.vendor)
require_admin  = require_role(UserRole.admin)
```

`get_current_user` decodes the JWT, validates signature and expiry, fetches the user from the DB, and confirms `is_active=True`. Any failure raises `401 Unauthorized`.

| Endpoint group | Required role | Enforced by |
|---|---|---|
| `/admin/*` | `admin` | `require_admin` dependency |
| `/vendor/*` | `vendor` | `require_vendor` dependency |
| `/orders`, `/payments/initiate` | any authenticated | `get_current_user` dependency |
| `/categories`, `/services` (GET) | none | public — no dependency |

---

### JWT Token Lifecycle

```
POST /auth/login
  → returns { access_token (15 min), refresh_token (7 days) }
  → refresh_token row inserted in DB with is_revoked=False

Protected requests:
  Authorization: Bearer <access_token>

On 401:
  → axios interceptor calls POST /auth/refresh
  → swaps in new access + refresh tokens
  → on failure: clears localStorage

POST /auth/logout:
  → sets is_revoked=True on the refresh_token row
  → token cannot be reused even if not yet expired
```
