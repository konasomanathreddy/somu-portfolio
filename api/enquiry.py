"""Vercel Python Serverless Function for handling portfolio enquiries (/api/enquiry)."""

from __future__ import annotations

import os
import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path

_PROJECT_ROOT = str(Path(__file__).resolve().parents[1])
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from api._lib.http_utils import (
    extract_client_ip,
    read_json_body,
    send_cors_preflight,
    send_json,
)
from api._lib.mailer import dispatch_enquiry_email, get_active_transport
from api._lib.storage import (
    count_enquiries,
    is_rate_limited,
    list_recent_enquiries,
    save_enquiry,
)
from api._lib.validators import hash_client_identifier, validate_enquiry_input


class handler(BaseHTTPRequestHandler):
    """HTTP handler compatible with Vercel Python Serverless Runtime and local runner."""

    def log_message(self, format: str, *args: object) -> None:  # noqa: A002
        return

    def do_OPTIONS(self) -> None:
        send_cors_preflight(self)

    def do_GET(self) -> None:
        """Return enquiry service summary, or recent enquiries when authorized."""
        admin_token = os.environ.get("ENQUIRY_ADMIN_TOKEN", "").strip()
        auth_header = self.headers.get("Authorization", "").strip()

        if admin_token and auth_header == f"Bearer {admin_token}":
            records = [rec.to_admin_dict() for rec in list_recent_enquiries(limit=25)]
            send_json(
                self,
                200,
                {
                    "ok": True,
                    "totalEnquiries": count_enquiries(),
                    "transport": get_active_transport(),
                    "enquiries": records,
                },
            )
            return

        send_json(
            self,
            200,
            {
                "ok": True,
                "endpoint": "/api/enquiry",
                "transport": get_active_transport(),
                "totalRecorded": count_enquiries(),
            },
        )

    def do_POST(self) -> None:
        """Validate, rate-limit, email, and persist an incoming visitor enquiry."""
        raw_body, parse_error = read_json_body(self)
        if parse_error or raw_body is None:
            send_json(
                self,
                400,
                {
                    "ok": False,
                    "error": parse_error or "Invalid request payload.",
                },
            )
            return

        validation = validate_enquiry_input(raw_body)
        if not validation.is_valid or validation.payload is None:
            send_json(
                self,
                400,
                {
                    "ok": False,
                    "error": "Please review the highlighted enquiry fields.",
                    "fieldErrors": validation.error_map(),
                },
            )
            return

        client_ip = extract_client_ip(self)
        user_agent = self.headers.get("User-Agent", "")
        ip_hash = hash_client_identifier(client_ip, user_agent)

        if is_rate_limited(ip_hash):
            send_json(
                self,
                429,
                {
                    "ok": False,
                    "error": "Too many enquiries sent in a short period. Please wait a few minutes and try again.",
                },
            )
            return

        delivery = dispatch_enquiry_email(validation.payload)
        delivery_status = "emailed" if delivery.sent else "recorded"

        record = save_enquiry(
            payload=validation.payload,
            delivery_status=delivery_status,
            delivery_channel=delivery.channel,
            ip_hash=ip_hash,
        )

        send_json(
            self,
            201,
            {
                "ok": True,
                "message": (
                    "Thank you! Your enquiry has been emailed to K. Somanath Reddy."
                    if delivery.sent
                    else "Thank you! Your enquiry has been received and recorded by the backend."
                ),
                "enquiry": record.to_public_dict(),
                "emailSent": delivery.sent,
                "deliveryDetail": delivery.detail,
                "recipient": delivery.recipient,
            },
        )
