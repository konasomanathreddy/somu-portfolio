"""Local Python HTTP router that mounts Vercel BaseHTTPRequestHandler endpoints."""

from __future__ import annotations

import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

_PROJECT_ROOT = str(Path(__file__).resolve().parents[2])
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from api._lib.http_utils import send_cors_preflight, send_json
from api.enquiry import handler as EnquiryHandler
from api.health import handler as HealthHandler
from api.portfolio import handler as PortfolioHandler

ROUTES: dict[str, type[BaseHTTPRequestHandler]] = {
    "/api/enquiry": EnquiryHandler,
    "/api/portfolio": PortfolioHandler,
    "/api/health": HealthHandler,
}


class LocalRouterHandler(BaseHTTPRequestHandler):
    """Dispatches local /api/* HTTP requests to the exact Vercel handler classes."""

    def log_message(self, format: str, *args: object) -> None:  # noqa: A002
        sys.stderr.write(f"[python-api] {self.address_string()} - {format % args}\n")

    def _delegate(self, method_name: str) -> None:
        parsed_path = urlparse(self.path).path.rstrip("/") or "/"
        target_cls = ROUTES.get(parsed_path)
        if target_cls is None:
            send_json(self, 404, {"ok": False, "error": f"Unknown API route: {parsed_path}"})
            return

        method = getattr(target_cls, method_name, None)
        if method is None:
            send_json(self, 405, {"ok": False, "error": "Method not allowed"})
            return

        method(self)

    def do_OPTIONS(self) -> None:
        parsed_path = urlparse(self.path).path.rstrip("/") or "/"
        if parsed_path in ROUTES:
            send_cors_preflight(self)
        else:
            send_json(self, 404, {"ok": False, "error": "Not found"})

    def do_GET(self) -> None:
        self._delegate("do_GET")

    def do_POST(self) -> None:
        self._delegate("do_POST")


def main() -> None:
    host = os.environ.get("PYTHON_API_HOST", "127.0.0.1")
    port = int(os.environ.get("PYTHON_API_PORT", "8765"))
    server = ThreadingHTTPServer((host, port), LocalRouterHandler)
    sys.stderr.write(f"[python-api] Listening on http://{host}:{port}\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
