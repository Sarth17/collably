"""Transactional email via Resend."""
import os
import logging
import httpx

log = logging.getLogger("collably.email")


def send_email(to: str, subject: str, html: str) -> bool:
    api_key = os.getenv("RESEND_API_KEY")
    from_email = os.getenv(
        "EMAIL_FROM",
        "Collably <onboarding@resend.dev>"
    )

    if not api_key:
        log.warning("RESEND_API_KEY is not configured.")
        return False

    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": from_email,
                "to": [to],
                "subject": subject,
                "html": html,
            },
            timeout=15,
        )

        response.raise_for_status()
        log.info("Email sent successfully to %s", to)
        return True

    except httpx.HTTPStatusError as e:
        log.error(
            "Resend rejected email. Status: %s | Response: %s",
            e.response.status_code,
            e.response.text,
        )
        return False

    except Exception:
        log.exception("Failed to send email to %s", to)
        return False