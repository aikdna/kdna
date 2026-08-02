"""KDNA plan_load — mirrors JS Core planLoad decision tree.

Produces the same LoadPlan structure as the JS Core so that any consumer
routing on ``can_load_now`` / ``required_action`` / ``projection_policy``
behaves identically.
"""

from __future__ import annotations

import hashlib
from typing import Any, Dict, Optional

from . import container
from .validate import run_validate

FORBIDDEN_OUTPUT_TERMS = ["hasPassword", "entitlementStatus", "password"]


def _build_issue(code: str, severity: str, message: str) -> Dict[str, str]:
    return {"code": code, "severity": severity, "message": message}


def _normalize_access(manifest: Dict[str, Any]) -> Dict[str, Any]:
    value = manifest.get("access") or "public"
    return {"access": value, "alias": None}


def _infer_entitlement_profile(manifest: Dict[str, Any]) -> Optional[str]:
    entitlement = manifest.get("entitlement")
    if isinstance(entitlement, dict) and isinstance(entitlement.get("profile"), str):
        return entitlement["profile"]
    encryption = manifest.get("encryption")
    if isinstance(encryption, dict):
        if encryption.get("profile") == "kdna.encryption.password":
            return "password"
        if encryption.get("profile") == "kdna.encryption.password.scrypt":
            return "password"
    return None


def _compute_source_fingerprint(layout: container.Layout) -> str:
    digest = hashlib.sha256()
    for name in sorted(layout.entries):
        data = layout.entries[name].data
        digest.update(name.encode("utf-8"))
        digest.update(b"\0")
        digest.update(str(len(data)).encode("utf-8"))
        digest.update(b"\0")
        digest.update(data)
        digest.update(b"\0")
    return f"sha256:{digest.hexdigest()}"


def _verified_entitlement(entitlement: Any) -> bool:
    return (
        isinstance(entitlement, dict)
        and entitlement.get("status") in ("active", "expired", "revoked", "offline_grace")
    )


def _entitlement_matches(entitlement: Any, manifest: Dict[str, Any], layout: container.Layout) -> bool:
    if not _verified_entitlement(entitlement) or not isinstance(entitlement.get("asset"), dict):
        return False
    asset = entitlement["asset"]
    return (
        asset.get("asset_id") == manifest.get("asset_id")
        and asset.get("asset_uid") == manifest.get("asset_uid")
        and asset.get("version") == manifest.get("version")
    )


