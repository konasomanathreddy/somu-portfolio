"""Outbound email dispatcher supporting Resend API and standard SMTP."""

from __future__ import annotations

import json
import os
import smtplib
import ssl
import urllib.error
import urllib.request
from email.message import EmailMessage

from api._lib.models import DeliveryResult, EnquiryPayload
from api._lib.validators import escape_html_text

DEFAULT_RECEIVER_EMAIL = "konasomanathreddy@gmail.com"


def get_receiver_email() -> str:
    return (
        os.environ.get("CONTACT_RECEIVER_EMAIL", "").strip()
        or DEFAULT_RECEIVER_EMAIL
    )


def get_active_transport() -> str:
    """Detect which email delivery transport is configured in environment variables."""
    if os.environ.get("RESEND_API_KEY", "").strip():
        return "resend"
    if (
        os.environ.get("SMTP_HOST", "").strip()
        and os.environ.get("SMTP_USER", "").strip()
        and os.environ.get("SMTP_PASS", "").strip()
    ):
        return "smtp"
    return "storage_only"


def _build_email_bodies(payload: EnquiryPayload) -> tuple[str, str]:
    text_body = (
        f"New Portfolio Enquiry\n"
        f"{'=' * 40}\n"
        f"From:    {payload.name} <{payload.email}>\n"
        f"Subject: {payload.subject}\n\n"
        f"Message:\n"
        f"{payload.message}\n\n"
        f"--\n"
        f"Reply directly to this email to respond to {payload.name}.\n"
    )

    safe_name = escape_html_text(payload.name)
    safe_email = escape_html_text(payload.email)
    safe_subject = escape_html_text(payload.subject)
    safe_message = escape_html_text(payload.message).replace("\n", "<br />")

    html_body = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #111827; line-height: 1.6;">
      <h2 style="margin: 0 0 12px; font-size: 20px; color: #0f172a;">New Portfolio Enquiry</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; width: 90px;"><strong>Sender</strong></td>
          <td style="padding: 8px 0;">{safe_name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;"><strong>Email</strong></td>
          <td style="padding: 8px 0;"><a href="mailto:{safe_email}" style="color: #2563eb;">{safe_email}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;"><strong>Subject</strong></td>
          <td style="padding: 8px 0;">{safe_subject}</td>
        </tr>
      </table>
      <div style="padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 15px;">
        {safe_message}
      </div>
    </div>
    """.strip()

    return text_body, html_body


def _send_via_resend(payload: EnquiryPayload, recipient: str) -> DeliveryResult:
    api_key = os.environ.get("RESEND_API_KEY", "").strip()
    from_email = (
        os.environ.get("RESEND_FROM_EMAIL", "").strip()
        or "Portfolio Enquiry <onboarding@resend.dev>"
    )
    text_body, html_body = _build_email_bodies(payload)

    body = json.dumps(
        {
            "from": from_email,
            "to": [recipient],
            "reply_to": payload.email,
            "subject": f"[Portfolio] {payload.subject}",
            "text": text_body,
            "html": html_body,
        }
    ).encode("utf-8")

    request = urllib.request.Request(
        url="https://api.resend.com/emails",
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "SomanathPortfolioPythonBackend/1.0",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=10) as resp:
            if 200 <= resp.status < 300:
                return DeliveryResult(
                    sent=True,
                    channel="resend",
                    detail="Enquiry emailed directly via Resend.",
                    recipient=recipient,
                )
    except urllib.error.HTTPError as exc:
        err_text = exc.read().decode("utf-8", errors="ignore")[:200]
        return DeliveryResult(
            sent=False,
            channel="stored_only",
            detail=f"Resend delivery error ({exc.code}): {err_text}",
            recipient=recipient,
        )
    except Exception as exc:  # noqa: BLE001
        return DeliveryResult(
            sent=False,
            channel="stored_only",
            detail=f"Resend request failed: {exc}",
            recipient=recipient,
        )

    return DeliveryResult(
        sent=False,
        channel="stored_only",
        detail="Resend returned an unexpected status.",
        recipient=recipient,
    )


def _send_via_smtp(payload: EnquiryPayload, recipient: str) -> DeliveryResult:
    host = os.environ.get("SMTP_HOST", "").strip()
    port_raw = os.environ.get("SMTP_PORT", "465").strip()
    user = os.environ.get("SMTP_USER", "").strip()
    password = os.environ.get("SMTP_PASS", "").strip()

    try:
        port = int(port_raw)
    except ValueError:
        port = 465

    text_body, html_body = _build_email_bodies(payload)

    msg = EmailMessage()
    msg["Subject"] = f"[Portfolio] {payload.subject}"
    msg["From"] = user
    msg["To"] = recipient
    msg["Reply-To"] = f"{payload.name} <{payload.email}>"
    msg.set_content(text_body)
    msg.add_alternative(html_body, subtype="html")

    context = ssl.create_default_context()

    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=10, context=context) as server:
                server.login(user, password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(host, port, timeout=10) as server:
                server.starttls(context=context)
                server.login(user, password)
                server.send_message(msg)

        return DeliveryResult(
            sent=True,
            channel="smtp",
            detail="Enquiry delivered directly via SMTP.",
            recipient=recipient,
        )
    except Exception as exc:  # noqa: BLE001
        return DeliveryResult(
            sent=False,
            channel="stored_only",
            detail=f"SMTP delivery failed ({exc}); enquiry safely recorded.",
            recipient=recipient,
        )


def dispatch_enquiry_email(payload: EnquiryPayload) -> DeliveryResult:
    """Attempt to email the enquiry using Resend or SMTP, falling back cleanly."""
    recipient = get_receiver_email()
    transport = get_active_transport()

    if transport == "resend":
        return _send_via_resend(payload, recipient)
    if transport == "smtp":
        return _send_via_smtp(payload, recipient)

    return DeliveryResult(
        sent=False,
        channel="stored_only",
        detail=(
            "Enquiry validated and saved by the Python backend. "
            "Configure SMTP_* or RESEND_API_KEY in Vercel to enable automatic inbox forwarding."
        ),
        recipient=recipient,
    )
