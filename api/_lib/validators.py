"""Validation, normalization, and sanitization helpers for contact enquiries."""

from __future__ import annotations

import hashlib
import html
import re
from typing import Any

from api._lib.models import (
    EnquiryPayload,
    ValidationErrorDetail,
    ValidationResult,
)

EMAIL_REGEX = re.compile(
    r"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$"
)
CONTROL_CHARS_REGEX = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
HTML_TAG_REGEX = re.compile(r"<[^>]+>")
URL_PATTERN = re.compile(r"https?://", re.IGNORECASE)

MIN_NAME_LENGTH = 2
MAX_NAME_LENGTH = 100
MAX_EMAIL_LENGTH = 254
MAX_SUBJECT_LENGTH = 160
MIN_MESSAGE_LENGTH = 15
MAX_MESSAGE_LENGTH = 4000
MAX_URLS_IN_MESSAGE = 4


def sanitize_single_line(value: Any) -> str:
    """Strip control characters, line breaks, and collapse whitespace for header-safe text."""
    if not isinstance(value, str):
        return ""
    cleaned = CONTROL_CHARS_REGEX.sub("", value)
    cleaned = cleaned.replace("\r", " ").replace("\n", " ")
    cleaned = HTML_TAG_REGEX.sub("", cleaned)
    return " ".join(cleaned.split()).strip()


def sanitize_message_body(value: Any) -> str:
    """Clean control chars and unsafe tags while preserving intentional paragraph breaks."""
    if not isinstance(value, str):
        return ""
    cleaned = CONTROL_CHARS_REGEX.sub("", value)
    cleaned = cleaned.replace("\r\n", "\n").replace("\r", "\n")
    cleaned = HTML_TAG_REGEX.sub("", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def escape_html_text(text: str) -> str:
    """Escape text for safe inclusion inside HTML email templates."""
    return html.escape(text, quote=True)


def hash_client_identifier(raw_ip: str, user_agent: str = "") -> str:
    """Compute a privacy-preserving SHA-256 fingerprint for rate limiting."""
    digest = hashlib.sha256(f"{raw_ip}|{user_agent[:120]}".encode("utf-8"))
    return digest.hexdigest()[:32]


def validate_enquiry_input(raw_data: dict[str, Any]) -> ValidationResult:
    """Validate incoming enquiry JSON fields and return normalized EnquiryPayload."""
    errors: list[ValidationErrorDetail] = []

    raw_name = sanitize_single_line(raw_data.get("name", ""))
    raw_email = sanitize_single_line(raw_data.get("email", "")).lower()
    raw_subject = sanitize_single_line(raw_data.get("subject", ""))
    raw_message = sanitize_message_body(raw_data.get("message", ""))

    honeypot = sanitize_single_line(raw_data.get("website", ""))
    if honeypot:
        errors.append(
            ValidationErrorDetail(
                field="form",
                message="Submission rejected by automated spam protection.",
            )
        )

    if len(raw_name) < MIN_NAME_LENGTH:
        errors.append(
            ValidationErrorDetail(
                field="name",
                message=f"Please enter your full name (at least {MIN_NAME_LENGTH} characters).",
            )
        )
    elif len(raw_name) > MAX_NAME_LENGTH:
        errors.append(
            ValidationErrorDetail(
                field="name",
                message=f"Name must be {MAX_NAME_LENGTH} characters or fewer.",
            )
        )

    if not raw_email:
        errors.append(
            ValidationErrorDetail(
                field="email",
                message="Please provide your email address so I can reply.",
            )
        )
    elif len(raw_email) > MAX_EMAIL_LENGTH or not EMAIL_REGEX.match(raw_email):
        errors.append(
            ValidationErrorDetail(
                field="email",
                message="Please enter a valid email address (for example, name@domain.com).",
            )
        )
    elif ".." in raw_email.split("@", 1)[-1]:
        errors.append(
            ValidationErrorDetail(
                field="email",
                message="Email domain appears malformed.",
            )
        )

    if len(raw_subject) > MAX_SUBJECT_LENGTH:
        errors.append(
            ValidationErrorDetail(
                field="subject",
                message=f"Subject must be {MAX_SUBJECT_LENGTH} characters or fewer.",
            )
        )

    if len(raw_message) < MIN_MESSAGE_LENGTH:
        errors.append(
            ValidationErrorDetail(
                field="message",
                message=(
                    f"Please share a few more details in your message "
                    f"(at least {MIN_MESSAGE_LENGTH} characters)."
                ),
            )
        )
    elif len(raw_message) > MAX_MESSAGE_LENGTH:
        errors.append(
            ValidationErrorDetail(
                field="message",
                message=f"Message must not exceed {MAX_MESSAGE_LENGTH} characters.",
            )
        )
    elif len(URL_PATTERN.findall(raw_message)) > MAX_URLS_IN_MESSAGE:
        errors.append(
            ValidationErrorDetail(
                field="message",
                message="Message contains too many links. Please keep it concise.",
            )
        )

    if errors:
        return ValidationResult(is_valid=False, payload=None, errors=errors)

    resolved_subject = raw_subject or f"Portfolio Enquiry from {raw_name}"
    payload = EnquiryPayload(
        name=raw_name,
        email=raw_email,
        subject=resolved_subject,
        message=raw_message,
    )
    return ValidationResult(is_valid=True, payload=payload, errors=[])
