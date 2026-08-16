"""KDNA load — Runtime Capsule projection, mirrors JS Core loadAssetUnsafe +
buildRuntimeCapsule for the compact/index/scenario/full profiles.
"""

from __future__ import annotations

import copy
import hashlib
import json
from typing import Any, Dict, List, Optional

import cbor2

from . import container
from . import signature
from .crypto_profile import KDNADecryptionError, decrypt_password_entry
from .plan import plan_load
from .validate import compute_runtime_entry_set_digest

RUNTIME_CAPSULE_CONTRACT_VERSION = "0.1.0"
DIGEST_PROFILE = "kdna.digest-evidence"
DIGEST_PROFILE_VERSION = "0.1.0"
BASIS = {
    "asset": "kdna.digest-basis.container-bytes",
    "content": "kdna.digest-basis.content-tree",
    "runtime_entry_set": "kdna.digest-basis.runtime-entry-set",
}


def _sha256(value: bytes) -> str:
    return f"sha256:{hashlib.sha256(value).hexdigest()}"


def _normalize_text_list(items: Any) -> List[str]:
    if not isinstance(items, list):
        return []
    return [item for item in items if isinstance(item, str) and item]


def _normalize_compact_axiom(axiom: Any) -> Optional[Dict[str, Any]]:
    if isinstance(axiom, str):
        return {
            "type": "axiom_applicability",
            "statement": axiom,
            "one_sentence": axiom,
            "applies_when": [],
            "does_not_apply_when": [],
            "failure_risk": None,
        }
    if not isinstance(axiom, dict):
        return None
    statement = (
        axiom.get("statement")
        or axiom.get("one_sentence")
        or axiom.get("full_statement")
        or axiom.get("id")
    )
    if not statement:
        return None
    one_sentence = axiom.get("one_sentence")
    if not one_sentence or str(one_sentence).startswith("<TBD"):
        one_sentence = (
            axiom.get("full_statement")
            if isinstance(axiom.get("full_statement"), str) and axiom["full_statement"]
            else statement
        )
    return {
        "type": "axiom_applicability",
        "id": axiom.get("id"),
        "statement": statement,
        "one_sentence": one_sentence,
        "applies_when": _normalize_text_list(axiom.get("applies_when")),
        "does_not_apply_when": _normalize_text_list(axiom.get("does_not_apply_when")),
        "failure_risk": axiom.get("failure_risk"),
    }


def _normalize_list(items: Any) -> List[Any]:
    normalized = []
    if isinstance(items, list):
        for item in items:
            if isinstance(item, str):
                normalized.append({"type": "text", "text": item})
            elif isinstance(item, dict):
                normalized.append(copy.deepcopy(item))
    return normalized


def _project_core_structure(items: Any) -> List[Any]:
    if not isinstance(items, list):
        return []
    projected = []
    allowed_keys = {"from", "to", "via", "applies_when", "does_not_apply_when"}
    for relation in items:
        if not isinstance(relation, dict):
            continue
        entry = {key: copy.deepcopy(relation[key]) for key in allowed_keys if key in relation}
        projected.append(entry)
    return projected


def _project_content(payload: Dict[str, Any], profile: str, manifest: Dict[str, Any]) -> Dict[str, Any]:
    core = payload.get("core") or {}
    if profile == "index":
        content: Dict[str, Any] = {
            "asset_id": manifest.get("asset_id"),
            "asset_uid": manifest.get("asset_uid"),
            "title": manifest.get("title"),
            "version": manifest.get("version"),
            "judgment_version": manifest.get("judgment_version"),
            "asset_type": manifest.get("asset_type"),
            "summary": manifest.get("summary"),
            "language": manifest.get("language"),
            "keywords": manifest.get("keywords") or [],
            "profiles_available": list(
                (manifest.get("load_contract") or {}).get("profiles") or {}
            ),
        }
        return content
    if profile == "compact":
        content: Dict[str, Any] = {
            "highest_question": core.get("highest_question"),
            "worldview": list(core.get("worldview") or []),
            "value_order": list(core.get("value_order") or []),
            "judgment_role": (
                copy.deepcopy(core["judgment_role"])
                if isinstance(core.get("judgment_role"), dict)
                else None
            ),
            "axioms": [
                axiom for axiom in (_normalize_compact_axiom(a) for a in (core.get("axioms") or []))
                if axiom is not None
            ],
            "boundaries": _normalize_list(core.get("boundaries")),
            "self_checks": [
                copy.deepcopy(item) for item in (payload.get("reasoning") or {}).get("self_check") or []
            ],
            "failure_modes": _normalize_list(
                (payload.get("reasoning") or {}).get("failure_modes")
            ),
            "patterns": _normalize_list(payload.get("patterns")),
        }
        content["core_structure"] = _project_core_structure(core.get("core_structure"))
        return content
    if profile == "scenario":
        return {"scenarios": payload.get("scenarios") or []}
    if profile == "full":
        return {"manifest": copy.deepcopy(manifest), "payload": copy.deepcopy(payload)}
    raise ValueError(f"unknown load profile: {profile}")


