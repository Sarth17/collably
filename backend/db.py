"""Database tables. Column names mirror the frontend's JSON keys so rows can be sent as they are.
Set DATABASE_URL to a PostgreSQL URL (for example postgresql+psycopg://user:pass@host/db) to leave SQLite."""
import os
from sqlalchemy import create_engine
from sqlalchemy import JSON, Boolean, Column, Float, ForeignKey, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./collably.db")

connect_args = (
    {"check_same_thread": False}
    if DATABASE_URL.startswith("sqlite")
    else {}
)

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

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
