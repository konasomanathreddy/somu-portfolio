"""Unit and integration tests for the portfolio Python backend."""

from __future__ import annotations

import json
import os
import sys
import tempfile
import threading
import unittest
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path

_PROJECT_ROOT = str(Path(__file__).resolve().parents[1])
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from api._lib.local_server import LocalRouterHandler
from api._lib.storage import count_enquiries, save_enquiry
from api._lib.validators import validate_enquiry_input


class PortfolioBackendTestCase(unittest.TestCase):
    """Verify input validation, SQLite storage, and HTTP API endpoints."""

    def setUp(self) -> None:
        self._tmp_dir = tempfile.TemporaryDirectory()
        self._db_path = Path(self._tmp_dir.name) / "test_enquiries.db"
        os.environ["ENQUIRY_DB_PATH"] = str(self._db_path)

        self._server = ThreadingHTTPServer(("127.0.0.1", 0), LocalRouterHandler)
        self._port = self._server.server_address[1]
        self._thread = threading.Thread(target=self._server.serve_forever, daemon=True)
        self._thread.start()

    def tearDown(self) -> None:
        self._server.shutdown()
        self._server.server_close()
        os.environ.pop("ENQUIRY_DB_PATH", None)
        self._tmp_dir.cleanup()

    def test_valid_enquiry_validation_sanitizes_html_and_headers(self) -> None:
        result = validate_enquiry_input(
            {
                "name": "  <b>Aarav</b>\r\nSharma ",
                "email": "Aarav.Sharma@Example.com",
                "subject": "Internship\nOpportunity",
                "message": "Hello Somanath, <script>alert(1)</script> I would love to collaborate on a Python project.",
            }
        )
        self.assertTrue(result.is_valid)
        self.assertIsNotNone(result.payload)
        assert result.payload is not None
        self.assertEqual(result.payload.name, "Aarav Sharma")
        self.assertEqual(result.payload.email, "aarav.sharma@example.com")
        self.assertEqual(result.payload.subject, "Internship Opportunity")
        self.assertNotIn("<script>", result.payload.message)

    def test_invalid_enquiry_returns_field_errors(self) -> None:
        result = validate_enquiry_input(
            {
                "name": "A",
                "email": "not-an-email",
                "message": "Short",
            }
        )
        self.assertFalse(result.is_valid)
        error_map = result.error_map()
        self.assertIn("name", error_map)
        self.assertIn("email", error_map)
        self.assertIn("message", error_map)

    def test_storage_persists_enquiry(self) -> None:
        result = validate_enquiry_input(
            {
                "name": "Meera Nair",
                "email": "meera@example.com",
                "subject": "Project Feedback",
                "message": "Really liked your portfolio structure and Python backend setup.",
            }
        )
        assert result.payload is not None
        record = save_enquiry(result.payload, "recorded", "stored_only", "testhash123")
        self.assertTrue(record.reference_code.startswith("ENQ-"))
        self.assertEqual(count_enquiries(), 1)

    def test_http_portfolio_and_enquiry_endpoints(self) -> None:
        with urllib.request.urlopen(
            f"http://127.0.0.1:{self._port}/api/portfolio", timeout=5
        ) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))
            self.assertTrue(data["ok"])
            self.assertEqual(data["portfolio"]["profile"]["fullName"], "K. Somanath Reddy")

        req_body = json.dumps(
            {
                "name": "Rohan Verma",
                "email": "rohan@example.org",
                "subject": "Backend Collaboration",
                "message": "Hi Somanath, reaching out regarding a Python and SQL student project.",
            }
        ).encode("utf-8")
        req = urllib.request.Request(
            f"http://127.0.0.1:{self._port}/api/enquiry",
            data=req_body,
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            self.assertEqual(resp.status, 201)
            created = json.loads(resp.read().decode("utf-8"))
            self.assertTrue(created["ok"])
            self.assertEqual(created["enquiry"]["email"], "rohan@example.org")
            self.assertTrue(created["enquiry"]["referenceCode"].startswith("ENQ-"))


if __name__ == "__main__":
    unittest.main()
