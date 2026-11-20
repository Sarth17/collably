"""Password hashing and login tokens."""
import hashlib
import os
import secrets
import time

import jwt

SECRET = os.getenv("COLLABLY_SECRET")
if os.getenv("VERCEL") == "1" and len(SECRET or "") < 32:
    raise RuntimeError("Set COLLABLY_SECRET to at least 32 characters on Vercel")
SECRET = SECRET or "local-development-secret-change-this-before-deployment-please-1234567890"


def hash_pw(pw: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(8)
    digest = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 200_000).hex()
    return f"{salt}${digest}"


def check_pw(pw: str, stored: str) -> bool:
    return secrets.compare_digest(hash_pw(pw, stored.split("$")[0]), stored)


def make_token(user_id: str) -> str:
    return jwt.encode({"sub": user_id, "exp": int(time.time()) + 7 * 86400}, SECRET, algorithm="HS256")


def decode_token(token: str) -> str | None:
    try:
        return jwt.decode(token, SECRET, algorithms=["HS256"])["sub"]
    except jwt.PyJWTError:
        return None
