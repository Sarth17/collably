"""Collably API. Run with: uvicorn main:app --reload --port 8000   (interactive docs at /docs)"""
import os
import uuid
import secrets
import hashlib
from html import escape as html_escape
from contextlib import asynccontextmanager
from datetime import date, datetime, timezone, timedelta
from typing import Literal

from fastapi import Depends, FastAPI, File, HTTPException, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import seed
from db import Brand, Campaign, Collab, Creator, Deliverable, DemoSessionLocal, EmailToken, HOSTED_DEMO_ENABLED, Message, Notice, ON_VERCEL, Portfolio, Report, Saved, SessionLocal, Upload, User
from security import check_pw, decode_token, hash_pw, make_token
from email_service import send_email


@asynccontextmanager
async def lifespan(_: FastAPI):
    seed.init()
    yield


app = FastAPI(title="Collably API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])
bearer = HTTPBearer(auto_error=False)


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def frontend_url(path: str) -> str:
    host = os.getenv("VERCEL_PROJECT_PRODUCTION_URL") if os.getenv("VERCEL_ENV") == "production" else os.getenv("VERCEL_URL")
    base = os.getenv("FRONTEND_URL") or (f"https://{host}" if host else "http://localhost:5173")
    return base.rstrip("/") + path

def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

def create_email_token(db: Session, user: User, purpose: str) -> str:
    raw = secrets.token_urlsafe(32)
    hours = 24 if purpose == "verify" else 1
    row = EmailToken(id=uid("et"), userId=user.id, tokenHash=token_hash(raw), purpose=purpose, expiresAt=(datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat(), used=False)
    db.add(row)
    db.commit()
    return raw

def consume_email_token(db: Session, raw: str, purpose: str) -> User | None:
    row = db.query(EmailToken).filter(
        EmailToken.tokenHash == token_hash(raw),
        EmailToken.purpose == purpose,
        EmailToken.used.is_(False),
    ).with_for_update().first()
    if not row:
        return None
    try:
        exp = datetime.fromisoformat(row.expiresAt)
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
    except ValueError:
        return None
    if exp < datetime.now(timezone.utc):
        return None
    user = db.get(User, row.userId)
    if not user:
        return None
    row.used = True
    return user

def email_link_html(title: str, message: str, url: str, button: str) -> str:
    return ("<div style='font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#222'>"
            f"<h2>{html_escape(title)}</h2><p>{html_escape(message)}</p><p><a href='{html_escape(url, quote=True)}' style='display:inline-block;background:#6d4aff;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none'>{html_escape(button)}</a></p>"
            f"<p style='font-size:12px;color:#777'>If the button doesn't work, copy this link into your browser:<br>{html_escape(url)}</p></div>")

def uid(prefix: str) -> str:
    return prefix + uuid.uuid4().hex[:8]


def primary_db():
    with SessionLocal() as db:
        yield db


def identity(creds: HTTPAuthorizationCredentials | None = Depends(bearer)) -> tuple[str, bool] | None:
    claims = decode_token(creds.credentials) if creds else None
    if claims and claims[1] and not HOSTED_DEMO_ENABLED:
        return None
    return claims


def get_db(claims: tuple[str, bool] | None = Depends(identity)):
    factory = DemoSessionLocal if claims and claims[1] else SessionLocal
    with factory() as db:
        yield db


def me(claims: tuple[str, bool] | None = Depends(identity), db: Session = Depends(get_db)) -> User:
    user = db.get(User, claims[0]) if claims else None
    if not user:
        raise HTTPException(401, "Please sign in again")
    return user


U, DB, PRIMARY_DB = Depends(me), Depends(get_db), Depends(primary_db)


@app.get("/api/health")
def health(db: Session = PRIMARY_DB):
    db.execute(text("SELECT 1"))
    return {"ok": True}


# ---------- file uploads ----------
MAX_UPLOAD_MB = 4 if ON_VERCEL else 25
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024
ALLOWED_UPLOAD_TYPES = {
    "image/jpeg": (".jpg", 0, (b"\xff\xd8\xff",)),
    "image/png": (".png", 0, (b"\x89PNG\r\n\x1a\n",)),
    "image/webp": (".webp", 8, (b"WEBP",)),
    "image/gif": (".gif", 0, (b"GIF87a", b"GIF89a")),
    "video/mp4": (".mp4", 4, (b"ftyp",)),
    "video/webm": (".webm", 0, (b"\x1a\x45\xdf\xa3",)),
    "application/pdf": (".pdf", 0, (b"%PDF-",)),
}


def need(u: User, *roles: str) -> None:
    if u.role not in roles:
        raise HTTPException(403, "Your role cannot do this")


@app.post("/api/uploads")
def upload_file(file: UploadFile = File(), u: User = U, db: Session = DB):
    need(u, "creator")
    content_type = file.content_type
    file_type = ALLOWED_UPLOAD_TYPES.get(content_type)
    if file_type is None:
        raise HTTPException(400, "Upload a supported image, video, or PDF")
    content = file.file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, f"Files must be {MAX_UPLOAD_MB} MB or smaller")
    extension, offset, signatures = file_type
    if not content.startswith(signatures, offset) or (content_type == "image/webp" and not content.startswith(b"RIFF")):
        raise HTTPException(400, "The file contents do not match the selected format")
    filename = f"{uuid.uuid4().hex}{extension}"
    db.add(Upload(filename=filename, content_type=content_type, content=content))
    db.commit()
    prefix = "/uploads/demo" if db.info.get("demo") else "/uploads"
    return {"filename": filename, "url": f"{prefix}/{filename}"}


@app.get("/uploads/{filename}")
def uploaded_file(filename: str, db: Session = PRIMARY_DB):
    return upload_response(db, filename)


@app.get("/uploads/demo/{filename}")
def uploaded_demo_file(filename: str):
    if not HOSTED_DEMO_ENABLED:
        raise HTTPException(404, "File not found")
    with DemoSessionLocal() as db:
        return upload_response(db, filename)


def upload_response(db: Session, filename: str):
    upload = db.get(Upload, filename)
    if upload is None:
        raise HTTPException(404, "File not found")
    return Response(upload.content, media_type=upload.content_type, headers={
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox",
    })


def d(o) -> dict:
    r = {a.key: getattr(o, a.key) for a in o.__mapper__.column_attrs if getattr(o, a.key) is not None}
    if "sender" in r:
        r["from"] = r.pop("sender")
    return r


def L(xs) -> list:
    return [d(x) for x in xs]


def notify(db: Session, to: str, text: str, link: str) -> None:
    db.add(Notice(id=uid("n"), to=to, text=text, link=link, read=False, at=now()))


def own(db: Session, u: User, kid: str) -> Campaign:
    k = db.get(Campaign, kid)
    if not k or k.brandId != u.profileId:
        raise HTTPException(404, "Campaign not found")
    return k


def recompute(db: Session, kid: str) -> None:
    """Keeps collaboration and campaign status consistent with deliverable status."""
    db.flush()
    k = db.get(Campaign, kid)
    ls = db.query(Collab).filter(Collab.campaignId == kid).all()
    for l in ls:
        if l.status in ("accepted", "active"):
            ds = db.query(Deliverable).filter(Deliverable.collabId == l.id).all()
            if ds and all(x.status == "approved" for x in ds):
                l.status = "completed"
            elif l.status == "accepted" and any(x.status != "pending" for x in ds):
                l.status = "active"
    if k.status == "draft":
        return
    live = [l for l in ls if l.status not in ("pending", "rejected")]
    if live and all(l.status == "completed" for l in live) and not any(l.status == "pending" for l in ls):
        k.status = "completed"
        return
    ids = [l.id for l in live]
    busy = bool(ids) and db.query(Deliverable).filter(Deliverable.collabId.in_(ids), Deliverable.status.in_(["submitted", "in_review"])).count() > 0
    k.status = "in_review" if busy else "active"


def invite(db: Session, kid: str, creator_id: str) -> None:
    c = db.get(Creator, creator_id)
    if not c or c.status != "active":
        raise HTTPException(404, "Creator not found")
    k = db.get(Campaign, kid)
    ex = db.query(Collab).filter(Collab.campaignId == kid, Collab.creatorId == creator_id).first()
    if ex and ex.status != "rejected":
        return
    if ex:
        ex.status, ex.invitedAt = "pending", now()
        l = ex
    else:
        l = Collab(id=uid("l"), campaignId=kid, creatorId=creator_id, status="pending", invitedAt=now())
        db.add(l)
    notify(db, creator_id, f"{db.get(Brand, k.brandId).name} invited you to {k.name}", f"/creator/collaborations/{l.id}")
    user = db.query(User).filter(User.profileId == creator_id, User.role == "creator").first()
    if user and not db.info.get("demo"):
        link = frontend_url(f"/creator/collaborations/{l.id}")
        send_email(user.email, f"You are invited to {k.name} on Collably", email_link_html("Campaign invitation", f"{db.get(Brand, k.brandId).name} invited you to collaborate on {k.name}.", link, "View invitation"))


# ---------- auth ----------
class RegisterIn(BaseModel):
    role: Literal["brand", "creator"]
    name: str = Field(min_length=1, max_length=80)
    email: str
    password: str = Field(min_length=8, max_length=100)


class LoginIn(BaseModel):
    email: str
    password: str


@app.post("/api/auth/login")
def login(b: LoginIn):
    email = b.email.strip().lower()
    demo = HOSTED_DEMO_ENABLED and email in seed.DEMO_EMAILS
    factory = DemoSessionLocal if demo else SessionLocal
    with factory() as db:
        u = db.query(User).filter(User.email == email).first()
        if not u or not check_pw(b.password, u.passwordHash):
            raise HTTPException(401, "Wrong email or password")
        if os.getenv("RESEND_API_KEY") and not u.emailVerified:
            raise HTTPException(403, "Verify your email before signing in")
        return {"token": make_token(u.id, demo=demo)}

@app.post("/api/auth/register")
def register(b: RegisterIn, db: Session = PRIMARY_DB):
    email = b.email.strip().lower()
    if email.count("@") != 1 or not all(email.split("@")) or any(c.isspace() for c in email):
        raise HTTPException(400, "Enter a valid email address")
    if email in seed.DEMO_EMAILS:
        raise HTTPException(409, "That email is reserved for a demo account")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, "That email is already registered")
    pid = uid(b.role[0])
    if b.role == "brand":
        db.add(Brand(id=pid, name=b.name.strip(), industry="General", status="active"))
    else:
        db.add(Creator(id=pid, name=b.name.strip(), handle=email.split("@")[0], niche="General", location="", platforms=[], followers=0, engagement=0.0, bio="", verified=False, status="active", rateMin=0, rateMax=0, profileCompleted=False, metricsSelfReported=True))
    user = User(id=uid("u"), email=email, passwordHash=hash_pw(b.password), role=b.role, profileId=pid)
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        if db.query(User).filter(User.email == email).first():
            raise HTTPException(409, "That email is already registered")
        raise
    verification_required = bool(os.getenv("RESEND_API_KEY"))
    email_sent = send_verification(db, user) if verification_required else False
    return {"ok": True, "verificationRequired": verification_required, "emailSent": email_sent}

