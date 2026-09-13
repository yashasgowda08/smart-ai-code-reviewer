import pytest
from app.services.admin_service import ADMIN_SECRET_KEY

def test_admin_verify_passkey_success(client):
    res = client.post("/admin/auth/verify", json={"secret_key": ADMIN_SECRET_KEY})
    assert res.status_code == 200
    assert res.json()["status"] == "success"

def test_admin_verify_passkey_invalid_fails(client):
    res = client.post("/admin/auth/verify", json={"secret_key": "WRONG_SECRET_KEY_XYZ"})
    assert res.status_code == 401

def test_admin_unauthorized_access_fails_without_header(client):
    res = client.get("/admin/stats")
    assert res.status_code == 403
    assert "Access Denied" in res.json()["detail"]

def test_admin_unauthorized_access_fails_with_bad_header(client):
    res = client.get("/admin/stats", headers={"X-Admin-Key": "INVALID_KEY"})
    assert res.status_code == 403

def test_admin_get_stats_authorized(client):
    res = client.get("/admin/stats", headers={"X-Admin-Key": ADMIN_SECRET_KEY})
    assert res.status_code == 200
    data = res.json()["data"]
    assert "total_users" in data
    assert "total_reviews" in data
    assert "risk_breakdown" in data

def test_admin_multi_user_review_inspection(client):
    # Register and create review for User A
    client.post("/auth/register", json={"user_id": "USER_ALPHA", "password": "Password123!", "confirm_password": "Password123!"})
    client.post("/code-review/analyze", json={"code": "def alpha(): return 1\n", "filename": "alpha.py", "language": "Python"}, headers={"X-User-ID": "USER_ALPHA"})

    # Register and create review for User B
    client.post("/auth/register", json={"user_id": "USER_BETA", "password": "Password123!", "confirm_password": "Password123!"})
    client.post("/code-review/analyze", json={"code": "def beta(): return 2\n", "filename": "beta.py", "language": "Python"}, headers={"X-User-ID": "USER_BETA"})

    # Regular user isolation check: User ALPHA only sees ALPHA
    alpha_hist = client.get("/history", headers={"X-User-ID": "USER_ALPHA"}).json()
    assert all(r["user_id"] == "USER_ALPHA" for r in alpha_hist["reviews"])

    # Admin access check: Admin sees BOTH Alpha and Beta
    admin_reviews_res = client.get("/admin/reviews", headers={"X-Admin-Key": ADMIN_SECRET_KEY})
    assert admin_reviews_res.status_code == 200
    all_reviews = admin_reviews_res.json()["reviews"]
    user_ids = [r["user_id"] for r in all_reviews]
    assert "USER_ALPHA" in user_ids
    assert "USER_BETA" in user_ids

    # Admin user list check
    users_res = client.get("/admin/users", headers={"X-Admin-Key": ADMIN_SECRET_KEY})
    assert users_res.status_code == 200
    registered_ids = [u["user_id"] for u in users_res.json()["users"]]
    assert "USER_ALPHA" in registered_ids
    assert "USER_BETA" in registered_ids