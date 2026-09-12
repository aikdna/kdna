"""KDNA Python Core — independent implementation of the protocol containers.

This package parses, validates, plans, and loads KDNA distribution
containers directly (ZIP + CBOR + JSON Schema), independent of the JS Core.
It coexists with the CLI-delegating adapter in ``kdna.loader``.

Public API mirrors the JS Core surface:
- ``inspect`` / ``validate`` / ``plan_load`` / ``load``
- ``pack`` / ``build_checksums``
"""

from .container import MIMETYPE, KDNAFormatError, read_layout, read_layout_file
from .validate import (
    compute_runtime_entry_set_digest,
    run_validate,
    validate_bytes,
    validate_file,
)
from .plan import plan_load, plan_load_file
from .pack import build_checksums, pack, pack_entries, pack_source
from .load import load, load_file
from .signature import (
    KDSIG_ALGORITHM,
    KDSIG_PROFILE,
    KDSIG_PROFILE_VERSION,
    SIGNATURE_ENTRY_NAME,
    KDNASignatureError,
    build_signing_payload,
    generate_signing_key_pair,
    key_fingerprint,
    parse_signature_bundle,
    serialize_signature_bundle,
    sign_container_bytes,
    sign_content_digest,
    verify_signature_bundle,
)

__all__ = [
    "MIMETYPE",
    "KDNAFormatError",
    "read_layout",
    "read_layout_file",
    "compute_runtime_entry_set_digest",
    "run_validate",
    "validate_bytes",
    "validate_file",
    "plan_load",
    "plan_load_file",
    "build_checksums",
    "pack",
    "pack_entries",
    "pack_source",
    "load",
    "load_file",
    "KDSIG_ALGORITHM",
    "KDSIG_PROFILE",
    "KDSIG_PROFILE_VERSION",
    "SIGNATURE_ENTRY_NAME",
    "KDNASignatureError",
    "build_signing_payload",
    "generate_signing_key_pair",
    "key_fingerprint",
    "parse_signature_bundle",
    "serialize_signature_bundle",
    "sign_container_bytes",
    "sign_content_digest",
    "verify_signature_bundle",
]
