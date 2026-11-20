"""Sample data (fictional). init() seeds an empty database; reset() wipes and reseeds (development only)."""
from db import Base, Brand, Campaign, Collab, Creator, Deliverable, Message, Notice, Portfolio, Report, Saved, SessionLocal, User, EmailToken, engine
from security import hash_pw

RAW = [
    ("Priya Mehta", "priyamehta", "Beauty", "Mumbai", ["Instagram", "YouTube"], 182000, 5.4, "Skincare routines and honest product reviews."),
    ("Arjun Rao", "arjuneats", "Food", "Bengaluru", ["Instagram", "YouTube"], 96000, 6.1, "Street food trails and quick home recipes."),
    ("Meera Kapoor", "meerafit", "Fitness", "Delhi", ["Instagram"], 240000, 4.2, "Strength training for busy people."),
    ("Kabir Shah", "kabirtech", "Tech", "Pune", ["YouTube"], 310000, 3.8, "Gadget reviews without the hype."),
    ("Sana Iqbal", "sanawanders", "Travel", "Hyderabad", ["Instagram", "TikTok"], 128000, 5.0, "Slow travel and weekend getaways."),
    ("Rohan Verma", "rohanrides", "Automotive", "Jaipur", ["YouTube"], 74000, 4.9, "Bike tours and riding gear tests."),
    ("Ishita Nair", "ishitastyles", "Fashion", "Kochi", ["Instagram"], 156000, 5.7, "Sustainable fashion and thrift hauls."),
    ("Dev Malhotra", "devplays", "Gaming", "Chandigarh", ["YouTube", "Twitch"], 205000, 4.4, "Indie game spotlights and live streams."),
    ("Tara Joshi", "tarahome", "Home", "Ahmedabad", ["Instagram", "Pinterest"], 88000, 6.3, "Small-space decor on a budget."),
    ("Neil Fernandes", "neilmoney", "Finance", "Goa", ["YouTube", "LinkedIn"], 142000, 4.6, "Personal finance explained simply."),
    ("Aditi Sen", "aditiglow", "Beauty", "Kolkata", ["Instagram", "YouTube"], 67000, 6.8, "Everyday makeup tutorials."),
    ("Zoya Khan", "zoyabakes", "Food", "Lucknow", ["Instagram", "TikTok"], 119000, 5.5, "Baking, desserts and cafe reviews."),
]


