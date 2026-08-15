"""KDNA asset signatures — RFC-0021 M1 (``kdsig.ed25519``).

A ``.kdna`` container carries an optional top-level ``signature.kdsig`` entry:
a JSON signature bundle whose Ed25519 signature covers a deterministic
signing payload derived from the asset's canonical content digest
(``docs/CANONICALIZATION.md``). Verification is offline and fail-closed: any
malformed, unsupported, or unverifiable bundle rejects the asset.

A signature proves integrity and provenance only. It never proves
expertise, truthfulness, safety, or fitness for purpose.

This module is the independent Python verifier/signer counterpart of
``packages/kdna-core/src/signature.js``; both consume the same
known-answer vectors under ``conformance/signature/``.
"""

from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, Optional

from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)
from cryptography.exceptions import InvalidSignature

KDSIG_PROFILE = "kdsig.ed25519"
KDSIG_PROFILE_VERSION = "0.1.0"
KDSIG_ALGORITHM = "ed25519"
SIGNATURE_ENTRY_NAME = "signature.kdsig"

_RAW_PUBLIC_KEY_HEX_LENGTH = 64
_RAW_SIGNATURE_HEX_LENGTH = 128
_SHA256_HEX_LENGTH = 64

_BUNDLE_FIELDS = (
    "algorithm",
    "content_digest",
    "profile",
    "profile_version",
    "public_key",
    "signature",
)


