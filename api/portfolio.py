"""Vercel Python Serverless Function serving portfolio profile and project metadata."""

from __future__ import annotations

import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path

_PROJECT_ROOT = str(Path(__file__).resolve().parents[1])
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from api._lib.http_utils import send_cors_preflight, send_json
from api._lib.portfolio_data import get_portfolio_payload


class handler(BaseHTTPRequestHandler):
    """HTTP handler serving K. Somanath Reddy's portfolio data."""

    def log_message(self, format: str, *args: object) -> None:  # noqa: A002
        return

    def do_OPTIONS(self) -> None:
        send_cors_preflight(self)

    def do_GET(self) -> None:
        send_json(
            self,
            200,
            {
                "ok": True,
                "portfolio": get_portfolio_payload(),
            },
        )
