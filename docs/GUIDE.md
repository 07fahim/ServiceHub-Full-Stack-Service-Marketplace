# ServiceHub — Run & Verification Guide

> **Verified:** Frontend builds with 0 TypeScript errors. Backend smoke test: **30 passed · 0 failed · 1 info** (the 1 info is the payment gateway — explained in Step 5).

---

## Prerequisites

| Tool | Minimum version | How to check |
|---|---|---|
| Python | 3.11 | `python --version` |
| Node.js | 18 | `node --version` |
| npm | 9 | `npm --version` |
| ngrok | any | Only needed for SSLCommerz payment testing |

---

## Step 1 — Start the Backend

Open **Terminal 1** and run:

```bash
cd apps/api
```

**Activate the virtual environment:**
```bash
# Windows
.venv\Scripts\activate

# Mac / Linux
source .venv/bin/activate
```

> If `.venv` doesn't exist yet: `python -m venv .venv` then activate, then `pip install -r requirements.txt`

**First-time setup only — create tables and seed data:**
```bash
python -m app.config.init_db
python seed.py
```

Expected seed output:
```
All tables created successfully.
Created admin: admin@marketplace.com
Created category: Cleaning
Created category: Plumbing
... (8 categories total)
Seed complete!
```

**Start the API:**
```bash
uvicorn app.main:app --reload --port 8888
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

**Verify it's running:** open `http://localhost:8888/health` → `{"status":"ok"}`

---

## Step 2 — Start the Frontend

Open **Terminal 2** (keep Terminal 1 running):

```bash
cd apps/web
npm install        # first time only — installs all packages
npm run dev
```

Expected output:
```
  VITE v6.x  ready in xxx ms
  Local:   http://localhost:5173/
```

Open `http://localhost:5173` — the homepage loads with category grid and hero search.

---

## Step 3 — Run the Automated Smoke Test

Tests all 31 backend endpoints with real HTTP calls. Run with backend active:

```bash
# Terminal 1 — venv active, backend running
cd apps/api
python smoke_test.py
```

**Expected output:**
```
  [OK] GET /health
  [OK] GET /categories -- 8 categories returned
  [OK] GET /services -- X services returned
  [OK] POST /auth/register (end_user)
  [OK] POST /auth/register (vendor)
  [OK] POST /auth/login (admin)
  [OK] GET /auth/me -- role=admin, name=Platform Admin
  [OK] POST /auth/refresh -- new tokens issued
  [OK] POST /auth/login (wrong password) -- 401 returned
  [OK] POST /vendor/profile -- id=xxxxxxxx
  [OK] GET /vendor/profile -- profile retrieved
  [OK] PATCH /vendor/profile -- address updated
  [OK] POST /services -- id=xxxxxxxx, price=800.00
  [OK] GET /services?search=Smoke -- service found in results
  [OK] GET /services?category_id -- filtered by "Cleaning"
  [OK] PATCH /services/{id} -- price updated to 950
  [OK] POST /orders -- id=xxxxxxxx, amount=950.00
  [OK] GET /orders -- order appears in customer list
  [OK] GET /orders/{id} -- single order retrieved
  [OK] GET /vendor/orders -- order visible to vendor
  [OK] PATCH /vendor/orders/{id}/status -- status set to confirmed
  [OK] GET /admin/users -- X users listed
  [OK] GET /admin/vendors -- X vendors listed
  [OK] PATCH /admin/vendors/{id}/verify -- is_verified=True
  [OK] GET /admin/orders -- X orders listed
  [OK] RBAC: end_user ->/admin/users returns 403 Forbidden
  [OK] RBAC: vendor ->/admin/users returns 403 Forbidden
  [OK] RBAC: no token ->/admin/users returns 403 Forbidden
  [--] POST /payments/initiate -- status 400
  [OK] POST /auth/logout -- 204 No Content
  [OK] PATCH /admin/users/{id}/toggle-active -- user disabled

====================================================
  30 passed   1 info   0 failed   (of 31 checks)
====================================================
```