def plan_load(
    data: bytes,
    *,
    has_password: bool = False,
    password: Optional[str] = None,
    entitlement: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    try:
        layout = container.read_layout(data)
    except container.KDNAFormatError as error:
        return _invalid_plan(str(error), "KDNA_FORMAT_INVALID", None)

    validation = run_validate(layout)
    manifest = layout.manifest
    access_info = _normalize_access(manifest)
    plan: Dict[str, Any] = {
        "format_version": manifest.get("format_version"),
        "asset": {
            "asset_id": manifest.get("asset_id"),
            "asset_uid": manifest.get("asset_uid"),
            "title": manifest.get("title"),
            "version": manifest.get("version"),
            "judgment_version": manifest.get("judgment_version"),
        },
        "access": access_info["access"],
        "access_alias": access_info["alias"],
        "entitlement_profile": _infer_entitlement_profile(manifest),
        "state": "invalid",
        "required_action": "block",
        "can_load_now": False,
        "projection_policy": "none",
        "input_fingerprint": {
            "has_password_input": has_password or bool(password),
            "entitlement_input": (
                entitlement["status"] if _verified_entitlement(entitlement) else None
            ),
            "source_fingerprint": _compute_source_fingerprint(layout),
        },
        "checks": {
            "format_valid": validation["format_valid"],
            "schema_valid": validation["schema_valid"],
            "payload_valid": validation["payload_valid"],
            "checksums_valid": validation["checksums_valid"],
            "load_contract_valid": validation["load_contract_valid"],
            "overall_valid": validation["overall_valid"],
        },
        "issues": [],
        "source": {"kind": layout.kind, "path": None},
    }

    if not validation["overall_valid"]:
        if plan["access"] not in ("public", "licensed", "remote"):
            plan["access"] = None
            plan["access_alias"] = None
        for problem in validation["problems"]:
            plan["issues"].append(
                _build_issue(_validation_problem_code(problem), "blocking", problem)
            )
        return plan

    if plan["access"] not in ("public", "licensed", "remote"):
        unknown = plan["access"]
        plan["access"] = None
        plan["state"] = "invalid"
        plan["required_action"] = "block"
        plan["issues"].append(_build_issue(
            "KDNA_ACCESS_MODE_UNKNOWN", "blocking", f'Unknown access value "{unknown}".'
        ))
        return plan

    if plan["access"] == "remote":
        plan["state"] = "needs_runtime"
        plan["required_action"] = "connect_runtime"
        plan["projection_policy"] = "remote"
        plan["issues"].append(_build_issue(
            "KDNA_AUTH_REMOTE_RUNTIME_REQUIRED",
            "blocking",
            "Remote assets require a runtime projection endpoint.",
        ))
        return plan

    if plan["access"] == "licensed":
        return _licensed_plan(plan, manifest, has_password, password, entitlement)

    payload_declared_encrypted = bool((manifest.get("payload") or {}).get("encrypted"))
    encrypted_entries = manifest.get("encryption", {}).get("encrypted_entries")
    has_encrypted_payload = payload_declared_encrypted or (
        isinstance(encrypted_entries, list) and len(encrypted_entries) > 0
    )
    if has_encrypted_payload:
        plan["state"] = "invalid"
        plan["required_action"] = "block"
        plan["projection_policy"] = "none"
        plan["issues"].append(_build_issue(
            "KDNA_CRYPTO_PROFILE_UNSUPPORTED",
            "blocking",
            "Encrypted entries require licensed access.",
        ))
        return plan

    if _verified_entitlement(entitlement):
        if entitlement["status"] == "expired":
            plan["state"] = "expired_grace"
            plan["required_action"] = "renew_entitlement"
            plan["projection_policy"] = "none"
            plan["issues"].append(_build_issue(
                "KDNA_AUTH_EXPIRED", "blocking", "The entitlement is expired."
            ))
            return plan
        if entitlement["status"] == "revoked":
            plan["state"] = "denied"
            plan["required_action"] = "contact_issuer"
            plan["projection_policy"] = "none"
            plan["issues"].append(_build_issue(
                "KDNA_AUTH_REVOKED", "blocking", "The entitlement has been revoked."
            ))
            return plan
        if entitlement["status"] == "offline_grace":
            plan["state"] = "offline_grace"
            plan["required_action"] = "sync"
            plan["can_load_now"] = True
            plan["projection_policy"] = "minimal"
            plan["issues"].append(_build_issue(
                "KDNA_AUTH_OFFLINE_GRACE_ACTIVE",
                "warning",
                "The entitlement can load during offline grace but must sync before grace expires.",
            ))
            return plan
        if entitlement["status"] == "active":
            plan["state"] = "ready"
            plan["required_action"] = "load"
            plan["can_load_now"] = True
            plan["projection_policy"] = "minimal"
            plan["issues"].append(_build_issue(
                "KDNA_AUTH_ACTIVE_DIAGNOSTIC",
                "info",
                "Entitlement active diagnostic signal acknowledged.",
            ))
            return plan

    if has_password and not password:
        plan["issues"].append(_build_issue(
            "KDNA_AUTH_PASSWORD_DIAGNOSTIC",
            "info",
            "hasPassword is a diagnostic credential-presence signal only; it does not verify the password.",
        ))

    plan["state"] = "ready"
    plan["required_action"] = "load"
    plan["can_load_now"] = True
    plan["projection_policy"] = "minimal"
    return plan


def _licensed_plan(
    plan: Dict[str, Any],
    manifest: Dict[str, Any],
    has_password: bool,
    password: Optional[str],
    entitlement: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    profile = plan["entitlement_profile"]
    known_profiles = {
        "password", "local_receipt", "account", "org",
        "purchase_receipt", "device_bound",
    }
    if profile and profile not in known_profiles:
        plan["state"] = "invalid"
        plan["required_action"] = "block"
        plan["projection_policy"] = "none"
        plan["issues"].append(_build_issue(
            "KDNA_ENTITLEMENT_PROFILE_UNKNOWN",
            "blocking",
            f'Unknown entitlement profile "{profile}".',
        ))
        return plan

    if profile == "password":
        plan["state"] = "needs_password"
        plan["required_action"] = "enter_password"
        plan["projection_policy"] = "none"
        if has_password or bool(password):
            plan["issues"].append(_build_issue(
                "KDNA_AUTH_PASSWORD_UNVERIFIED",
                "blocking",
                "A password was provided but has not been verified. Only an authorized load may verify it by decrypting the protected payload.",
            ))
        else:
            plan["issues"].append(_build_issue(
                "KDNA_AUTH_PASSWORD_REQUIRED",
                "blocking",
                "A password is required before this asset can be loaded.",
            ))
        return plan

    if profile == "account":
        if _verified_entitlement(entitlement):
            if not _entitlement_matches(entitlement, manifest, None):
                return _reject_grant_mismatch(plan)
            if entitlement["status"] == "offline_grace":
                plan["state"] = "offline_grace"
                plan["required_action"] = "sync"
                plan["can_load_now"] = True
                plan["projection_policy"] = "minimal"
                plan["issues"].append(_build_issue(
                    "KDNA_AUTH_OFFLINE_GRACE_ACTIVE",
                    "warning",
                    "The verified device grant can load offline but must sync before grace expires.",
                ))
                return plan
            plan["state"] = "ready"
            plan["required_action"] = "load"
            plan["can_load_now"] = True
            plan["projection_policy"] = "minimal"
            return plan
        plan["state"] = "needs_account"
        plan["required_action"] = "sign_in_or_activate"
        plan["projection_policy"] = "none"
        plan["issues"].append(_build_issue(
            "KDNA_AUTH_ACCOUNT_REQUIRED",
            "blocking",
            "Account authorization is required before this asset can be loaded.",
        ))
        return plan

    if profile == "org":
        if _verified_entitlement(entitlement):
            if not _entitlement_matches(entitlement, manifest, None):
                return _reject_grant_mismatch(plan)
            if entitlement["status"] == "offline_grace":
                plan["state"] = "offline_grace"
                plan["required_action"] = "sync"
                plan["can_load_now"] = True
                plan["projection_policy"] = "minimal"
                return plan
            plan["state"] = "ready"
            plan["required_action"] = "load"
            plan["can_load_now"] = True
            plan["projection_policy"] = "minimal"
            return plan
        plan["state"] = "needs_org_auth"
        plan["required_action"] = "sign_in_or_activate"
        plan["projection_policy"] = "none"
        plan["issues"].append(_build_issue(
            "KDNA_AUTH_ORG_REQUIRED",
            "blocking",
            "Organization authorization is required before this asset can be loaded.",
        ))
        return plan

    if _verified_entitlement(entitlement):
        status = entitlement["status"]
        if status == "active":
            plan["state"] = "ready"
            plan["required_action"] = "load"
            plan["can_load_now"] = True
            plan["projection_policy"] = "minimal"
            return plan
        if status == "expired":
            plan["state"] = "expired_grace"
            plan["required_action"] = "renew_entitlement"
            plan["projection_policy"] = "none"
            plan["issues"].append(_build_issue(
                "KDNA_AUTH_EXPIRED", "blocking", "The entitlement is expired."
            ))
            return plan
        if status == "revoked":
            plan["state"] = "denied"
            plan["required_action"] = "contact_issuer"
            plan["projection_policy"] = "none"
            plan["issues"].append(_build_issue(
                "KDNA_AUTH_REVOKED", "blocking", "The entitlement has been revoked."
            ))
            return plan
        if status == "offline_grace":
            plan["state"] = "offline_grace"
            plan["required_action"] = "sync"
            plan["can_load_now"] = True
            plan["projection_policy"] = "minimal"
            plan["issues"].append(_build_issue(
                "KDNA_AUTH_OFFLINE_GRACE_ACTIVE",
                "warning",
                "The entitlement can load during offline grace but must sync before grace expires.",
            ))
            return plan

    plan["state"] = "needs_license"
    plan["required_action"] = (
        "install_receipt"
        if profile == "local_receipt"
        else "sign_in_or_activate"
    )
    plan["projection_policy"] = "none"
    plan["issues"].append(_build_issue(
        "KDNA_AUTH_ENTITLEMENT_REQUIRED",
        "blocking",
        "A valid entitlement is required before this asset can be loaded.",
    ))
    return plan


def _reject_grant_mismatch(plan: Dict[str, Any]) -> Dict[str, Any]:
    plan["state"] = "invalid"
    plan["required_action"] = "block"
    plan["can_load_now"] = False
    plan["projection_policy"] = "none"
    plan["issues"].append(_build_issue(
        "KDNA_GRANT_ASSET_MISMATCH",
        "blocking",
        "The verified account/device grant is bound to a different asset, version, digest, or encrypted entry.",
    ))
    return plan


def _validation_problem_code(problem: str) -> str:
    lowered = problem.lower()
    if "checksums:" in lowered:
        return "KDNA_INTEGRITY_DIGEST_FAILED"
    if "signature" in lowered:
        return "KDNA_INTEGRITY_SIGNATURE_FAILED"
    return "KDNA_FORMAT_INVALID"


def _invalid_plan(message: str, code: str, source_kind: Optional[str]) -> Dict[str, Any]:
    return {
        "format_version": None,
        "asset": {
            "asset_id": None,
            "asset_uid": None,
            "title": None,
            "version": None,
            "judgment_version": None,
        },
        "access": None,
        "access_alias": None,
        "entitlement_profile": None,
        "state": "invalid",
        "required_action": "block",
        "can_load_now": False,
        "projection_policy": "none",
        "input_fingerprint": None,
        "checks": {
            "format_valid": False,
            "schema_valid": False,
            "payload_valid": False,
            "checksums_valid": False,
            "load_contract_valid": False,
            "overall_valid": False,
        },
        "issues": [_build_issue(code, "blocking", message)],
        "source": {"kind": source_kind or "memory", "path": None},
    }


def plan_load_file(path: str, **options: Any) -> Dict[str, Any]:
    with open(path, "rb") as handle:
        return plan_load(handle.read(), **options)