@app.get("/api/auth/verify-email")
def verify_email(token: str, db: Session = PRIMARY_DB):
    user = consume_email_token(db, token, "verify")
    if not user:
        raise HTTPException(400, "This verification link is invalid or expired. Request a new one.")
    user.emailVerified = True
    db.commit()
    return {"ok": True, "message": "Email verified. You can now sign in."}


class EmailOnly(BaseModel):
    email: str


def send_verification(db: Session, user: User) -> bool:
    raw = create_email_token(db, user, "verify")
    link = frontend_url(f"/verify-email?token={raw}")
    return send_email(user.email, "Verify your Collably email", email_link_html(
        "Verify your email", "Confirm your email address to activate Collably.", link, "Verify email"
    ))


@app.post("/api/auth/resend-verification")
def resend_verification(b: EmailOnly, db: Session = PRIMARY_DB):
    if not os.getenv("RESEND_API_KEY"):
        raise HTTPException(503, "Verification email delivery is unavailable")
    user = db.query(User).filter(User.email == b.email.strip().lower()).first()
    if user and not user.emailVerified:
        send_verification(db, user)
    return {"ok": True}



@app.post("/api/auth/forgot-password")
def forgot_password(b: EmailOnly, db: Session = PRIMARY_DB):
    if not os.getenv("RESEND_API_KEY"):
        raise HTTPException(503, "Password reset email delivery is unavailable")
    user = db.query(User).filter(User.email == b.email.strip().lower()).first()
    if user:
        raw = create_email_token(db, user, "reset")
        link = frontend_url(f"/reset-password?token={raw}")
        send_email(user.email, "Reset your Collably password", email_link_html("Reset your password", "We received a request to reset your Collably password. This link expires in one hour.", link, "Reset password"))
    return {"ok": True, "message": "If an account exists, a password-reset email has been sent."}


