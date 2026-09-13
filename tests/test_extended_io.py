import pytest
import io
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

def test_dependency_scan_python(client):
    req_content = "flask==0.12\nrequests==2.19\npytest==7.0.0"
    res = client.post(
        "/fetch/dependencies",
        json={"content": req_content, "filename": "requirements.txt"},
        headers={"X-User-ID": "test_user"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["vulnerable_packages_found"] >= 2
    packages = [f["package"] for f in data["findings"]]
    assert "flask" in packages
    assert "requests" in packages

def test_dependency_scan_node(client):
    pkg_content = """{
      "dependencies": {
        "lodash": "4.17.20",
        "express": "4.17.0"
      }
    }"""
    res = client.post(
        "/fetch/dependencies",
        json={"content": pkg_content, "filename": "package.json"},
        headers={"X-User-ID": "test_user"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["vulnerable_packages_found"] >= 2

def test_url_fetch_mocked(client):
    mock_code = "def add(a, b):\n    return a + b\n"
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.text = mock_code
        mock_get.return_value = mock_resp

        res = client.post(
            "/fetch/url",
            json={"url": "https://raw.githubusercontent.com/test/repo/main/math.py", "language": "auto"},
            headers={"X-User-ID": "test_user"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert "data" in data
        assert data["data"]["target_name"] == "https://raw.githubusercontent.com/test/repo/main/math.py"
        assert data["data"]["scores"]["overall"] > 0

def test_json_and_csv_export(client):
    # 1. Create a review first
    analyze_res = client.post(
        "/code-review/analyze",
        json={"code": "import os\nprint('hello')", "filename": "hello.py", "language": "Python"},
        headers={"X-User-ID": "export_user"}
    )
    assert analyze_res.status_code == 200
    review_id = analyze_res.json()["data"]["review_id"]

    # 2. Export JSON
    json_res = client.get(
        f"/exports/json/{review_id}",
        headers={"X-User-ID": "export_user"}
    )
    assert json_res.status_code == 200
    assert "application/json" in json_res.headers["content-type"]
    exported_data = json_res.json()
    assert exported_data["review_id"] == review_id

    # 3. Export CSV
    csv_res = client.get(
        f"/exports/csv/{review_id}",
        headers={"X-User-ID": "export_user"}
    )
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "line,severity,category" in csv_res.text

def test_webhook_dispatch_mocked(client):
    analyze_res = client.post(
        "/code-review/analyze",
        json={"code": "def test(): pass", "filename": "test.py", "language": "Python"},
        headers={"X-User-ID": "webhook_user"}
    )
    review_id = analyze_res.json()["data"]["review_id"]

    with patch("httpx.AsyncClient.post") as mock_post:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_post.return_value = mock_resp

        res = client.post(
            "/notify/webhook",
            json={"review_id": review_id, "webhook_url": "https://hooks.slack.com/services/mock"},
            headers={"X-User-ID": "webhook_user"}
        )
        assert res.status_code == 200
        assert res.json()["status"] == "success"

def test_email_preview(client):
    analyze_res = client.post(
        "/code-review/analyze",
        json={"code": "def test(): pass", "filename": "test.py", "language": "Python"},
        headers={"X-User-ID": "email_user"}
    )
    review_id = analyze_res.json()["data"]["review_id"]

    res = client.post(
        "/notify/email/preview",
        json={"review_id": review_id, "email": "developer@example.com"},
        headers={"X-User-ID": "email_user"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "preview_html" in data
    assert "Smart AI Code Reviewer Report" in data["preview_html"]
