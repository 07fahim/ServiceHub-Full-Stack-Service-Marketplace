# Assessment Explanation — ServiceHub

> Covers the three required "Must Explain" sections from the AI Engineer Technical Assessment.

---

## 1. Vibe Coding Engineering Workflow

This project was built using **Claude Code** (AI-assisted development). Below is an honest account of how prompts were structured, where the AI excelled, and where it produced incorrect output that required manual correction.

### How Prompts Were Structured

Prompts followed a **layer-by-layer, one-module-at-a-time** discipline:

| Phase | Prompt Strategy |
|---|---|
| Schema design | "Design SQLAlchemy models for Users, VendorProfiles, Services, Orders, and Transactions with correct FK relationships and enums" |
| Auth | "Implement JWT login/register with access token (15 min) + refresh token (7 days) stored in the DB with revocation support" |
| RBAC | "Add FastAPI dependencies: `get_current_user`, `require_admin`, `require_vendor`, `require_end_user` using the role field on the User model" |
| Each route file | "Implement CRUD for `/services` — vendors can create/update/deactivate their own; public GET with search and category filter" |
| Frontend | "Build an AuthContext with login/register/logout, store tokens in localStorage, expose a `useAuth` hook" |
| Payment | "Integrate SSLCommerz sandbox using `sslcommerz-lib`. The flow is: initiate → redirect to gateway → POST callback → redirect to frontend" |

Each prompt was scoped to **one responsibility**. Asking for multiple modules in one prompt produced tangled output that was harder to review.

---

### Where the AI Succeeded

- **SQLAlchemy models** — All 7 models (User, VendorProfile, Category, Service, Order, Transaction, RefreshToken) with correct FK relationships, enums, and UUID primary keys were generated accurately on the first pass.
- **Pydantic v2 schemas** — Request/response schemas with `model_dump(exclude_unset=True)` for partial updates required no corrections.
- **FastAPI route structure** — CRUD skeletons with dependency injection, status codes, and response models were correct and production-quality.
- **TypeScript types** — Shared `types.ts` matching the backend schemas was accurate.
- **CSS design system** — The entire custom CSS (variables, component classes, animations) was generated without Tailwind in one pass.
- **Smoke test script** — 31-check automated test with real HTTP calls covering every endpoint was generated correctly.

---

### Where the AI Failed or Hallucinated (Required Manual Fix)

| Problem | What the AI produced | What was actually needed |
|---|---|---|
| **SSLCommerz package version** | `sslcommerz-lib==0.0.1` — does not exist on PyPI | `sslcommerz-lib==1.0` — manually corrected in `requirements.txt` |
| **Port conflict on Windows** | All config hardcoded to port `8000` | Windows blocked 8000; manually updated `.env`, `smoke_test.py`, GUIDE.md, README to port `8888` |
| **Login redirect** | `login()` returned `void`; page always redirected to `/` | Changed return type to `Promise<User>` so callers can read `user.role` and redirect to `/admin`, `/vendor`, or `/dashboard` |
| **Page refresh logout** | On refresh, expired access token caused immediate logout | Added refresh-token fallback in `AuthContext.initAuth` — tries `/auth/refresh` before clearing session |
| **SSLCommerz callback logout** | After payment redirect, interceptor called `window.location.href = '/login'` on any 401 | Removed forced redirect — silently clears tokens, lets React Router handle navigation |
| **Vendor null crash** | `PATCH /services/{id}` accessed `vendor.id` without checking if vendor profile exists | Added `if not vendor: raise HTTPException(404)` guard in `services.py` and `vendor.py` |
| **TypeScript env error** | `Property 'env' does not exist on type 'ImportMeta'` | Created `vite-env.d.ts` with `/// <reference types="vite/client" />` |
| **CORS on wrong port** | CORS only allowed `localhost:5173`; Vite auto-assigned `5175` | Added `5174` and `5175` to `allow_origins` in `main.py` |
| **React context HMR crash** | Hot module reload caused context mismatch (`useAuth must be used inside AuthProvider`) | Hard browser refresh (Ctrl+Shift+R) — HMR artifact, not a code bug |
| **`baseUrl` deprecation** | `tsconfig.json` included `"baseUrl": "."` deprecated in TypeScript 6.0 | Removed the field; `moduleResolution: bundler` makes it unnecessary |

---

### Review Process

Every generated file was read in full before moving to the next module. AI output was treated as a **first draft** — the review caught 10 frontend bugs and 3 backend bugs before the project was considered complete. An automated smoke test (`smoke_test.py`) was used as the final regression check after every fix.

---

## 2. Entity-Relationship Diagram (ERD)

