"""SQLite storage layer with automatic serverless /tmp fallback for enquiries."""

from __future__ import annotations

import os
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

from api._lib.models import EnquiryPayload, EnquiryRecord

RATE_LIMIT_WINDOW_MINUTES = 10
RATE_LIMIT_MAX_REQUESTS = 5


def resolve_database_path() -> Path:
    """Resolve a writable SQLite file path for both local dev and Vercel serverless."""
    configured = os.environ.get("ENQUIRY_DB_PATH", "").strip()
    if configured:
        path = Path(configured)
        path.parent.mkdir(parents=True, exist_ok=True)
        return path

    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        return Path("/tmp/somanath_enquiries.db")

    local_dir = Path(__file__).resolve().parents[2] / "data"
    try:
        local_dir.mkdir(parents=True, exist_ok=True)
        return local_dir / "enquiries.db"
    except OSError:
        return Path("/tmp/somanath_enquiries.db")


def get_connection() -> sqlite3.Connection:
    """Open a SQLite connection and guarantee the enquiries table exists."""
    db_path = resolve_database_path()
    conn = sqlite3.connect(str(db_path), timeout=10.0)
    conn.row_factory = sqlite3.Row
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS enquiries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reference_code TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            delivery_status TEXT NOT NULL,
            delivery_channel TEXT NOT NULL,
            created_at TEXT NOT NULL,
            ip_hash TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_enquiries_ip_created
        ON enquiries (ip_hash, created_at)
        """
    )
    conn.commit()
    return conn


def generate_reference_code() -> str:
    """Generate a compact human-readable enquiry reference identifier."""
    stamp = datetime.now(timezone.utc).strftime("%y%m%d")
    token = secrets.token_hex(3).upper()
    return f"ENQ-{stamp}-{token}"


def is_rate_limited(ip_hash: str) -> bool:
    """Return True if this client fingerprint exceeded the recent enquiry threshold."""
    cutoff = (
        datetime.now(timezone.utc) - timedelta(minutes=RATE_LIMIT_WINDOW_MINUTES)
    ).isoformat()
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT COUNT(*) AS recent_count
            FROM enquiries
            WHERE ip_hash = ? AND created_at >= ?
            """,
            (ip_hash, cutoff),
        ).fetchone()
        return bool(row and int(row["recent_count"]) >= RATE_LIMIT_MAX_REQUESTS)


def save_enquiry(
    payload: EnquiryPayload,
    delivery_status: str,
    delivery_channel: str,
    ip_hash: str,
) -> EnquiryRecord:
    """Persist a validated enquiry and return the stored EnquiryRecord."""
    reference_code = generate_reference_code()
    created_at = datetime.now(timezone.utc).isoformat()

    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO enquiries (
                reference_code,
                name,
                email,
                subject,
                message,
                delivery_status,
                delivery_channel,
                created_at,
                ip_hash
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                reference_code,
                payload.name,
                payload.email,
                payload.subject,
                payload.message,
                delivery_status,
                delivery_channel,
                created_at,
                ip_hash,
            ),
        )
        conn.commit()
        record_id = int(cursor.lastrowid or 0)

    return EnquiryRecord(
        id=record_id,
        reference_code=reference_code,
        name=payload.name,
        email=payload.email,
        subject=payload.subject,
        message=payload.message,
        delivery_status=delivery_status,
        delivery_channel=delivery_channel,
        created_at=created_at,
        ip_hash=ip_hash,
    )


def count_enquiries() -> int:
    """Return total stored enquiries count."""
    with get_connection() as conn:
        row = conn.execute("SELECT COUNT(*) AS total FROM enquiries").fetchone()
        return int(row["total"]) if row else 0


def list_recent_enquiries(limit: int = 25) -> list[EnquiryRecord]:
    """Fetch recent enquiries for authenticated admin inspection."""
    safe_limit = max(1, min(limit, 100))
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT
                id,
                reference_code,
                name,
                email,
                subject,
                message,
                delivery_status,
                delivery_channel,
                created_at,
                ip_hash
            FROM enquiries
            ORDER BY id DESC
            LIMIT ?
            """,
            (safe_limit,),
        ).fetchall()

    return [
        EnquiryRecord(
            id=int(r["id"]),
            reference_code=str(r["reference_code"]),
            name=str(r["name"]),
            email=str(r["email"]),
            subject=str(r["subject"]),
            message=str(r["message"]),
            delivery_status=str(r["delivery_status"]),
            delivery_channel=str(r["delivery_channel"]),
            created_at=str(r["created_at"]),
            ip_hash=str(r["ip_hash"]),
        )
        for r in rows
    ]