class ResetPasswordIn(BaseModel):
    token: str
    password: str = Field(min_length=8, max_length=100)



@app.post("/api/auth/reset-password")
def reset_password(b: ResetPasswordIn, db: Session = PRIMARY_DB):
    user = consume_email_token(db, b.token, "reset")
    if not user:
        raise HTTPException(400, "This reset link is invalid or expired. Request a new one.")
    user.passwordHash = hash_pw(b.password)
    db.commit()
    return {"ok": True}


# ---------- state (everything the signed-in user is allowed to see) ----------
@app.get("/api/state")
def state(u: User = U, db: Session = DB):
    pid, role = u.profileId, u.role
    campaigns, collabs = db.query(Campaign).all(), db.query(Collab).all()
    if role == "brand":
        campaigns = [k for k in campaigns if k.brandId == pid]
        collabs = [l for l in collabs if l.campaignId in {k.id for k in campaigns}]
    elif role == "creator":
        collabs = [l for l in collabs if l.creatorId == pid]
        # Creators can browse active campaigns; keep drafts private and include their own collaboration campaigns.
        linked = {l.campaignId for l in collabs}
        campaigns = [k for k in campaigns if k.status == "active" or k.id in linked]
    cids = {l.id for l in collabs}
    return {
        "session": {
            "role": role, "userId": pid,
            "demo": bool(db.info.get("demo")) or (seed.DEMO_ENABLED and u.email in seed.DEMO_EMAILS),
        },
        "creators": L(db.query(Creator).all()), "brands": L(db.query(Brand).all()),
        "campaigns": L(campaigns), "collabs": L(collabs),
        "deliverables": L(x for x in db.query(Deliverable).all() if x.collabId in cids),
        "messages": L(x for x in db.query(Message).order_by(Message.at).all() if x.collabId in cids),
        "notifications": L(db.query(Notice).filter(Notice.to == pid).order_by(Notice.at.desc()).all()),
        "reports": L(db.query(Report).all()) if role == "admin" else [],
        "saved": [x.creatorId for x in db.query(Saved).filter(Saved.brandId == pid)] if role == "brand" else [],
        "portfolio": L(db.query(Portfolio).all()),
    }