```
┌─────────────────┐       ┌──────────────────┐       ┌───────────────┐
│     users       │       │  vendor_profiles  │       │  categories   │
│─────────────────│       │──────────────────│       │───────────────│
│ id (PK, UUID)   │──┐    │ id (PK, UUID)     │──┐    │ id (PK, UUID) │
│ email (unique)  │  └───▶│ user_id (FK)      │  │    │ name          │
│ password_hash   │       │ business_name     │  │    │ slug          │
│ full_name       │       │ description       │  │    │ description   │
│ phone           │       │ address           │  │    │ icon          │
│ role            │       │ is_verified       │  │    │ is_active     │
│ is_active       │       └──────────────────┘  │    └───────────────┘
│ created_at      │                              │            │
└─────────────────┘                              │            │
        │                               ┌────────────────┐   │
        │                               │    services    │   │
        │                               │────────────────│   │
        │                               │ id (PK, UUID)  │   │
        │                          └───▶│ vendor_id (FK) │   │
        │                               │ category_id(FK)│◀──┘
        │                               │ name           │
        │                               │ description    │
        │                               │ price          │
        │                               │ duration_mins  │
        │                               │ is_active      │
        │                               └────────────────┘
        │                                       │
        │           ┌───────────────────────────┘
        │           ▼
        │   ┌─────────────────┐       ┌──────────────────┐
        │   │     orders      │       │   transactions   │
        │   │─────────────────│       │──────────────────│
        └──▶│ id (PK, UUID)   │──┐    │ id (PK, UUID)    │
            │ user_id (FK)    │  └───▶│ order_id (FK)    │
            │ service_id (FK) │       │ gateway_tran_id  │
            │ vendor_id (FK)  │       │ gateway_val_id   │
            │ status          │       │ amount           │
            │ scheduled_at    │       │ currency         │
            │ address         │       │ status           │
            │ notes           │       │ created_at       │
            │ total_amount    │       └──────────────────┘
            │ created_at      │
            └─────────────────┘

┌──────────────────┐
│  refresh_tokens  │
│──────────────────│
│ id (PK, UUID)    │
│ user_id (FK)     │──▶ users.id
│ token (unique)   │
│ expires_at       │
│ is_revoked       │
│ created_at       │
└──────────────────┘
```

### Relationships

| From | To | Type | FK |
|---|---|---|---|
| `users` | `vendor_profiles` | One-to-one | `vendor_profiles.user_id` |
| `vendor_profiles` | `services` | One-to-many | `services.vendor_id` |
| `categories` | `services` | One-to-many | `services.category_id` |
| `users` | `orders` | One-to-many | `orders.user_id` |
| `services` | `orders` | One-to-many | `orders.service_id` |
| `vendor_profiles` | `orders` | One-to-many | `orders.vendor_id` |
| `orders` | `transactions` | One-to-one | `transactions.order_id` |
| `users` | `refresh_tokens` | One-to-many | `refresh_tokens.user_id` |

### Role Capabilities

| Role | What they can do |
|---|---|
| `admin` | View all users, enable/disable accounts, verify vendors, view all platform orders |
| `vendor` | Create a profile, manage own service listings (CRUD), view and update status of received orders |
| `end_user` | Browse and search services, place bookings, pay via SSLCommerz, view own order history |

### How Transactions Are Linked Safely

Each `orders` row has at most one `transactions` row (one-to-one). The `gateway_tran_id` is the reference ID returned by SSLCommerz when the session is initiated. The `gateway_val_id` is the validation ID returned after payment success, which the backend uses to call SSLCommerz's validation API before marking the transaction as `succeeded`. This two-step confirm prevents spoofed callbacks from marking orders as paid.

---

## 3. State Management & Route Protection

### Frontend State Management

State is managed through two complementary layers:

#### AuthContext (React Context API) — `src/context/AuthContext.tsx`

The single source of truth for the authenticated user. It exposes:

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
5. If refresh fails → clear localStorage → user = null (not logged in)
```

`login()` and `register()` both return the full `User` object so the calling page can redirect immediately by role without a second context read:

```typescript
const me = await login(email, password)
navigate({ admin: '/admin', vendor: '/vendor', end_user: '/dashboard' }[me.role])
```

#### Axios Interceptor — `src/lib/api.ts`

Handles token expiry transparently during active app use:

```
Request  → attach Authorization: Bearer <access_token>
Response 401 → call POST /auth/refresh → retry original request with new token
Refresh fails → remove tokens from localStorage (AuthContext detects null on next render)
```

The interceptor and `initAuth` handle different scenarios without conflict:
- **Interceptor** handles expiry during mid-session API calls
- **initAuth** handles expiry on page refresh or return from SSLCommerz redirect

#### TanStack Query

Used in vendor and admin dashboards for background refetch and cache invalidation on mutations. `AuthContext` handles session state; TanStack Query handles server data caching.

---

### Frontend Route Protection

`ProtectedRoute` (`src/components/layout/ProtectedRoute.tsx`) wraps React Router's `<Outlet />`:

```typescript
// App.tsx — three separate protection groups
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

`ProtectedRoute` decision logic:

```
1. loading = true  → show spinner (no redirect flash while tokens are being validated)
2. user = null     → redirect to /login
3. user.role not in allowedRoles → redirect to the user's own dashboard:
     admin → /admin | vendor → /vendor | end_user → /dashboard
4. role matches    → render <Outlet /> (the protected page)
```

Role mismatch sends the user to their own correct dashboard — not a 404 or error page.

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

Applied at the route level:

```python
@router.post("/services", response_model=ServiceOut)
def create_service(data: ServiceCreate, current_user = Depends(require_vendor)):
    ...
```

`get_current_user` decodes the JWT, validates the signature and expiry, fetches the user from the DB, and confirms `is_active=True`. Any failure raises `403 Forbidden`.

**Role enforcement summary:**

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
  → refresh_token stored in DB (refresh_tokens table) with is_revoked = False

All protected requests:
  Authorization: Bearer <access_token>

Token expiry:
  → axios interceptor auto-calls POST /auth/refresh
  → swaps in new access + refresh tokens silently
  → on refresh failure: clears localStorage, React re-renders to logged-out state

POST /auth/logout
  → sets is_revoked = True on the refresh_token row in DB
  → stolen token cannot be reused even if not yet expired
```
