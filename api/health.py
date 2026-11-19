"""Vercel Python Serverless Function for backend health and transport diagnostics."""

from __future__ import annotations

import platform
import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path

_PROJECT_ROOT = str(Path(__file__).resolve().parents[1])
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from api._lib.http_utils import send_cors_preflight, send_json
from api._lib.mailer import get_active_transport, get_receiver_email
from api._lib.storage import count_enquiries, resolve_database_path


class handler(BaseHTTPRequestHandler):
    """HTTP handler reporting Python runtime and enquiry service status."""

    def log_message(self, format: str, *args: object) -> None:  # noqa: A002
        return

    def do_OPTIONS(self) -> None:
        send_cors_preflight(self)

    def do_GET(self) -> None:
        storage_ready = True
        recorded_count = 0
        try:
            recorded_count = count_enquiries()
        except Exception:  # noqa: BLE001
            storage_ready = False

        send_json(
            self,
            200,
            {
                "ok": True,
                "runtime": f"Python {platform.python_version()}",
                "storageReady": storage_ready,
                "storageEngine": "sqlite3",
                "databaseLocation": str(resolve_database_path().name),
                "emailTransport": get_active_transport(),
                "receiverEmail": get_receiver_email(),
                "totalEnquiries": recorded_count,
            },
        )