class KDNASignatureError(ValueError):
    """Fail-closed signature error carrying a stable KDNA error code."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


def _is_lowercase_hex(value: Any, length: int) -> bool:
    return (
        isinstance(value, str)
        and len(value) == length
        and all(ch in "0123456789abcdef" for ch in value)
    )


def _assert_content_digest_shape(value: Any) -> None:
    if not (
        isinstance(value, str)
        and value.startswith("sha256:")
        and _is_lowercase_hex(value[len("sha256:"):], _SHA256_HEX_LENGTH)
    ):
        raise KDNASignatureError(
            "KDNA_INTEGRITY_SIGNATURE_FAILED",
            'signature bundle content_digest must be "sha256:<64 lowercase hex>", '
            f"got {value!r}",
        )


def build_signing_payload(content_digest: str) -> bytes:
    """Build the exact bytes that Ed25519 signs.

    The payload is domain-separated by the profile coordinate and binds the
    asset's canonical content digest, so a signature can never be replayed
    across profiles, versions, or assets.
    """
    _assert_content_digest_shape(content_digest)
    return f"{KDSIG_PROFILE}:{KDSIG_PROFILE_VERSION}:{content_digest}".encode("utf-8")


def key_fingerprint(public_key_hex: str) -> str:
    """Fingerprint of a raw Ed25519 public key: sha256 over the 32 key bytes."""
    if not _is_lowercase_hex(public_key_hex, _RAW_PUBLIC_KEY_HEX_LENGTH):
        raise KDNASignatureError(
            "KDNA_SIGNATURE_KEY_INVALID",
            "key_fingerprint expects a 32-byte Ed25519 public key encoded as "
            "64 lowercase hex characters",
        )
    return f"sha256:{hashlib.sha256(bytes.fromhex(public_key_hex)).hexdigest()}"


def generate_signing_key_pair() -> Dict[str, str]:
    """Generate a new Ed25519 signing key pair.

    The private key is returned as the raw 32-byte seed in lowercase hex;
    custody is the signer's responsibility.
    """
    private_key = Ed25519PrivateKey.generate()
    public_key = private_key.public_key()
    return {
        "algorithm": KDSIG_ALGORITHM,
        "private_key": private_key.private_bytes_raw().hex(),
        "public_key": public_key.public_bytes_raw().hex(),
    }


def _stable_serialize(bundle: Dict[str, Any]) -> bytes:
    """Canonical wire bytes: sorted keys, no insignificant whitespace.

    Matches the JS ``stableStringify`` byte-for-byte for bundle content.
    """
    return (
        json.dumps(bundle, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
        + "\n"
    ).encode("utf-8")


def serialize_signature_bundle(bundle: Dict[str, Any]) -> bytes:
    return _stable_serialize(bundle)


def parse_signature_bundle(data: bytes) -> Dict[str, str]:
    """Parse and strictly validate a signature bundle. Fail-closed."""
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError as error:
        raise KDNASignatureError(
            "KDNA_INTEGRITY_SIGNATURE_FAILED",
            f"signature bundle is not UTF-8: {error}",
        ) from error
    try:
        bundle = json.loads(text)
    except json.JSONDecodeError as error:
        raise KDNASignatureError(
            "KDNA_INTEGRITY_SIGNATURE_FAILED",
            f"signature.kdsig is not valid JSON: {error}",
        ) from error
    if not isinstance(bundle, dict):
        raise KDNASignatureError(
            "KDNA_INTEGRITY_SIGNATURE_FAILED",
            "signature bundle must be a JSON object",
        )
    for field in _BUNDLE_FIELDS:
        if not isinstance(bundle.get(field), str):
            raise KDNASignatureError(
                "KDNA_INTEGRITY_SIGNATURE_FAILED",
                f"signature bundle is missing required string field: {field}",
            )
    extra = sorted(key for key in bundle if key not in _BUNDLE_FIELDS)
    if extra:
        raise KDNASignatureError(
            "KDNA_INTEGRITY_SIGNATURE_FAILED",
            f"signature bundle carries unsupported fields: {', '.join(extra)}",
        )
    if bundle["profile"] != KDSIG_PROFILE:
        raise KDNASignatureError(
            "KDNA_SIGNATURE_PROFILE_UNSUPPORTED",
            f"signature bundle profile {bundle['profile']!r} is not supported "
            f"(supported: {KDSIG_PROFILE})",
        )
    if bundle["profile_version"] != KDSIG_PROFILE_VERSION:
        raise KDNASignatureError(
            "KDNA_SIGNATURE_VERSION_UNSUPPORTED",
            f"signature bundle profile_version {bundle['profile_version']!r} is "
            f"not supported (supported: {KDSIG_PROFILE_VERSION})",
        )
    if bundle["algorithm"] != KDSIG_ALGORITHM:
        raise KDNASignatureError(
            "KDNA_SIGNATURE_PROFILE_UNSUPPORTED",
            f"signature bundle algorithm {bundle['algorithm']!r} is not supported "
            f"(supported: {KDSIG_ALGORITHM})",
        )
    _assert_content_digest_shape(bundle["content_digest"])
    if not _is_lowercase_hex(bundle["public_key"], _RAW_PUBLIC_KEY_HEX_LENGTH):
        raise KDNASignatureError(
            "KDNA_INTEGRITY_SIGNATURE_FAILED",
            "signature bundle public_key must be 64 lowercase hex characters",
        )
    if not _is_lowercase_hex(bundle["signature"], _RAW_SIGNATURE_HEX_LENGTH):
        raise KDNASignatureError(
            "KDNA_INTEGRITY_SIGNATURE_FAILED",
            "signature bundle signature must be 128 lowercase hex characters",
        )
    return {field: bundle[field] for field in _BUNDLE_FIELDS}


def sign_content_digest(content_digest: str, private_key_seed_hex: str) -> Dict[str, str]:
    """Sign a canonical content digest with an Ed25519 seed (64 lowercase hex)."""
    _assert_content_digest_shape(content_digest)
    if not _is_lowercase_hex(private_key_seed_hex, _RAW_PUBLIC_KEY_HEX_LENGTH):
        raise KDNASignatureError(
            "KDNA_SIGNATURE_KEY_INVALID",
            "Ed25519 private key must be a 32-byte seed encoded as 64 lowercase "
            "hex characters",
        )
    try:
        private_key = Ed25519PrivateKey.from_private_bytes(
            bytes.fromhex(private_key_seed_hex)
        )
    except ValueError as error:
        raise KDNASignatureError(
            "KDNA_SIGNATURE_KEY_INVALID",
            f"invalid Ed25519 private key: {error}",
        ) from error
    public_key = private_key.public_key()
    signature = private_key.sign(build_signing_payload(content_digest))
    return {
        "algorithm": KDSIG_ALGORITHM,
        "content_digest": content_digest,
        "profile": KDSIG_PROFILE,
        "profile_version": KDSIG_PROFILE_VERSION,
        "public_key": public_key.public_bytes_raw().hex(),
        "signature": signature.hex(),
    }


def verify_signature_bundle(
    data: bytes,
    content_digest: str,
    expected_public_key: Optional[str] = None,
) -> Dict[str, str]:
    """Verify a bundle against a canonical content digest. Fail-closed.

    Returns the verification evidence on success; raises KDNASignatureError
    with a stable code on any failure.
    """
    parsed = parse_signature_bundle(data)
    _assert_content_digest_shape(content_digest)
    if parsed["content_digest"] != content_digest:
        raise KDNASignatureError(
            "KDNA_INTEGRITY_SIGNATURE_FAILED",
            f"signature bundle content_digest {parsed['content_digest']} does not "
            f"match the asset content_digest {content_digest}",
        )
    if (
        isinstance(expected_public_key, str)
        and expected_public_key.lower() != parsed["public_key"]
    ):
        raise KDNASignatureError(
            "KDNA_INTEGRITY_SIGNATURE_FAILED",
            "signature bundle public_key does not match the expected pinned key",
        )
    try:
        public_key = Ed25519PublicKey.from_public_bytes(
            bytes.fromhex(parsed["public_key"])
        )
    except ValueError as error:
        raise KDNASignatureError(
            "KDNA_INTEGRITY_SIGNATURE_FAILED",
            f"signature bundle public_key is not a valid Ed25519 key: {error}",
        ) from error
    try:
        public_key.verify(
            bytes.fromhex(parsed["signature"]),
            build_signing_payload(content_digest),
        )
    except InvalidSignature as error:
        raise KDNASignatureError(
            "KDNA_INTEGRITY_SIGNATURE_FAILED",
            "Ed25519 signature verification failed: signature does not match the "
            "canonical signing payload",
        ) from error
    except ValueError as error:
        raise KDNASignatureError(
            "KDNA_INTEGRITY_SIGNATURE_FAILED",
            f"Ed25519 verification error: {error}",
        ) from error
    return {
        "state": "verified",
        "profile": parsed["profile"],
        "profile_version": parsed["profile_version"],
        "algorithm": parsed["algorithm"],
        "content_digest": parsed["content_digest"],
        "public_key": parsed["public_key"],
        "key_fingerprint": key_fingerprint(parsed["public_key"]),
    }


def sign_container_bytes(data: bytes, private_key_seed_hex: str) -> Dict[str, Any]:
    """Sign a packaged container per RFC-0021 M1 (`kdsig.ed25519`).

    The container must pass every validation gate after any pre-existing
    signature entry is removed; signing never certifies a broken asset.
    Returns the signed container bytes, the bundle, and the signed content
    digest. Fail-closed throughout.
    """
    from . import container
    from .load import _compute_content_digest
    from .pack import pack_entries
    from .validate import run_validate

    layout = container.read_layout(data)
    unsigned_entries = {
        name: entry for name, entry in layout.entries.items() if name != SIGNATURE_ENTRY_NAME
    }
    unsigned_layout = container.Layout(
        kind=layout.kind,
        entries=unsigned_entries,
        manifest=layout.manifest,
        payload=layout.payload,
        mimetype=layout.mimetype,
    )
    validation = run_validate(unsigned_layout)
    if not validation["overall_valid"]:
        raise KDNASignatureError(
            "KDNA_SIGNATURE_INPUT_INVALID",
            "cannot sign: container does not pass validation "
            f"({'; '.join(validation['problems'])})",
        )
    content_digest = _compute_content_digest(unsigned_layout)
    bundle = sign_content_digest(content_digest, private_key_seed_hex)
    bundle_bytes = serialize_signature_bundle(bundle)
    signed_entries = {name: entry.data for name, entry in unsigned_entries.items()}
    signed_entries[SIGNATURE_ENTRY_NAME] = bundle_bytes
    return {
        "container_bytes": pack_entries(signed_entries),
        "bundle": bundle,
        "bundle_bytes": bundle_bytes,
        "content_digest": content_digest,
    }
