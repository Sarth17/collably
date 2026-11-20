import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def app(tmp_path_factory):
    with pytest.MonkeyPatch.context() as env:
        env.delenv("VERCEL", raising=False)
        env.setenv("COLLABLY_DEV", "1")
        env.setenv("DATABASE_URL", f"sqlite:///{tmp_path_factory.mktemp('collably') / 'test.db'}")
        from db import engine
        from main import app

        yield app
        engine.dispose()


def sign_in(c, role):
    r = c.post("/api/auth/login", json={"email": f"demo-{role}@collably.test", "password": "demo1234"})
    return {"Authorization": "Bearer " + r.json()["token"]}


def test_invite_to_approval(app):
    with TestClient(app) as c:
        c.post("/api/dev/reset")
        brand, creator = sign_in(c, "brand"), sign_in(c, "creator")
        body = {"name": "Test", "budget": 1000, "deadline": "2026-12-31", "deliverables": ["Reel"], "creatorIds": ["c1"], "launch": True}
        assert c.post("/api/campaigns", headers=creator, json=body).status_code == 403  # roles are enforced
        kid = c.post("/api/campaigns", headers=brand, json=body).json()["id"]
        lid = next(l["id"] for l in c.get("/api/state", headers=creator).json()["collabs"] if l["campaignId"] == kid)
        assert c.post(f"/api/collabs/{lid}/respond", headers=creator, json={"accept": True}).status_code == 200
        did = next(x["id"] for x in c.get("/api/state", headers=creator).json()["deliverables"] if x["collabId"] == lid)
        assert c.post(f"/api/deliverables/{did}/submit", headers=creator, json={"url": "https://example.com/x"}).status_code == 200
        assert c.post(f"/api/deliverables/{did}/review", headers=brand, json={"status": "approved"}).status_code == 409  # review must start first
        c.post(f"/api/deliverables/{did}/review", headers=brand, json={"status": "in_review"})
        c.post(f"/api/deliverables/{did}/review", headers=brand, json={"status": "approved"})
        campaigns = c.get("/api/state", headers=brand).json()["campaigns"]
        assert next(k for k in campaigns if k["id"] == kid)["status"] == "completed"


def test_authenticated_file_upload(app):
    contents = b"\x89PNG\r\n\x1a\n" + b"test"
    with TestClient(app) as c:
        creator = sign_in(c, "creator")
        response = c.post(
            "/api/uploads",
            headers=creator,
            files={"file": ("portfolio.png", contents, "image/png")},
        )
        assert response.status_code == 200
        uploaded = response.json()
        assert uploaded["url"].startswith("/uploads/")
        invalid = c.post(
            "/api/uploads",
            headers=creator,
            files={"file": ("script.txt", b"text", "text/plain")},
        )
        assert invalid.status_code == 400
    with TestClient(app) as c:
        download = c.get(uploaded["url"])
        assert download.status_code == 200
        assert download.headers["content-type"] == "image/png"
        assert download.content == contents


def test_email_verification_and_password_reset(app, monkeypatch):
    from db import EmailToken, SessionLocal, User
    import main
    from main import token_hash

    monkeypatch.setenv("RESEND_API_KEY", "example-test-key")
    monkeypatch.setattr(main, "send_email", lambda *args: True)
    with TestClient(app) as c:
        c.post("/api/dev/reset")
        payload = {"role": "creator", "name": "Test Email", "email": "email-flow@example.test", "password": "password123"}
        response = c.post("/api/auth/register", json=payload)
        assert response.status_code == 200
        assert response.json()["ok"] is True
        assert response.json()["verificationRequired"] is True
        assert response.json()["emailSent"] is True
        with SessionLocal() as db:
            user = db.query(User).filter(User.email == payload["email"]).first()
            assert user and user.emailVerified is False
            verify_token_row = db.query(EmailToken).filter(EmailToken.userId == user.id, EmailToken.purpose == "verify").first()
            verify_raw = "test-verify-token"
            verify_token_row.tokenHash = token_hash(verify_raw)
            db.commit()
        assert c.post("/api/auth/login", json={"email": payload["email"], "password": payload["password"]}).status_code == 403
        assert c.get("/api/auth/verify-email", params={"token": verify_raw}).status_code == 200
        login = c.post("/api/auth/login", json={"email": payload["email"], "password": payload["password"]})
        assert login.status_code == 200
        with SessionLocal() as db:
            user = db.query(User).filter(User.email == payload["email"]).first()
            reset_row = EmailToken(id="test-reset", userId=user.id, tokenHash=token_hash("test-reset-token"), purpose="reset", expiresAt="2099-01-01T00:00:00+00:00", used=False)
            db.add(reset_row)
            db.commit()
        reset = c.post("/api/auth/reset-password", json={"token": "test-reset-token", "password": "newpassword123"})
        assert reset.status_code == 200
        assert c.post("/api/auth/login", json={"email": payload["email"], "password": "newpassword123"}).status_code == 200
        assert c.post("/api/auth/reset-password", json={"token": "test-reset-token", "password": "anotherpass123"}).status_code == 400
