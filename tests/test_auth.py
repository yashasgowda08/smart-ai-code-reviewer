import pytest

def test_register_user_success(client):
    res = client.post("/auth/register", json={
        "user_id": "TEST_USER_01",
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["user_id"] == "TEST_USER_01"

def test_register_duplicate_user_fails(client):
    client.post("/auth/register", json={
        "user_id": "TEST_USER_DUP",
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    res = client.post("/auth/register", json={
        "user_id": "TEST_USER_DUP",
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]

def test_register_password_mismatch_fails(client):
    res = client.post("/auth/register", json={
        "user_id": "TEST_USER_MISMATCH",
        "password": "Password123!",
        "confirm_password": "WrongPassword!"
    })
    assert res.status_code == 400
    assert "match" in res.json()["detail"]

def test_login_success(client):
    client.post("/auth/register", json={
        "user_id": "TEST_LOGIN_USER",
        "password": "SecretPassword1",
        "confirm_password": "SecretPassword1"
    })
    res = client.post("/auth/login", json={
        "user_id": "TEST_LOGIN_USER",
        "password": "SecretPassword1"
    })
    assert res.status_code == 200
    assert res.json()["status"] == "success"
    assert res.json()["user_id"] == "TEST_LOGIN_USER"

def test_login_wrong_password_fails(client):
    res = client.post("/auth/login", json={
        "user_id": "TEST_LOGIN_USER",
        "password": "WrongPasswordHere"
    })
    assert res.status_code == 401
