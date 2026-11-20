"""Database tables. Column names mirror the frontend's JSON keys so rows can be sent as they are.
Set DATABASE_URL to a PostgreSQL URL (for example postgresql+psycopg://user:pass@host/db) to leave SQLite."""
import os
from pathlib import Path

from sqlalchemy import JSON, Boolean, Column, Float, ForeignKey, Integer, LargeBinary, String, create_engine
from sqlalchemy.engine import URL, make_url
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool

DATABASE_URL = os.getenv("DATABASE_URL")
ON_VERCEL = os.getenv("VERCEL") == "1"
if ON_VERCEL and not DATABASE_URL:
    raise RuntimeError("Set DATABASE_URL to the Neon PostgreSQL connection on Vercel")

url = (
    make_url(DATABASE_URL)
    if DATABASE_URL
    else URL.create("sqlite", database=str(Path(__file__).with_name("collably.db")))
)
if url.drivername in {"postgres", "postgresql"}:
    url = url.set(drivername="postgresql+psycopg")
if ON_VERCEL and url.get_backend_name() != "postgresql":
    raise RuntimeError("DATABASE_URL must point to PostgreSQL on Vercel")

engine_options = {}
if url.get_backend_name() == "sqlite":
    engine_options["connect_args"] = {"check_same_thread": False}
elif ON_VERCEL:
    # Neon pools the hosted connections. Avoid a second pool in each serverless instance.
    engine_options["poolclass"] = NullPool
    engine_options["connect_args"] = {"connect_timeout": 10}

engine = create_engine(url, pool_pre_ping=True, **engine_options)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

Base = declarative_base()
def S(*a, **kw):
    return Column(String, *a, **kw)


class User(Base): __tablename__ = "users"; id = S(primary_key=True); email = S(unique=True, nullable=False); passwordHash = S(nullable=False); role = S(nullable=False); profileId = S(nullable=False); emailVerified = Column(Boolean, default=False, nullable=False)
class Creator(Base): __tablename__ = "creators"; id = S(primary_key=True); name = S(); handle = S(); niche = S(); location = S(); platforms = Column(JSON); followers = Column(Integer); engagement = Column(Float); bio = S(); verified = Column(Boolean, default=False); status = S(default="active"); rateMin = Column(Integer, default=0); rateMax = Column(Integer, default=0); profileCompleted = Column(Boolean, default=False); metricsSelfReported = Column(Boolean, default=True)
class Brand(Base): __tablename__ = "brands"; id = S(primary_key=True); name = S(); industry = S(); status = S(default="active")
class Campaign(Base): __tablename__ = "campaigns"; id = S(primary_key=True); brandId = S(ForeignKey("brands.id")); name = S(); description = S(); budget = Column(Integer); deadline = S(); status = S(); deliverables = Column(JSON)
class Collab(Base): __tablename__ = "collabs"; id = S(primary_key=True); campaignId = S(ForeignKey("campaigns.id")); creatorId = S(ForeignKey("creators.id")); status = S(); invitedAt = S()
class Deliverable(Base): __tablename__ = "deliverables"; id = S(primary_key=True); collabId = S(ForeignKey("collabs.id")); title = S(); status = S(); url = S(); notes = S(); feedback = S()
class Message(Base): __tablename__ = "messages"; id = S(primary_key=True); collabId = S(ForeignKey("collabs.id")); sender = S(); text = S(); at = S()
class Notice(Base): __tablename__ = "notices"; id = S(primary_key=True); to = Column("recipient", String, index=True); text = S(); link = S(); read = Column("is_read", Boolean, default=False); at = S()
class Report(Base): __tablename__ = "reports"; id = S(primary_key=True); target = S(); reason = S(); priority = S(); status = S()
class Portfolio(Base): __tablename__ = "portfolio"; id = S(primary_key=True); creatorId = S(ForeignKey("creators.id")); title = S(); description = S(); category = S(); platform = S(); url = S(); views = Column(Integer, default=0)
class Saved(Base): __tablename__ = "saved"; brandId = S(ForeignKey("brands.id"), primary_key=True); creatorId = S(ForeignKey("creators.id"), primary_key=True)

class EmailToken(Base): __tablename__ = "email_tokens"; id = S(primary_key=True); userId = S(ForeignKey("users.id"), nullable=False, index=True); tokenHash = S(unique=True, nullable=False, index=True); purpose = S(nullable=False); expiresAt = S(nullable=False); used = Column(Boolean, default=False, nullable=False)


class Upload(Base):
    __tablename__ = "uploads"
    filename = S(primary_key=True)
    content_type = S(nullable=False)
    content = Column(LargeBinary, nullable=False)