# ---------- brand ----------
@app.post("/api/saved/{cid}")
def toggle_saved(cid: str, u: User = U, db: Session = DB):
    need(u, "brand")
    if not db.get(Creator, cid):
        raise HTTPException(404, "Creator not found")
    row = db.get(Saved, (u.profileId, cid))
    if row:
        db.delete(row)
    else:
        db.add(Saved(brandId=u.profileId, creatorId=cid))
    db.commit()
    return {"ok": True}


class CampaignIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = ""
    budget: int = Field(gt=0)
    deadline: str
    deliverables: list[str] = Field(min_length=1)
    creatorIds: list[str] = []
    launch: bool = False


@app.post("/api/campaigns")
def create_campaign(b: CampaignIn, u: User = U, db: Session = DB):
    need(u, "brand")
    try:
        date.fromisoformat(b.deadline)
    except ValueError:
        raise HTTPException(400, "Deadline must be a date like 2026-12-31")
    k = Campaign(id=uid("k"), brandId=u.profileId, name=b.name.strip(), description=b.description.strip(), budget=b.budget, deadline=b.deadline, status="active" if b.launch else "draft", deliverables=b.deliverables)
    db.add(k)
    db.flush()
    if b.launch:
        for cid in dict.fromkeys(b.creatorIds):
            invite(db, k.id, cid)
    db.commit()
    return {"id": k.id}


@app.post("/api/campaigns/{kid}/launch")
def launch(kid: str, u: User = U, db: Session = DB):
    need(u, "brand")
    k = own(db, u, kid)
    if k.status == "draft":
        k.status = "active"
    db.commit()
    return {"ok": True}


@app.post("/api/campaigns/{kid}/invite/{cid}")
def invite_creator(kid: str, cid: str, u: User = U, db: Session = DB):
    need(u, "brand")
    k = own(db, u, kid)
    if k.status in ("draft", "completed"):
        raise HTTPException(409, "Launch the campaign before inviting creators")
    invite(db, kid, cid)
    db.commit()
    return {"ok": True}


