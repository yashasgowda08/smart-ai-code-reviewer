import pytest
import io

def test_upload_python_file(client):
    code = "def add(a, b):\n    return a + b\n"
    files = {"file": ("math_helper.py", io.BytesIO(code.encode("utf-8")), "text/plain")}
    res = client.post("/code-review/upload", files=files, headers={"X-User-ID": "TEST_USER_01"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["target_name"] == "math_helper.py"
    assert data["primary_language"] == "Python"
    assert "scores" in data
    assert "predictions" in data

def test_upload_java_file(client):
    java_code = "public class Calc { public int add(int a, int b) { return a + b; } }"
    files = {"file": ("Calc.java", io.BytesIO(java_code.encode("utf-8")), "text/plain")}
    res = client.post("/code-review/upload", files=files, headers={"X-User-ID": "TEST_USER_01"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["primary_language"] == "Java"

def test_upload_unsupported_file_fails(client):
    files = {"file": ("document.pdf", io.BytesIO(b"%PDF-1.4..."), "application/pdf")}
    res = client.post("/code-review/upload", files=files)
    assert res.status_code == 400
    assert "Unsupported file format" in res.json()["detail"]

def test_upload_empty_file_fails(client):
    files = {"file": ("empty.py", io.BytesIO(b""), "text/plain")}
    res = client.post("/code-review/upload", files=files)
    assert res.status_code == 400