def rows():
    out = []
    for i, (name, handle, niche, city, plats, fol, eng, bio) in enumerate(RAW):
        out.append(Creator(id=f"c{i + 1}", name=name, handle=handle, niche=niche, location=f"{city}, India", platforms=plats, followers=fol, engagement=eng, bio=bio, verified=i % 3 == 0, status="active", rateMin=0, rateMax=0, profileCompleted=True, metricsSelfReported=True))
        for j, t in enumerate(["Launch highlights", "Behind the scenes", "Audience favourite"]):
            out.append(Portfolio(id=f"p{i}-{j}", creatorId=f"c{i + 1}", title=f"{niche}: {t}", description=f"A {niche.lower()} piece made for an earlier brand partner.", category=niche, platform=plats[j % len(plats)], url="https://example.com/portfolio", views=(i + 3) * (j + 2) * 4100))
    out += [Brand(id=i, name=n, industry=x, status="active") for i, n, x in [("b1", "Nova Beauty", "Beauty"), ("b2", "Trailmark Outdoors", "Outdoor"), ("b3", "FreshBowl", "Food"), ("b4", "Pixel Forge", "Tech")]]
    out += [Campaign(id=i, brandId=b, name=n, description=ds, budget=bu, deadline=dl, status=st, deliverables=dv) for i, b, n, ds, bu, dl, st, dv in [
        ("k1", "b1", "Summer Glow", "Launch of our SPF 50 sunscreen range, built on authentic daily-use content.", 250000, "2026-12-15", "in_review", ["Instagram Reel", "Story Set", "Campaign Report"]),
        ("k2", "b1", "Winter Skin Reset", "Seasonal moisturiser campaign built around honest long-form reviews.", 150000, "2027-01-31", "draft", ["YouTube Review"]),
        ("k3", "b2", "Trail Season", "Showcase our new trekking range on real weekend trails.", 400000, "2026-12-01", "active", ["Vlog", "Gear Review"]),
        ("k4", "b3", "FreshBowl Launch", "Recipe content featuring the FreshBowl meal kit.", 180000, "2026-10-15", "completed", ["Recipe Reel"]),
        ("k5", "b4", "Pixel Forge Beta", "Hands-on review of the Pixel Forge creator laptop.", 300000, "2026-09-30", "completed", ["Review Video"])]]
    out += [Collab(id=i, campaignId=k, creatorId=c, status=st, invitedAt=at) for i, k, c, st, at in [
        ("l1", "k1", "c1", "pending", "2026-10-24T10:00:00Z"), ("l2", "k1", "c11", "active", "2026-10-10T09:00:00Z"),
        ("l3", "k3", "c1", "active", "2026-10-05T09:00:00Z"), ("l4", "k4", "c2", "completed", "2026-09-01T09:00:00Z"),
        ("l5", "k1", "c5", "rejected", "2026-10-12T09:00:00Z"), ("l6", "k5", "c4", "completed", "2026-08-20T09:00:00Z")]]
    out += [Deliverable(id=i, collabId=l, title=t, status=st, url=u, notes=n, feedback=f) for i, l, t, st, u, n, f in [
        ("d1", "l2", "Instagram Reel", "submitted", "https://example.com/reel-aditi", "First cut with captions.", None),
        ("d2", "l2", "Story Set", "pending", None, None, None), ("d3", "l2", "Campaign Report", "pending", None, None, None),
        ("d4", "l3", "Vlog", "revision_requested", "https://example.com/trail-vlog", None, "Show the product close-up within the first 10 seconds."),
        ("d5", "l3", "Gear Review", "pending", None, None, None),
        ("d6", "l4", "Recipe Reel", "approved", "https://example.com/recipe-reel", None, None),
        ("d7", "l6", "Review Video", "approved", "https://example.com/pixel-review", None, None)]]
    out += [Message(id=i, collabId=l, sender=s, text=t, at=at) for i, l, s, t, at in [
        ("m1", "l2", "brand", "Loved the first cut. Can we try a tighter intro?", "2026-10-25T09:30:00Z"),
        ("m2", "l2", "creator", "Sure, I will send a revised version tomorrow.", "2026-10-25T10:10:00Z"),
        ("m3", "l3", "brand", "Thanks for the vlog. Our notes are in the review.", "2026-10-26T12:00:00Z")]]
    out += [Notice(id=i, to=to, text=t, link=lk, read=False, at=at) for i, to, t, lk, at in [
        ("n1", "c1", "Nova Beauty invited you to Summer Glow", "/creator/collaborations/l1", "2026-10-24T10:00:00Z"),
        ("n2", "c1", "Trailmark Outdoors requested changes on “Vlog”", "/creator/collaborations/l3", "2026-10-26T12:00:00Z"),
        ("n3", "b1", "Aditi Sen submitted “Instagram Reel”", "/brand/campaigns/k1", "2026-10-25T09:00:00Z"),
        ("n4", "admin", "3 reports need review", "/admin/reports", "2026-10-26T08:00:00Z")]]
    out += [Report(id=i, target=t, reason=r, priority=p, status="open") for i, t, r, p in [
        ("r1", "Creator: Dev Malhotra", "Missing sponsorship disclosure", "high"), ("r2", "Campaign: Trail Season", "Repeated unsolicited invitations", "medium"),
        ("r3", "Brand: FreshBowl", "Slow replies to creators", "low")]]
    out.append(Saved(brandId="b1", creatorId="c11"))
    out += [User(id=i, email=e, passwordHash=hash_pw("demo1234"), role=r, profileId=p, emailVerified=True) for i, e, r, p in [
        ("u1", "demo-brand@collably.test", "brand", "b1"), ("u2", "demo-creator@collably.test", "creator", "c1"), ("u3", "demo-admin@collably.test", "admin", "admin")]]
    return out


def init():
    Base.metadata.create_all(engine)
    # Lightweight forward-compatible migration for databases created before profile fields existed.
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    cols = {c["name"] for c in inspector.get_columns("creators")}
    migrations = {
        "rateMin": "INTEGER DEFAULT 0",
        "rateMax": "INTEGER DEFAULT 0",
        "profileCompleted": "BOOLEAN DEFAULT 0",
        "metricsSelfReported": "BOOLEAN DEFAULT 1",
    }
    with engine.begin() as conn:
        for col, definition in migrations.items():
            if col not in cols:
                conn.execute(text(f"ALTER TABLE creators ADD COLUMN {col} {definition}"))
    user_cols = {c["name"] for c in inspect(engine).get_columns("users")}
    with engine.begin() as conn:
        if "emailVerified" not in user_cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN emailVerified BOOLEAN DEFAULT 0 NOT NULL"))
        conn.execute(text("UPDATE users SET emailVerified = 1 WHERE email LIKE 'demo-%@collably.test'"))
    with SessionLocal() as db:
        if db.query(User).count():
            return
        db.add_all(rows())
        db.commit()


def reset():
    Base.metadata.drop_all(engine)
    init()