def _available_profiles(payload: Dict[str, Any]) -> List[str]:
    profiles = ["index"]
    if isinstance(payload.get("core"), dict):
        profiles.append("compact")
    if payload.get("scenarios"):
        profiles.append("scenario")
    profiles.append("full")
    return profiles


def _digest_evidence(data: bytes, layout: container.Layout) -> Dict[str, Any]:
    content_digest = _compute_content_digest(layout)
    entry_set_digest = compute_runtime_entry_set_digest(
        layout.entries["kdna.json"].data,
        layout.entries["payload.kdnab"].data,
    )
    return {
        "profile": DIGEST_PROFILE,
        "profile_version": DIGEST_PROFILE_VERSION,
        "asset": {
            "value": _sha256(data),
            "basis": BASIS["asset"],
            "comparison": {
                "state": "not_compared",
                "against": None,
                "expected": None,
                "source": None,
            },
        },
        "content": {
            "value": content_digest,
            "basis": BASIS["content"],
            "comparison": {
                "state": "not_compared",
                "against": None,
                "expected": None,
                "source": None,
            },
        },
        "runtime_entry_set": {
            "value": entry_set_digest,
            "basis": BASIS["runtime_entry_set"],
            "comparison": {
                "state": "not_compared",
                "against": None,
                "expected": None,
                "source": None,
            },
        },
    }


def _stable_stringify(value: Any) -> str:
    if isinstance(value, list):
        return "[" + ",".join(_stable_stringify(item) for item in value) + "]"
    if isinstance(value, dict):
        body = ",".join(
            f"{json.dumps(key, ensure_ascii=False)}:{_stable_stringify(value[key])}"
            for key in sorted(value)
        )
        return "{" + body + "}"
    return json.dumps(value, ensure_ascii=False)


def _manifest_for_digest(manifest: Dict[str, Any]) -> Dict[str, Any]:
    copy = dict(manifest)
    for key in ("asset_digest", "container_sha256", "content_digest", "_source"):
        copy.pop(key, None)
    authoring = copy.get("authoring")
    if isinstance(authoring, dict):
        auth = dict(authoring)
        auth.pop("content_digest", None)
        copy["authoring"] = auth
    return copy


def _compute_content_digest(layout: container.Layout) -> str:
    """Mirror the JS content-tree digest (stable-stringified JSON entries)."""
    import json

    parts = []
    excluded = {".DS_Store", "build-receipt.json", "signature.kdsig"}
    for entry_name in sorted(layout.entries):
        if entry_name in excluded:
            continue
        if entry_name.startswith("reports/"):
            continue
        entry = layout.entries[entry_name]
        if entry_name.lower().endswith(".json"):
            parsed = json.loads(entry.data.decode("utf-8"))
            value = (
                _manifest_for_digest(parsed)
                if entry_name == "kdna.json"
                else parsed
            )
            digest_bytes = _stable_stringify(value).encode("utf-8")
        else:
            digest_bytes = entry.data
        parts.append(f"{entry_name}:{hashlib.sha256(digest_bytes).hexdigest()}")
    combined = "\n".join(parts)
    return f"sha256:{hashlib.sha256(combined.encode('utf-8')).hexdigest()}"


