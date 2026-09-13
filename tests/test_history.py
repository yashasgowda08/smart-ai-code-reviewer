import pytest
import io

def test_history_user_isolation(client):
    # User A creates a review
    code_a = "def fn_a(): return 'a'\n"
    res_a = client.post(
        "/code-review/analyze",
        json={"code": code_a, "filename": "user_a.py", "language": "Python"},
        headers={"X-User-ID": "USER_ALICE"}
    )
    assert res_a.status_code == 200
    review_id_a = res_a.json()["data"]["review_id"]

    # User B creates a review
    code_b = "def fn_b(): return 'b'\n"
    res_b = client.post(
        "/code-review/analyze",
        json={"code": code_b, "filename": "user_b.py", "language": "Python"},
        headers={"X-User-ID": "USER_BOB"}
    )
    assert res_b.status_code == 200

    # Check User A history
    hist_a = client.get("/history", headers={"X-User-ID": "USER_ALICE"}).json()
    assert hist_a["count"] >= 1
    assert all(r["user_id"] == "USER_ALICE" for r in hist_a["reviews"])

    # Check User B history
    hist_b = client.get("/history", headers={"X-User-ID": "USER_BOB"}).json()
    assert hist_b["count"] >= 1
    assert all(r["user_id"] == "USER_BOB" for r in hist_b["reviews"])

    # User B cannot delete User A review
    del_res = client.delete(f"/history/{review_id_a}", headers={"X-User-ID": "USER_BOB"})
    assert del_res.status_code == 404

    # User A can delete own review
    del_res_ok = client.delete(f"/history/{review_id_a}", headers={"X-User-ID": "USER_ALICE"})
    assert del_res_ok.status_code == 200
