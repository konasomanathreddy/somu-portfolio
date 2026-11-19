"""Shared HTTP request/response utilities for Vercel BaseHTTPRequestHandler endpoints."""

from __future__ import annotations

import json
import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from typing import Any

MAX_JSON_BODY_BYTES = 32 * 1024  # 32 KB


def ensure_project_root_on_path() -> None:
    """Guarantee the repository root is importable across local and Vercel environments."""
    root = str(Path(__file__).resolve().parents[2])
    if root not in sys.path:
        sys.path.insert(0, root)


def send_json(
    handler: BaseHTTPRequestHandler,
    status_code: int,
    payload: dict[str, Any],
) -> None:
    """Serialize a dictionary as UTF-8 JSON and write standard headers."""
    encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status_code)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(encoded)))
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
    handler.end_headers()
    handler.wfile.write(encoded)


def send_cors_preflight(handler: BaseHTTPRequestHandler) -> None:
    """Respond to CORS OPTIONS preflight requests."""
    handler.send_response(204)
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
    handler.send_header("Content-Length", "0")
    handler.end_headers()


def read_json_body(handler: BaseHTTPRequestHandler) -> tuple[dict[str, Any] | None, str | None]:
    """Read and decode a JSON request body with size safety."""
    content_length_raw = handler.headers.get("Content-Length", "0").strip()
    try:
        content_length = int(content_length_raw)
    except ValueError:
        return None, "Invalid Content-Length header."

    if content_length <= 0:
        return None, "Request body cannot be empty."
    if content_length > MAX_JSON_BODY_BYTES:
        return None, "Request payload exceeds the 32 KB limit."

    raw_bytes = handler.rfile.read(content_length)
    try:
        parsed = json.loads(raw_bytes.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return None, "Malformed JSON payload."

    if not isinstance(parsed, dict):
        return None, "JSON payload must be an object."

    return parsed, None


def extract_client_ip(handler: BaseHTTPRequestHandler) -> str:
    """Extract client IP respecting Vercel's x-forwarded-for header."""
    forwarded = handler.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = handler.headers.get("x-real-ip", "").strip()
    if real_ip:
        return real_ip
    if handler.client_address:
        return str(handler.client_address[0])
    return "unknown"
