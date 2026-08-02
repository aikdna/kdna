"""KDNA validate — mirrors JS Core runValidate gates.

Gates: format, schema, payload, checksums, load_contract, loader
compatibility. Returns the same structure as the JS Core ``validate`` result.
"""

from __future__ import annotations

import hashlib
from typing import Any, Dict, List

from . import container
from .schema import validate_schema

REMOVED_ALIASES = {
    "kdna_spec": "format_version",
    "kdna_version": "format_version",
    "spec_version": "format_version",
}


def _digest(value: bytes) -> str:
    return f"sha256:{hashlib.sha256(value).hexdigest()}"


def compute_runtime_entry_set_digest(manifest_bytes: bytes, payload_bytes: bytes) -> str:
    entries = {
        "kdna.json": hashlib.sha256(manifest_bytes).hexdigest(),
        "payload.kdnab": hashlib.sha256(payload_bytes).hexdigest(),
    }
    combined = "\n".join(f"{name}:{entries[name]}" for name in sorted(entries))
    return f"sha256:{hashlib.sha256(combined.encode('utf-8')).hexdigest()}"


def _verify_checksums(checksums: Dict[str, Any], layout: container.Layout, problems: List[str]) -> bool:
    valid = True
    digest_metadata_present = any(
        checksums.get(key) is not None
        for key in ("digest_profile", "digest_profile_version", "covered_entries")
    )
    if digest_metadata_present:
        for field in ("digest_profile", "digest_profile_version", "covered_entries"):
            if field not in checksums:
                problems.append(f"checksums: missing {field}")
                valid = False
        covered = checksums.get("covered_entries") or []
        if not isinstance(covered, list) or not covered:
            problems.append("checksums: covered_entries must be non-empty")
            valid = False
        for entry_name in covered:
            entry = layout.entries.get(entry_name)
            if entry is None:
                problems.append(f"checksums: covered entry {entry_name} is absent from the container")
                valid = False
                continue
            declared = (checksums.get("entries") or {}).get(entry_name)
            if not declared:
                problems.append(f"checksums: missing entry digest for {entry_name}")
                valid = False
                continue
            actual_bare = hashlib.sha256(entry.data).hexdigest()
            declared_value = declared.get("value")
            if declared_value is None:
                problems.append(f"checksums: missing value for {entry_name}")
                valid = False
                continue
            if declared_value.startswith("sha256:"):
                declared_bare = declared_value[len("sha256:"):]
            else:
                declared_bare = declared_value
            if declared_bare != actual_bare:
                problems.append(
                    f"checksums: {entry_name} digest does not match the actual entry bytes"
                )
                valid = False
        declared_set = checksums.get("entry_set_digest")
        if declared_set is not None:
            actual = compute_runtime_entry_set_digest(
                layout.entries["kdna.json"].data,
                layout.entries["payload.kdnab"].data,
            )
            if declared_set != actual:
                problems.append("checksums: entry_set_digest does not match computed value")
                valid = False
    return valid


def run_validate(layout: container.Layout) -> Dict[str, Any]:
    result: Dict[str, Any] = {
        "format_valid": True,
        "schema_valid": True,
        "payload_valid": True,
        "checksums_valid": True,
        "load_contract_valid": True,
        "loader_compatible": True,
    }
    problems: List[str] = []

    for required in container.REQUIRED_DIR_ENTRIES:
        if required not in layout.entries:
            result["format_valid"] = False
            problems.append(f"format: missing required entry {required}")
    if layout.mimetype != container.MIMETYPE:
        result["format_valid"] = False
        problems.append(f"format: mimetype is not {container.MIMETYPE}")

    manifest = layout.manifest
    manifest_problems = validate_schema("manifest", manifest)
    if manifest_problems:
        result["schema_valid"] = False
        problems.extend(manifest_problems)
    for field, replacement in REMOVED_ALIASES.items():
        if field in manifest:
            result["schema_valid"] = False
            problems.append(f"kdna.json: {field} is not allowed. Use {replacement}.")

    payload = layout.payload
    if not isinstance(payload, dict):
        result["payload_valid"] = False
        problems.append("payload: not a CBOR object")
        return _finalize(result, problems)

    payload_is_encrypted = bool(payload.get("profile") and payload.get("ciphertext"))
    encrypted_entries = manifest.get("encryption", {}).get("encrypted_entries")
    manifest_declares_encrypted = bool(
        (manifest.get("payload") or {}).get("encrypted")
        or (isinstance(encrypted_entries, list) and "payload.kdnab" in encrypted_entries)
    )
    if manifest_declares_encrypted and not payload_is_encrypted:
        result["payload_valid"] = False
        problems.append("payload: manifest declares encryption but payload.kdnab is not an encrypted envelope")
    if payload_is_encrypted and not manifest_declares_encrypted:
        result["payload_valid"] = False
        problems.append("payload: encrypted envelope is missing its manifest encryption declaration")

    if not payload_is_encrypted:
        is_bundle = (
            (manifest.get("compatibility") or {}).get("profile") == "kdna.payload.bundle"
            or manifest.get("asset_type") == "bundle"
        )
        schema_name = "bundle-profile" if is_bundle else "payload-profile"
        payload_problems = validate_schema(schema_name, payload)
        if payload_problems:
            result["payload_valid"] = False
            problems.extend(payload_problems)

    if "checksums.json" in layout.entries:
        checks = None
        try:
            import json

            checks = json.loads(layout.entries["checksums.json"].data.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            result["checksums_valid"] = False
            problems.append(f"checksums: not valid JSON ({error})")
        if checks is not None:
            checksums_problems = validate_schema("checksums", checks)
            if checksums_problems:
                result["checksums_valid"] = False
                problems.extend(checksums_problems)
            if not _verify_checksums(checks, layout, problems):
                result["checksums_valid"] = False

    if manifest.get("load_contract"):
        load_contract_problems = validate_schema("load-contract", manifest["load_contract"])
        if load_contract_problems:
            result["load_contract_valid"] = False
            problems.extend(load_contract_problems)

    return _finalize(result, problems)


def _finalize(result: Dict[str, Any], problems: List[str]) -> Dict[str, Any]:
    result["overall_valid"] = all(
        result[key]
        for key in (
            "format_valid",
            "schema_valid",
            "payload_valid",
            "checksums_valid",
            "load_contract_valid",
        )
    )
    result["problems"] = problems
    return result


def validate_file(path: str) -> Dict[str, Any]:
    return run_validate(container.read_layout_file(path))


def validate_bytes(data: bytes) -> Dict[str, Any]:
    return run_validate(container.read_layout(data))