ALLOWED = {"submitted": {"in_review"}, "in_review": {"approved", "revision_requested"}}


class ReviewIn(BaseModel):
    status: Literal["in_review", "approved", "revision_requested"]
    feedback: str | None = None


@app.post("/api/deliverables/{did}/review")
def review(did: str, b: ReviewIn, u: User = U, db: Session = DB):
    need(u, "brand")
    x = db.get(Deliverable, did)
    l = db.get(Collab, x.collabId) if x else None
    if not l:
        raise HTTPException(404, "Deliverable not found")
    k = own(db, u, l.campaignId)
    if b.status not in ALLOWED.get(x.status, set()):
        raise HTTPException(409, "That change is not allowed from the current status")
    if b.status == "revision_requested" and not (b.feedback or "").strip():
        raise HTTPException(400, "Tell the creator what to change")
    x.status = b.status
    if b.feedback:
        x.feedback = b.feedback.strip()
    if b.status != "in_review":
        verb = "approved" if b.status == "approved" else "requested changes on"
        notify(db, l.creatorId, f"{db.get(Brand, k.brandId).name} {verb} “{x.title}”", f"/creator/collaborations/{l.id}")
    recompute(db, k.id)
    db.commit()
    return {"status": x.status}


# ---------- creator ----------
class RespondIn(BaseModel):
    accept: bool


@app.post("/api/collabs/{lid}/respond")
def respond(lid: str, b: RespondIn, u: User = U, db: Session = DB):
    need(u, "creator")
    l = db.get(Collab, lid)
    if not l or l.creatorId != u.profileId:
        raise HTTPException(404, "Invitation not found")
    if l.status != "pending":
        raise HTTPException(409, "This invitation was already answered")
    k, c = db.get(Campaign, l.campaignId), db.get(Creator, u.profileId)
    l.status = "accepted" if b.accept else "rejected"
    if b.accept:
        for t in k.deliverables:
            db.add(Deliverable(id=uid("d"), collabId=l.id, title=t, status="pending"))
    notify(db, k.brandId, f"{c.name} {'accepted' if b.accept else 'declined'} your invitation to {k.name}", f"/brand/campaigns/{k.id}")
    db.commit()
    return {"status": l.status}


class SubmitIn(BaseModel):
    url: str = Field(min_length=1, max_length=2048)
    notes: str = ""


@app.post("/api/deliverables/{did}/submit")
def submit(did: str, b: SubmitIn, u: User = U, db: Session = DB):
    need(u, "creator")
    if not (b.url.startswith("http://") or b.url.startswith("https://") or b.url.startswith("/uploads/")):
        raise HTTPException(400, "Provide a valid external link or uploaded file")
    x = db.get(Deliverable, did)
    l = db.get(Collab, x.collabId) if x else None
    if not l or l.creatorId != u.profileId:
        raise HTTPException(404, "Deliverable not found")
    if x.status not in ("pending", "revision_requested"):
        raise HTTPException(409, "This deliverable is already with the brand")
    k = db.get(Campaign, l.campaignId)
    x.status, x.url, x.notes = "submitted", b.url, b.notes.strip()
    notify(db, k.brandId, f"{db.get(Creator, l.creatorId).name} submitted “{x.title}”", f"/brand/campaigns/{k.id}")
    recompute(db, k.id)
    db.commit()
    return {"status": x.status}


class PortfolioIn(BaseModel):
    id: str | None = None
    title: str = Field(min_length=1, max_length=120)
    description: str = ""
    category: str = ""
    platform: str
    url: str = Field(min_length=1, max_length=2048)


@app.post("/api/portfolio")
def save_portfolio(b: PortfolioIn, u: User = U, db: Session = DB):
    need(u, "creator")
    if not (b.url.startswith("http://") or b.url.startswith("https://") or b.url.startswith("/uploads/")):
        raise HTTPException(400, "Provide a valid external link or uploaded file")
    fields = b.model_dump(exclude={"id"})
    if b.id:
        p = db.get(Portfolio, b.id)
        if not p or p.creatorId != u.profileId:
            raise HTTPException(404, "Portfolio item not found")
        for k, v in fields.items():
            setattr(p, k, v)
    else:
        db.add(Portfolio(id=uid("p"), creatorId=u.profileId, views=0, **fields))
    db.commit()
    return {"ok": True}