> **Why `[--]` on payments?** The smoke test sets the order status to `confirmed` earlier in the run. The payment endpoint correctly rejects confirmed orders with `400 Order is not in a payable state`. This is correct behaviour — only `pending` orders can be paid. See Step 5 to test the full payment flow manually.

---

## Step 4 — Manual Browser Testing

### 4a — Test as Admin

1. Go to `http://localhost:5173/login`
2. Email: `admin@marketplace.com` | Password: `Admin1234!`
3. **You are redirected to `/admin` automatically**

| Tab | What to check |
|---|---|
| **Users** | All registered users listed with role badges (Customer / Vendor / Admin) |
| **Vendors** | All vendor profiles; unverified ones show a **Verify** button |
| **Orders** | All platform orders across all customers |

---

### 4b — Test as Vendor

1. Go to `http://localhost:5173/register`
2. Fill in details → select **"Vendor — offering services"** → Create account
3. **You are redirected to `/vendor` automatically**

| Action | Expected result |
|---|---|
| Click **Create Profile** | Fill business name + address → Save → profile appears, no error |
| **Services tab** → **+ Add Service** | Fill name, price, category → Save → appears in list with Active badge |
| Click **Edit** on a service | Change price → Update → new price shows |
| Click **Remove** | Service disappears from list |
| **Orders tab** | Shows bookings made by customers for your services |
| Order status dropdown | Select a new status → row updates immediately |

---

### 4c — Test as Customer

1. Open Incognito or a different browser → `http://localhost:5173/register`
2. Select **"Customer — looking for services"** → Create account
3. **You are redirected to `/dashboard` automatically**

| Action | Expected result |
|---|---|
| Click **Browse Services** or the navbar **Browse** link | `/services` page loads with all active services |
| Category grid on home page | 8 categories with professional icons load |
| Category search box | Typing filters cards in real time — no page reload |
| Click a category card | Goes to `/services?category_id=...` and filters results |
| Search box on `/services` | Filters services by name as you type |
| Click a service card | Service detail page opens with price, vendor name, description |
| Click **Book this service** | Order is created → redirected to `/checkout/{id}` |
| Checkout page | Order summary shows correct amount in BDT, green Pay button |
| `/dashboard` | Order appears in list with **Pay now** button and **pending** badge |

---

## Step 5 — Test Payment (SSLCommerz Sandbox)

SSLCommerz sends payment results by POSTing to your server. Since `localhost` is not reachable from the internet, you need ngrok to expose your local backend.

### 5a — Expose the backend with ngrok

```bash
# In a new Terminal 3
ngrok http 8888
```

Copy the HTTPS forwarding URL, e.g. `https://abc123.ngrok-free.app`

### 5b — Get SSLCommerz sandbox credentials

1. Go to `https://developer.sslcommerz.com/registration/` and register a free sandbox account
2. After registration, your `store_id` and `store_passwd` will be sent to your email

### 5c — Update the backend .env

Open `apps/api/.env` and update these three lines:

```env
SSLCOMMERZ_STORE_ID=your_store_id_here
SSLCOMMERZ_STORE_PASSWD=your_store_passwd_here
SSLCOMMERZ_IS_SANDBOX=True
BACKEND_URL=https://abc123.ngrok-free.app
```

### 5d — Restart the backend

```bash
# Stop uvicorn with Ctrl+C, then:
uvicorn app.main:app --reload --port 8888
```

### 5e — Complete a full payment

1. Log in as a customer → go to `/services` → book any service
2. On the **Checkout** page click **Pay with SSLCommerz**
3. You are redirected to the SSLCommerz-hosted payment page
4. Complete payment using the test credentials from your sandbox account
5. SSLCommerz redirects back to `/order-success/{id}?status=success`
6. Order status changes from `pending` → `confirmed` in the database
7. Log in as the vendor → **Orders tab** shows the order now as `confirmed`

---

## Step 6 — Interactive API Explorer (Swagger)

Open `http://localhost:8888/docs`

All 25+ endpoints are listed and can be tested directly in the browser.

**To authenticate:**
1. Run `POST /api/v1/auth/login` with admin credentials
2. Copy the `access_token` from the response
3. Click the **Authorize** lock button (top right of the page)
4. Enter: `Bearer eyJ...your_token_here`
5. All protected endpoints now work

