import requests
import uuid

BASE = 'http://localhost:8888/api/v1'
results = []
PASS = 'PASS'
FAIL = 'FAIL'
INFO = 'INFO'

def log(status, label):
    results.append((status, label))
    icon = 'OK' if status == PASS else ('--' if status == INFO else 'XX')
    print(f'  [{icon}] {label}')

try:
    # 1. Health
    r = requests.get('http://localhost:8888/health')
    assert r.json()['status'] == 'ok'
    log(PASS, 'GET /health')

    # 2. Categories
    r = requests.get(f'{BASE}/categories')
    cats = r.json()
    assert len(cats) == 8
    log(PASS, f'GET /categories — {len(cats)} categories returned')

    # 3. Services (public, may be 0)
    r = requests.get(f'{BASE}/services')
    log(PASS, f'GET /services — {len(r.json())} services returned')

    # 4. Register end_user
    email_u = f'smokeuser_{uuid.uuid4().hex[:6]}@test.com'
    r = requests.post(f'{BASE}/auth/register', json={
        'email': email_u, 'password': 'Test1234!',
        'full_name': 'Smoke User', 'role': 'end_user'
    })
    assert r.status_code == 201
    user_tokens = r.json()
    log(PASS, f'POST /auth/register (end_user) — {email_u}')

    # 5. Register vendor
    email_v = f'smokevendor_{uuid.uuid4().hex[:6]}@test.com'
    r = requests.post(f'{BASE}/auth/register', json={
        'email': email_v, 'password': 'Test1234!',
        'full_name': 'Smoke Vendor', 'role': 'vendor'
    })
    assert r.status_code == 201
    vendor_tokens = r.json()
    log(PASS, f'POST /auth/register (vendor) — {email_v}')

    # 6. Admin login
    r = requests.post(f'{BASE}/auth/login', json={
        'email': 'admin@marketplace.com', 'password': 'Admin1234!'
    })
    assert r.status_code == 200
    admin_tok = r.json()['access_token']
    admin_ref = r.json()['refresh_token']
    log(PASS, 'POST /auth/login (admin)')

    # 7. Auth/me
    r = requests.get(f'{BASE}/auth/me', headers={'Authorization': f'Bearer {admin_tok}'})
    me = r.json()
    assert me['role'] == 'admin'
    log(PASS, f'GET /auth/me — role={me["role"]}, name={me["full_name"]}')

    # 8. Token refresh
    r = requests.post(f'{BASE}/auth/refresh', json={'refresh_token': admin_ref})
    assert r.status_code == 200
    log(PASS, 'POST /auth/refresh — new tokens issued')

    # 9. Wrong password rejected
    r = requests.post(f'{BASE}/auth/login', json={
        'email': 'admin@marketplace.com', 'password': 'wrongpassword'
    })
    assert r.status_code == 401
    log(PASS, 'POST /auth/login (wrong password) — 401 returned')

    # 10. Vendor profile create
    vh = vendor_tokens['access_token']
    r = requests.post(f'{BASE}/vendor/profile', json={
        'business_name': 'Smoke Biz Co', 'description': 'Test vendor', 'address': 'Dhaka, BD'
    }, headers={'Authorization': f'Bearer {vh}'})
    assert r.status_code == 201
    vp = r.json()
    log(PASS, f'POST /vendor/profile — id={vp["id"][:8]}')

    # 11. Vendor profile GET
    r = requests.get(f'{BASE}/vendor/profile', headers={'Authorization': f'Bearer {vh}'})
    assert r.status_code == 200 and r.json()['business_name'] == 'Smoke Biz Co'
    log(PASS, 'GET /vendor/profile — profile retrieved')

    # 12. Vendor profile update
    r = requests.patch(f'{BASE}/vendor/profile', json={'address': 'Gulshan, Dhaka'},
                       headers={'Authorization': f'Bearer {vh}'})
    assert r.status_code == 200 and r.json()['address'] == 'Gulshan, Dhaka'
    log(PASS, 'PATCH /vendor/profile — address updated')

    # 13. Create service
    r = requests.post(f'{BASE}/services', json={
        'name': 'Smoke Cleaning', 'description': 'Test service',
        'price': '800.00', 'category_id': cats[0]['id'], 'duration_minutes': 90
    }, headers={'Authorization': f'Bearer {vh}'})
    assert r.status_code == 201
    svc = r.json()
    log(PASS, f'POST /services — id={svc["id"][:8]}, price={svc["price"]}')

    # 14. Search service
    r = requests.get(f'{BASE}/services?search=Smoke')
    assert any(s['id'] == svc['id'] for s in r.json())
    log(PASS, 'GET /services?search=Smoke — service found in results')

    # 15. Filter by category
    r = requests.get(f'{BASE}/services?category_id={cats[0]["id"]}')
    assert any(s['id'] == svc['id'] for s in r.json())
    log(PASS, f'GET /services?category_id — filtered by "{cats[0]["name"]}"')

    # 16. Update service price
    r = requests.patch(f'{BASE}/services/{svc["id"]}', json={'price': '950.00'},
                       headers={'Authorization': f'Bearer {vh}'})
    assert r.status_code == 200 and float(r.json()['price']) == 950.0
    log(PASS, 'PATCH /services/{id} — price updated to 950')

    # 17. Create order (end_user)
    uh = user_tokens['access_token']
    r = requests.post(f'{BASE}/orders', json={
        'service_id': svc['id'], 'address': '5 Test Lane', 'notes': 'Smoke test order'
    }, headers={'Authorization': f'Bearer {uh}'})
    assert r.status_code == 201
    order = r.json()
    assert float(order['total_amount']) == 950.0
    log(PASS, f'POST /orders — id={order["id"][:8]}, amount={order["total_amount"]}')

    # 18. My orders list
    r = requests.get(f'{BASE}/orders', headers={'Authorization': f'Bearer {uh}'})
    assert any(o['id'] == order['id'] for o in r.json())
    log(PASS, 'GET /orders — order appears in customer list')

    # 19. Get single order
    r = requests.get(f'{BASE}/orders/{order["id"]}', headers={'Authorization': f'Bearer {uh}'})
    assert r.status_code == 200
    log(PASS, 'GET /orders/{id} — single order retrieved')

    # 20. Vendor sees order
    r = requests.get(f'{BASE}/vendor/orders', headers={'Authorization': f'Bearer {vh}'})
    assert any(o['id'] == order['id'] for o in r.json())
    log(PASS, 'GET /vendor/orders — order visible to vendor')

    # 21. Vendor updates order status
    r = requests.patch(f'{BASE}/vendor/orders/{order["id"]}/status',
                       json={'status': 'confirmed'},
                       headers={'Authorization': f'Bearer {vh}'})
    assert r.status_code == 200 and r.json()['status'] == 'confirmed'
    log(PASS, 'PATCH /vendor/orders/{id}/status — status set to confirmed')

    # 22. Admin users
    r = requests.get(f'{BASE}/admin/users', headers={'Authorization': f'Bearer {admin_tok}'})
    assert r.status_code == 200
    log(PASS, f'GET /admin/users — {len(r.json())} users listed')

    # 23. Admin vendors
    r = requests.get(f'{BASE}/admin/vendors', headers={'Authorization': f'Bearer {admin_tok}'})
    vlist = r.json()
    assert r.status_code == 200
    log(PASS, f'GET /admin/vendors — {len(vlist)} vendors listed')

    # 24. Admin verify vendor
    vid = next(v['id'] for v in vlist if v['business_name'] == 'Smoke Biz Co')
    r = requests.patch(f'{BASE}/admin/vendors/{vid}/verify',
                       headers={'Authorization': f'Bearer {admin_tok}'})
    assert r.status_code == 200 and r.json()['is_verified'] is True
    log(PASS, 'PATCH /admin/vendors/{id}/verify — is_verified=True')

    # 25. Admin all orders
    r = requests.get(f'{BASE}/admin/orders', headers={'Authorization': f'Bearer {admin_tok}'})
    assert r.status_code == 200
    log(PASS, f'GET /admin/orders — {len(r.json())} orders listed')

    # 26. RBAC: end_user blocked from admin route (must run BEFORE toggling user inactive)
    r = requests.get(f'{BASE}/admin/users', headers={'Authorization': f'Bearer {uh}'})
    assert r.status_code == 403
    log(PASS, 'RBAC: end_user ->/admin/users returns 403 Forbidden')

    # 27. RBAC: vendor blocked from admin route
    r = requests.get(f'{BASE}/admin/users', headers={'Authorization': f'Bearer {vh}'})
    assert r.status_code == 403
    log(PASS, 'RBAC: vendor ->/admin/users returns 403 Forbidden')

    # 28. Unauthenticated blocked
    r = requests.get(f'{BASE}/admin/users')
    assert r.status_code == 403
    log(PASS, 'RBAC: no token ->/admin/users returns 403 Forbidden')

    # 29. Payment initiate (must run before user is disabled/logged out)
    r = requests.post(f'{BASE}/payments/initiate',
                      json={'order_id': order['id']},
                      headers={'Authorization': f'Bearer {uh}'})
    if r.status_code == 200:
        log(PASS, 'POST /payments/initiate — gateway_url received from SSLCommerz')
    elif r.status_code == 502:
        log(INFO, 'POST /payments/initiate — 502 (add real SSLCommerz store_id to .env)')
    else:
        log(INFO, f'POST /payments/initiate — status {r.status_code}')

    # 30. Logout vendor
    r = requests.post(f'{BASE}/auth/logout',
                      json={'refresh_token': vendor_tokens['refresh_token']})
    assert r.status_code == 204
    log(PASS, 'POST /auth/logout — 204 No Content')

    # 31. Admin toggle user active (last — disables test user)
    uid = next(u['id'] for u in requests.get(
        f'{BASE}/admin/users', headers={'Authorization': f'Bearer {admin_tok}'}
    ).json() if u['email'] == email_u)
    r = requests.patch(f'{BASE}/admin/users/{uid}/toggle-active',
                       headers={'Authorization': f'Bearer {admin_tok}'})
    assert r.status_code == 200 and r.json()['is_active'] is False
    log(PASS, 'PATCH /admin/users/{id}/toggle-active — user disabled')

except AssertionError as e:
    log(FAIL, f'Assertion failed: {e}')
except Exception as e:
    log(FAIL, f'Unexpected error: {e}')

passed = sum(1 for s, _ in results if s == PASS)
failed = sum(1 for s, _ in results if s == FAIL)
info   = sum(1 for s, _ in results if s == INFO)

print()
print('=' * 52)
print(f'  {passed} passed   {info} info   {failed} failed   (of {len(results)} checks)')
print('=' * 52)
