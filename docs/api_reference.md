# API Reference

### Base URL: `http://127.0.0.1:8001`

## 1. Authentication
### `POST /auth/register`
**Request Body**:
```json
{
  "user_id": "YASHAS001",
  "password": "Password123!",
  "confirm_password": "Password123!"
}
```
**Response**: `200 OK`

### `POST /auth/login`
**Request Body**:
```json
{
  "user_id": "YASHAS001",
  "password": "Password123!"
}
```
**Response**: `200 OK`

## 2. Code Review
### `POST /code-review/analyze`
**Headers**: `X-User-ID: YASHAS001`
**Request Body**:
```json
{
  "code": "def add(a, b): return a + b",
  "filename": "math_utils.py",
  "language": "Python"
}
```

### `POST /code-review/upload`
**Headers**: `X-User-ID: YASHAS001`
**Form Data**: `file: [binary payload]`

### `GET /code-review/report/{report_name}`
Returns: `application/pdf`

## 3. GitHub
### `POST /github/review`
**Headers**: `X-User-ID: YASHAS001`
**Request Body**:
```json
{
  "repo_url": "https://github.com/octocat/Hello-World",
  "branch": "master"
}
```

## 4. History
### `GET /history`
**Headers**: `X-User-ID: YASHAS001`

### `DELETE /history/{review_id}`
**Headers**: `X-User-ID: YASHAS001`
