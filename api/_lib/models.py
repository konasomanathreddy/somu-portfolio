"""Typed data models for the portfolio API and enquiry pipeline."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass(frozen=True)
class EnquiryPayload:
    """Normalized and validated contact enquiry submitted by a visitor."""

    name: str
    email: str
    subject: str
    message: str


@dataclass(frozen=True)
class ValidationErrorDetail:
    """Field-level validation error reported to the client."""

    field: str
    message: str

    def to_dict(self) -> dict[str, str]:
        return {"field": self.field, "message": self.message}


@dataclass(frozen=True)
class ValidationResult:
    """Outcome of validating and sanitizing an enquiry payload."""

    is_valid: bool
    payload: EnquiryPayload | None = None
    errors: list[ValidationErrorDetail] = field(default_factory=list)

    def error_map(self) -> dict[str, str]:
        return {err.field: err.message for err in self.errors}


@dataclass(frozen=True)
class DeliveryResult:
    """Result returned by the email dispatcher."""

    sent: bool
    channel: str  # "smtp", "resend", or "stored_only"
    detail: str
    recipient: str


@dataclass(frozen=True)
class EnquiryRecord:
    """Persisted enquiry record stored in SQLite."""

    id: int
    reference_code: str
    name: str
    email: str
    subject: str
    message: str
    delivery_status: str
    delivery_channel: str
    created_at: str
    ip_hash: str

    def to_public_dict(self) -> dict[str, Any]:
        return {
            "referenceCode": self.reference_code,
            "name": self.name,
            "email": self.email,
            "subject": self.subject,
            "deliveryStatus": self.delivery_status,
            "deliveryChannel": self.delivery_channel,
            "createdAt": self.created_at,
        }

    def to_admin_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data.pop("ip_hash", None)
        return data