def _signature_evidence(layout: container.Layout) -> Dict[str, Any]:
    """Runtime Capsule signature evidence (RFC-0021 M1), fail-closed.

    An absent ``signature.kdsig`` entry reports ``{"state": "absent"}``.
    A present bundle must verify against the canonical content digest; any
    failure raises before a capsule can be produced.
    """
    entry = layout.entries.get(signature.SIGNATURE_ENTRY_NAME)
    if entry is None:
        return {"state": "absent"}
    evidence = signature.verify_signature_bundle(
        entry.data,
        _compute_content_digest(layout),
    )
    return {
        "state": "verified",
        "profile": evidence["profile"],
        "profile_version": evidence["profile_version"],
        "key_fingerprint": evidence["key_fingerprint"],
        "content_digest": evidence["content_digest"],
    }


def load(
    data: bytes,
    profile: str = "compact",
    *,
    has_password: bool = False,
    password: Optional[str] = None,
    entitlement: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Load a packaged asset and return a Runtime Capsule (JS-equivalent shape).

    Raises ValueError when the LoadPlan denies loading. For a password-protected
    asset, providing ``password`` authorizes the load: the credential is treated
    as unverified until decryption succeeds (mirror of JS ``loadAuthorized``).
    """
    plan = plan_load(data, has_password=has_password, password=password, entitlement=entitlement)

    # A password asset reports a supplied credential as unverified
    # (KDNA_AUTH_PASSWORD_UNVERIFIED); a provided password authorizes us to try
    # to load it — the real check is the decryption itself, which fails closed.
    load_may_verify_password = (
        bool(password)
        and plan["state"] == "needs_password"
        and any(
            issue.get("code") == "KDNA_AUTH_PASSWORD_UNVERIFIED"
            for issue in (plan.get("issues") or [])
        )
    )
    if plan["can_load_now"] is not True and not load_may_verify_password:
        codes = [issue["code"] for issue in plan["issues"] if issue.get("code")]
        error = ValueError(
            f"LoadPlan denied loading: state={plan['state']} "
            f"required_action={plan['required_action']}"
        )
        error.code = codes[0] if codes else "KDNA_LOAD_NOT_AUTHORIZED"
        raise error

    layout = container.read_layout(data)
    payload = layout.payload
    if not isinstance(payload, dict):
        raise ValueError("payload is not a CBOR object")
    manifest = layout.manifest

    payload_meta = manifest.get("payload") or {}
    if payload_meta.get("encrypted"):
        # Authorized load: decrypt the entry, then project the plaintext payload.
        # Wrong password / tampered entry → KDNADecryptionError (fail closed).
        if not password:
            raise ValueError(
                "this asset is password-protected; a password is required to load it"
            )
        plaintext = decrypt_password_entry(
            payload,
            entry_name=payload_meta.get("path", "payload.kdnab"),
            manifest=manifest,
            password=password,
        )
        decrypted = cbor2.loads(plaintext)
        if not isinstance(decrypted, dict):
            raise ValueError("decrypted payload is not a CBOR object")
        payload = decrypted

    profiles = _available_profiles(payload)
    if profile not in profiles:
        raise ValueError(f"unknown load profile: {profile}")

    projection = {
        "status": "loaded",
        "profile": profile,
        "profile_available": True,
        "available_profiles": profiles,
        "asset_id": manifest.get("asset_id"),
        "title": manifest.get("title"),
        "content": _project_content(payload, profile, manifest),
    }

    signature_evidence = _signature_evidence(layout)

    capsule = {
        "type": "kdna.runtime-capsule",
        "contract_version": RUNTIME_CAPSULE_CONTRACT_VERSION,
        "asset": {
            "asset_id": manifest.get("asset_id"),
            "asset_uid": manifest.get("asset_uid"),
            "version": manifest.get("version"),
            "judgment_version": manifest.get("judgment_version"),
        },
        "digests": _digest_evidence(data, layout),
        "signature": signature_evidence,
        "access": manifest.get("access") or "public",
        "profile": profile,
        "context": projection["content"],
        "trace": {
            "payload_encoding": (manifest.get("payload") or {}).get("encoding") or "cbor",
            "loaded_by": "kdna-core-python",
            "loaded_at": None,
            "input_kind": "packaged_bytes",
            "runtime_eligible": True,
            "schema_valid": True,
            "signature_state": signature_evidence["state"],
            "profile": profile,
        },
    }
    return capsule


def load_file(path: str, profile: str = "compact", **options: Any) -> Dict[str, Any]:
    with open(path, "rb") as handle:
        return load(handle.read(), profile, **options)
