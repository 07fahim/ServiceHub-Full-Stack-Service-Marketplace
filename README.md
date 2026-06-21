# ServiceHub — Full-Stack Service Marketplace

A secure, multi-tenant service marketplace inspired by [Sheba.xyz](https://sheba.xyz), built as part of an AI Engineer Technical Assessment (Vibe Coding Challenge).

Customers can discover and book services from verified vendors. Vendors manage their listings and track incoming jobs. Admins oversee the entire platform.

---

## Live Demo

> Record a Loom/screen recording and paste the link here before submission.

---

## Tech Stack

| Layer       | Technology                                      |
|-------------|--------------------------------------------------|
| Backend     | FastAPI 0.115, SQLAlchemy 2.0, Python 3.11+     |
| Frontend    | Vite 6 + React 18, TypeScript, Axios            |
| Database    | Supabase (PostgreSQL 15)                        |
| Auth        | JWT — access token (15 min) + refresh token (7 days), RBAC |
| Payments    | SSLCommerz (sandbox)                            |
| State Mgmt  | React Context API + TanStack Query              |

---

## Project Structure

```
service-marketplace/
│
├── apps/
│   ├── api/                          # FastAPI backend
│   │   ├── app/
│   │   │   ├── config/
│   │   │   │   ├── database.py       # SQLAlchemy engine + session
│   │   │   │   ├── settings.py       # Pydantic settings from .env
│   │   │   │   └── init_db.py        # Table creation script
│   │   │   ├── models/
│   │   │   │   ├── user.py           # User + UserRole enum
│   │   │   │   ├── vendor.py         # VendorProfile
│   │   │   │   ├── category.py       # Service categories
│   │   │   │   ├── service.py        # Service listings
│   │   │   │   ├── order.py          # Orders + OrderStatus enum
│   │   │   │   ├── transaction.py    # Payment transactions
│   │   │   │   └── refresh_token.py  # JWT refresh token store
│   │   │   ├── schemas/              # Pydantic request/response models
│   │   │   ├── services/
│   │   │   │   ├── auth_service.py   # Register, login, token logic
│   │   │   │   └── dependencies.py   # FastAPI auth dependencies
│   │   │   ├── routes/
│   │   │   │   ├── auth.py           # /auth/*
│   │   │   │   ├── categories.py     # /categories/*
│   │   │   │   ├── services.py       # /services/*
│   │   │   │   ├── vendor.py         # /vendor/*
│   │   │   │   ├── orders.py         # /orders/*
│   │   │   │   ├── payments.py       # /payments/*
│   │   │   │   └── admin.py          # /admin/*
│   │   │   └── main.py               # FastAPI app + CORS + routers
│   │   ├── tests/
│   │   ├── seed.py                   # Seeds admin user + 8 categories
│   │   ├── requirements.txt
│   │   └── .env
│   │
│   └── web/                          # Vite + React frontend
│       ├── src/
│       │   ├── context/
│       │   │   └── AuthContext.tsx   # Auth state, login/logout/register
│       │   ├── components/
│       │   │   └── layout/
│       │   │       ├── Navbar.tsx
│       │   │       └── ProtectedRoute.tsx
│       │   ├── lib/
│       │   │   ├── api.ts            # Axios instance + auto token refresh
│       │   │   └── types.ts          # Shared TypeScript types
│       │   ├── pages/
│       │   │   ├── Home.tsx          # Landing page + category grid
│       │   │   ├── Login.tsx
│       │   │   ├── Register.tsx
│       │   │   ├── Services.tsx      # Searchable marketplace catalog
│       │   │   ├── ServiceDetail.tsx # Service detail + book CTA
│       │   │   ├── UserDashboard.tsx # Order history + stats
│       │   │   ├── VendorDashboard.tsx # Services CRUD + received orders
│       │   │   ├── AdminDashboard.tsx  # User/vendor/order management
│       │   │   ├── Checkout.tsx      # SSLCommerz payment redirect
│       │   │   └── OrderSuccess.tsx  # Post-payment result page
│       │   ├── App.tsx               # Routes + providers
│       │   └── main.tsx
│       ├── package.json
│       └── .env
│
├── .gitignore
└── README.md
```

---

## Database Schema (ERD)

```
┌─────────────────┐       ┌──────────────────┐       ┌───────────────┐
│     users       │       │  vendor_profiles  │       │  categories   │
│─────────────────│       │──────────────────│       │───────────────│
│ id (PK)         │──┐    │ id (PK)           │──┐    │ id (PK)       │
│ email (unique)  │  └───▶│ user_id (FK)      │  │    │ name          │
│ password_hash   │       │ business_name     │  │    │ slug          │
│ full_name       │       │ description       │  │    │ description   │
│ phone           │       │ address           │  │    │ icon          │
│ role            │       │ is_verified       │  │    │ is_active     │
│ is_active       │       └──────────────────┘  │    └───────────────┘
│ created_at      │                │             │            │
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
        │                               └─────────────────┘
        │                                        │
        │            ┌───────────────────────────┘
        │            ▼
        │    ┌─────────────────┐       ┌──────────────────┐
        │    │     orders      │       │  transactions    │
        │    │─────────────────│       │──────────────────│
        └───▶│ user_id (FK)    │──┐    │ id (PK)          │
             │ service_id (FK) │  └───▶│ order_id (FK)    │
             │ vendor_id (FK)  │       │ gateway_tran_id  │
             │ status          │       │ gateway_val_id   │
             │ scheduled_at    │       │ amount           │
             │ address         │       │ currency         │
             │ notes           │       │ status           │
             │ total_amount    │       └──────────────────┘
             └─────────────────┘

┌──────────────────┐
│  refresh_tokens  │
│──────────────────│
│ user_id (FK)     │──▶ users
│ token (unique)   │
│ expires_at       │
│ is_revoked       │
└──────────────────┘
```

### Role Enum
| Role       | Capabilities                                          |
|------------|-------------------------------------------------------|
| `admin`    | Full platform access — manage users, verify vendors, view all orders |
| `vendor`   | Create/manage services, view and update received orders |
| `end_user` | Browse services, place bookings, pay, view own orders |

---

## Local Setup

### Prerequisites

| Tool      | Version  |
|-----------|----------|
| Python    | 3.11+    |
| Node.js   | 18+      |
| npm       | 9+       |
| ngrok     | any (for SSLCommerz sandbox callbacks) |

---

### 1. Clone the repository

```bash
git clone https://github.com/your-username/service-marketplace.git
cd service-marketplace
```

---

### 2. Backend setup (`apps/api`)

```bash
cd apps/api

# Create and activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Environment variables

The `.env` file is already present. Fill in your SSLCommerz credentials:

```env
DATABASE_URL=postgresql://postgres:Fahim_Fahim4590@db.okflvhuxzedooszcvfcs.supabase.co:5432/postgres

SECRET_KEY=supersecret-change-in-production-jwt-key-2024
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Get from: https://developer.sslcommerz.com/registration/
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWD=your_store_passwd
SSLCOMMERZ_IS_SANDBOX=True

# For local dev use your ngrok URL (see SSLCommerz section below)
BACKEND_URL=http://localhost:8888
FRONTEND_URL=http://localhost:5173
```

#### Create database tables

```bash
# Run from apps/api with venv active
python -m app.config.init_db
```

#### Seed admin user + categories

```bash
python seed.py
```

This creates:
- **Admin account** — `admin@marketplace.com` / `Admin1234!`
- **8 default categories** — Cleaning, Plumbing, Electrical, Beauty, Tutoring, Moving, Cooking, Gardening

#### Start the backend

```bash
uvicorn app.main:app --reload --port 8888
```

- API base: `http://localhost:8888`
- Interactive docs: `http://localhost:8888/docs`
- Health check: `http://localhost:8888/health`

---

### 3. Frontend setup (`apps/web`)

```bash
cd apps/web

# Install dependencies
npm install

# Start dev server
npm run dev
```

App runs at: `http://localhost:5173`

The `.env` file only needs the API URL (already configured):

```env
VITE_API_URL=http://localhost:8888/api/v1

```

---

### 4. SSLCommerz sandbox setup

SSLCommerz needs to POST back to your machine after payment. Since `localhost` is not publicly reachable, use **ngrok** to expose the backend:

```bash
# In a separate terminal
ngrok http 8888
```

Copy the generated HTTPS URL (e.g. `https://abc123.ngrok-free.app`) and update `apps/api/.env`:

```env
BACKEND_URL=https://abc123.ngrok-free.app
```

Restart the backend after updating `.env`.

---

## Test Accounts

| Role     | Email                      | Password     | How to get       |
|----------|----------------------------|--------------|------------------|
| Admin    | `admin@marketplace.com`    | `Admin1234!` | Run `seed.py`    |
| Vendor   | Register at `/register`    | your choice  | Select "Vendor"  |
| Customer | Register at `/register`    | your choice  | Select "Customer"|

---

## Demo Walkthrough

### As a Customer
1. Go to `http://localhost:5173` — browse the homepage category grid
2. Click **Browse** or search for a service
3. Open a service detail page → click **Book This Service**
4. Review the order on the **Checkout** page → click **Pay with SSLCommerz**
5. Complete payment on the SSLCommerz sandbox page
6. Land on the **Order Success** page with confirmed status
7. Visit **Dashboard** to see order history

### As a Vendor
1. Register with role **Vendor** at `/register`
2. Go to `/vendor` → click **Create Profile** → fill in business details
3. Switch to **Services** tab → click **+ Add Service**
4. Fill in name, category, price, description → save
5. Switch to **Orders** tab to see incoming bookings
6. Update order status (Confirmed → In Progress → Completed)

### As an Admin
1. Login as `admin@marketplace.com` / `Admin1234!`
2. Go to `/admin`
3. **Users tab** — enable/disable any account
4. **Vendors tab** — verify unverified vendors (✓ badge)
5. **Orders tab** — view all platform orders with status

---

> **Assessment explanations** (vibe coding workflow, ERD, state management & route protection) are in [`EXPLAIN.md`](./EXPLAIN.md).

---

## State Management & Route Protection

### Frontend State Management

State is managed through two complementary layers:

**1. AuthContext (React Context API)** — `src/context/AuthContext.tsx`

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
5. If refresh fails → clear localStorage → user = null
```

`login()` and `register()` return the full `User` object so callers can immediately redirect by role without a second `useAuth()` call.

**2. Axios Interceptor** — `src/lib/api.ts`

Handles token expiry transparently during normal app use (not on page load):

```
Request → attach Authorization: Bearer <access_token>
Response 401 → call POST /auth/refresh → retry original request with new token
Refresh fails → remove tokens from localStorage (AuthContext detects null on next render)
```

The interceptor and `initAuth` handle different scenarios and never conflict:
- **Interceptor** = handles expiry during active use (API calls mid-session)
- **initAuth** = handles expiry on page refresh / return from SSLCommerz redirect

**3. TanStack Query** (server cache) — used in vendor and admin dashboards for background refetch and cache invalidation on mutations.

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

`ProtectedRoute` logic:
```
1. While loading=true → show spinner (prevents flash of redirect)
2. If user=null → redirect to /login
3. If user.role not in allowedRoles → redirect to the user's own dashboard
   admin → /admin | vendor → /vendor | end_user → /dashboard
4. Otherwise → render <Outlet /> (the protected page)
```

Role mismatch redirects (not 404s) mean a customer visiting `/vendor` lands on `/dashboard` seamlessly.

Post-login redirect also uses `user.role`:
```typescript
const DASHBOARD = { admin: '/admin', vendor: '/vendor', end_user: '/dashboard' }
const me = await login(email, password)
navigate(DASHBOARD[me.role])  // role-specific landing page
```

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

`get_current_user` decodes the JWT, validates the signature and expiry, looks up the user in the DB, and confirms `is_active=True`. If any check fails it raises `403 Forbidden`.

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
  → refresh_token stored in DB (refresh_tokens table) with is_revoked=False

All protected requests:
  Authorization: Bearer <access_token>

Token expiry:
  → axios interceptor auto-calls POST /auth/refresh
  → swaps in new access + refresh tokens transparently
  → on refresh failure: clears localStorage

POST /auth/logout
  → sets is_revoked=True on the refresh_token row in DB
  → token cannot be reused even if not yet expired
```

---

## SSLCommerz Payment Flow

```
1. Customer clicks "Pay with SSLCommerz"
        ↓
2. POST /api/v1/payments/initiate
   → Backend calls SSLCommerz createSession API
   → Gets GatewayPageURL
        ↓
3. Frontend does window.location.href = GatewayPageURL
        ↓
4. Customer completes payment on SSLCommerz-hosted page
        ↓
5. SSLCommerz POSTs to:
   - Success → /api/v1/payments/success
   - Failure → /api/v1/payments/fail
   - Cancel  → /api/v1/payments/cancel
        ↓
6. Backend validates payment, updates:
   - transactions.status → succeeded / failed / cancelled
   - orders.status       → confirmed (on success)
        ↓
7. 303 redirect to frontend:
   /order-success/{orderId}?status=success|failed|cancelled
```

---

## API Reference

### Auth
| Method | Endpoint              | Auth     | Description              |
|--------|-----------------------|----------|--------------------------|
| POST   | `/auth/register`      | Public   | Create account           |
| POST   | `/auth/login`         | Public   | Login, receive tokens    |
| POST   | `/auth/refresh`       | Public   | Rotate access token      |
| POST   | `/auth/logout`        | Public   | Revoke refresh token     |
| GET    | `/auth/me`            | Any role | Get current user profile |

### Marketplace
| Method | Endpoint                   | Auth     | Description                  |
|--------|----------------------------|----------|------------------------------|
| GET    | `/categories`              | Public   | List active categories       |
| POST   | `/categories`              | Admin    | Create category              |
| GET    | `/services`                | Public   | List/search services         |
| GET    | `/services/{id}`           | Public   | Get service detail           |
| POST   | `/services`                | Vendor   | Create service listing       |
| PATCH  | `/services/{id}`           | Vendor   | Update own service           |
| DELETE | `/services/{id}`           | Vendor   | Deactivate own service       |

### Vendor
| Method | Endpoint                            | Auth   | Description              |
|--------|-------------------------------------|--------|--------------------------|
| POST   | `/vendor/profile`                   | Vendor | Create vendor profile    |
| GET    | `/vendor/profile`                   | Vendor | Get own profile          |
| PATCH  | `/vendor/profile`                   | Vendor | Update own profile       |
| GET    | `/vendor/orders`                    | Vendor | List received orders     |
| PATCH  | `/vendor/orders/{id}/status`        | Vendor | Update order status      |

### Orders & Payments
| Method | Endpoint                        | Auth      | Description                   |
|--------|---------------------------------|-----------|-------------------------------|
| POST   | `/orders`                       | Any role  | Create order (book service)   |
| GET    | `/orders`                       | Any role  | List own orders               |
| GET    | `/orders/{id}`                  | Any role  | Get single order              |
| POST   | `/payments/initiate`            | Any role  | Start SSLCommerz session      |
| POST   | `/payments/success`             | SSLCommerz| Payment success callback      |
| POST   | `/payments/fail`                | SSLCommerz| Payment failure callback      |
| POST   | `/payments/cancel`              | SSLCommerz| Payment cancel callback       |
| POST   | `/payments/ipn`                 | SSLCommerz| Silent IPN notification       |
| GET    | `/payments/transaction/{order}` | Any role  | Get transaction for order     |

### Admin
| Method | Endpoint                          | Auth  | Description             |
|--------|-----------------------------------|-------|-------------------------|
| GET    | `/admin/users`                    | Admin | List all users          |
| PATCH  | `/admin/users/{id}/toggle-active` | Admin | Enable / disable user   |
| GET    | `/admin/vendors`                  | Admin | List all vendor profiles|
| PATCH  | `/admin/vendors/{id}/verify`      | Admin | Verify a vendor         |
| GET    | `/admin/orders`                   | Admin | List all platform orders|

> All endpoints are prefixed with `/api/v1`. Full interactive docs at `http://localhost:8888/docs`.

---

## Vibe Coding Workflow

This project was built using **Claude Code** (AI-assisted development). Below is an honest account of how prompts were structured, where the AI excelled, and where it produced incorrect output that required manual correction.

---

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