@app.delete("/api/portfolio/{pid}")
def delete_portfolio(pid: str, u: User = U, db: Session = DB):
    need(u, "creator")
    p = db.get(Portfolio, pid)
    if not p or p.creatorId != u.profileId:
        raise HTTPException(404, "Portfolio item not found")
    db.delete(p)
    db.commit()
    return {"ok": True}


# ---------- shared ----------
class MessageIn(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


@app.post("/api/collabs/{lid}/messages")
def send_message(lid: str, b: MessageIn, u: User = U, db: Session = DB):
    need(u, "brand", "creator")
    l = db.get(Collab, lid)
    k = db.get(Campaign, l.campaignId) if l else None
    if not l or (u.role == "creator" and l.creatorId != u.profileId) or (u.role == "brand" and k.brandId != u.profileId):
        raise HTTPException(404, "Conversation not found")
    if l.status not in ("accepted", "active", "completed"):
        raise HTTPException(409, "Messaging opens once the invitation is accepted")
    db.add(Message(id=uid("m"), collabId=lid, sender=u.role, text=b.text.strip(), at=now()))
    to, other = (l.creatorId, "creator") if u.role == "brand" else (k.brandId, "brand")
    who = db.get(Brand, k.brandId).name if u.role == "brand" else db.get(Creator, l.creatorId).name
    notify(db, to, f"New message from {who}", f"/{other}/messages?c={lid}")
    db.commit()
    return {"ok": True}


@app.post("/api/notifications/read-all")
def read_all(u: User = U, db: Session = DB):
    db.query(Notice).filter(Notice.to == u.profileId).update({Notice.read: True})
    db.commit()
    return {"ok": True}


@app.post("/api/notifications/{nid}/read")
def read_one(nid: str, u: User = U, db: Session = DB):
    n = db.get(Notice, nid)
    if n and n.to == u.profileId:
        n.read = True
        db.commit()
    return {"ok": True}


class ProfileIn(BaseModel):
    name: str = ""
    bio: str | None = None
    location: str | None = None
    niche: str | None = None
    industry: str | None = None
    platforms: list[str] | None = None
    followers: int | None = Field(default=None, ge=0, le=1000000000)
    engagement: float | None = Field(default=None, ge=0, le=100)
    rateMin: int | None = Field(default=None, ge=0)
    rateMax: int | None = Field(default=None, ge=0)
    profileCompleted: bool | None = None


@app.put("/api/profile")
def update_profile(b: ProfileIn, u: User = U, db: Session = DB):
    need(u, "brand", "creator")
    if u.role == "creator":
        c = db.get(Creator, u.profileId)
        c.name = b.name.strip() or c.name
        for f in ("bio", "location", "niche", "platforms", "followers", "engagement", "rateMin", "rateMax", "profileCompleted"):
            if getattr(b, f) is not None:
                setattr(c, f, getattr(b, f))
        c.metricsSelfReported = True
    else:
        br = db.get(Brand, u.profileId)
        br.name = b.name.strip() or br.name
        if b.industry is not None:
            br.industry = b.industry
    db.commit()
    return {"ok": True}


# ---------- admin ----------
@app.post("/api/admin/users/{pid}/toggle")
def toggle_user(pid: str, u: User = U, db: Session = DB):
    need(u, "admin")
    t = db.get(Creator, pid) or db.get(Brand, pid)
    if not t:
        raise HTTPException(404, "User not found")
    t.status = "suspended" if t.status == "active" else "active"
    db.commit()
    return {"status": t.status}


class ReportIn(BaseModel):
    status: Literal["resolved", "dismissed"]


@app.post("/api/admin/reports/{rid}")
def close_report(rid: str, b: ReportIn, u: User = U, db: Session = DB):
    need(u, "admin")
    r = db.get(Report, rid)
    if not r:
        raise HTTPException(404, "Report not found")
    r.status = b.status
    db.commit()
    return {"status": r.status}


@app.post("/api/dev/reset")
def dev_reset():
    """Restores the sample data. Disabled when COLLABLY_DEV is not 1."""
    if not seed.DEMO_ENABLED:
        raise HTTPException(404, "Not found")
    seed.reset()
    return {"ok": True}