---

## Step 7 — Verify Role Isolation

| Scenario | Expected |
|---|---|
| Customer visits `/vendor` | Redirected to `/dashboard` |
| Customer visits `/admin` | Redirected to `/dashboard` |
| Vendor visits `/admin` | Redirected to `/vendor` |
| Unauthenticated visits `/dashboard` | Redirected to `/login` |
| Customer calls `GET /api/v1/admin/users` | `403 Forbidden` |
| Vendor calls `GET /api/v1/admin/users` | `403 Forbidden` |
| No token on any protected route | `403 Forbidden` |
| Admin logs in | Lands on `/admin` |
| Vendor registers | Lands on `/vendor` |
| Customer registers | Lands on `/dashboard` |

---

## Common Errors & Fixes

| Error message | Cause | Fix |
|---|---|---|
| `ModuleNotFoundError: No module named 'psycopg2'` | pip install didn't complete | Re-run `pip install -r requirements.txt` with venv active |
| `Could not find a version for sslcommerz-lib==0.0.1` | Wrong version pinned | File is fixed — version is now `1.0` |
| `ModuleNotFoundError` (any module) | Virtual env not activated | Run `.venv\Scripts\activate` first |
| `connection refused` on port 8000 | Backend not started | Run `uvicorn app.main:app --reload --port 8888` in Terminal 1 |
| `connection refused` on port 5173 | Frontend not started | Run `npm run dev` in Terminal 2 |
| White / blank screen in browser | JavaScript runtime error | Press **F12** → **Console** tab → read the error |
| `401 Unauthorized` in browser network tab | Access token expired | The app auto-refreshes tokens — if it persists, log out and back in |
| Categories empty on home page | Database not seeded | Run `python seed.py` from `apps/api` |
| `CORS error` in browser console | URL mismatch in .env | Confirm `FRONTEND_URL=http://localhost:5173` in `apps/api/.env` |
| SSLCommerz gateway page doesn't load | localhost not reachable | Set up ngrok and update `BACKEND_URL` in `apps/api/.env` |
| `502 Bad Gateway` on payment initiate | Wrong SSLCommerz credentials | Add correct `store_id` and `store_passwd` from your sandbox account |
| `400 Order is not in a payable state` | Order already confirmed/cancelled | Only `pending` orders can go through payment — book a new service |
| `Property 'env' does not exist on type 'ImportMeta'` | Missing `vite-env.d.ts` | File exists at `apps/web/src/vite-env.d.ts` — run `npm run build` to confirm |

---

## Quick Reference

**URLs**

| URL | What it is |
|---|---|
| `http://localhost:5173` | Frontend application |
| `http://localhost:8888/docs` | Swagger interactive API docs |
| `http://localhost:8888/health` | Backend health check |
| `http://localhost:8888/api/v1/categories` | Categories JSON (no auth needed) |
| `http://localhost:8888/api/v1/services` | Services JSON (no auth needed) |

**Demo Accounts**

| Role | Email | Password | How created |
|---|---|---|---|
| Admin | `admin@marketplace.com` | `Admin1234!` | `python seed.py` |
| Vendor | register at `/register` | your choice | select "Vendor" on form |
| Customer | register at `/register` | your choice | select "Customer" on form |

**Project Layout**

```
service-marketplace/
├── apps/
│   ├── api/              FastAPI backend
│   │   ├── app/          routes, models, schemas, services
│   │   ├── smoke_test.py automated 31-check test script
│   │   ├── seed.py       creates admin + 8 categories
│   │   ├── requirements.txt
│   │   └── .env          DB url, JWT secret, SSLCommerz keys
│   └── web/              Vite + React frontend
│       ├── src/
│       │   ├── pages/    10 page components
│       │   ├── context/  AuthContext (login, register, logout, token refresh)
│       │   ├── lib/      axios instance + TypeScript types
│       │   └── index.css full design system (variables, components, utilities)
│       └── .env          VITE_API_URL
├── GUIDE.md              this file
└── README.md             full project documentation + ERD + API reference
```
