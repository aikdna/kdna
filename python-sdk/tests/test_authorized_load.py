"""Authorized-load tests for password-protected assets (crypto_profile).

Proves the Python Core can:
1. plan a licensed-password asset: password-missing -> needs_password;
2. authorize a load with the correct password (mirror of JS ``loadAuthorized``):
   the password-valid fixture decrypts and projects a compact capsule;
3. fail closed on a wrong password, tampered entry, missing credential;
4. KDF non-collapse (RFC-0018 R4.3): an Argon2id slot without argon2-cffi
   reports KDNA_KDF_UNSUPPORTED instead of downgrading to scrypt;
5. the declared ``kdf`` is validated before the password/recovery branch, so a
   tampered kdf fails closed on the recovery path too (mirror of JS
   ``decryptProtectedEntry``).

Fixtures come from the committed ``conformance/authorization`` tree; the
unpacked fixture directories are packed back into containers with the SDK's
own deterministic pack (same as the JS authorization conformance test).
"""

from __future__ import annotations

import base64
import builtins
import json
from pathlib import Path

import pytest
from cryptography.hazmat.primitives.keywrap import aes_key_unwrap, aes_key_wrap

from kdna.core import load, pack_source, plan_load
from kdna.core.crypto_profile import (
    KDNADecryptionError,
    decrypt_password_entry,
    PASSWORD_PROFILE,
    _decode_recovery_code,
    _derive_argon2id_key,
    _find_slot,
)

ROOT = Path(__file__).resolve().parents[2]
AUTH_FIXTURES = ROOT / "conformance" / "authorization" / "fixtures"
PASSWORD = "KDNA-AUTHORIZATION-CONFORMANCE-2026"

HAS_ARGON2 = True
try:
    import argon2  # noqa: F401
except ImportError:
    HAS_ARGON2 = False


def _container_bytes(fixture: str) -> bytes:
    return pack_source(AUTH_FIXTURES / fixture)


def _envelope_and_manifest(fixture: str):
    import cbor2

    base = AUTH_FIXTURES / fixture
    manifest = json.loads((base / "kdna.json").read_text())
    envelope = cbor2.loads((base / "payload.kdnab").read_bytes())
    return envelope, manifest


def _with_recovery_slot(envelope, recovery_code: str):
    """Add a recovery key slot wrapping the same CEK as the password slot.

    Mirrors JS ``encryptProtectedEntry``: unwrap the CEK from the password
    slot, then wrap it again with the recovery code key.
    """
    password_slot = _find_slot(envelope, "password")
    kek = _derive_argon2id_key(PASSWORD, envelope["password_kdf"])
    cek = aes_key_unwrap(kek, password_slot)
    recovery_key = _decode_recovery_code(recovery_code)
    wrapped = aes_key_wrap(recovery_key, cek)
    enriched = dict(envelope)
    enriched["key_slots"] = list(envelope["key_slots"]) + [
        {"slot": "recovery", "wrap": "AES-256-KW", "wrapped_key": base64.b64encode(wrapped).decode()}
    ]
    return enriched


# -- plan decisions ----------------------------------------------------------
def test_password_missing_plan_needs_password() -> None:
    plan = plan_load(_container_bytes("password-missing"), has_password=False)
    assert plan["state"] == "needs_password"
    assert plan["required_action"] == "enter_password"
    assert plan["can_load_now"] is False
    codes = {i["code"] for i in plan["issues"]}
    assert "KDNA_AUTH_PASSWORD_REQUIRED" in codes


def test_password_supplied_plan_reports_unverified() -> None:
    plan = plan_load(_container_bytes("password-valid"), has_password=True)
    assert plan["state"] == "needs_password"
    codes = {i["code"] for i in plan["issues"]}
    assert "KDNA_AUTH_PASSWORD_UNVERIFIED" in codes


# -- authorized load (mirror of JS loadAuthorized) ---------------------------
def test_authorized_load_correct_password_projects() -> None:
    data = _container_bytes("password-valid")
    capsule = load(data, "compact", password=PASSWORD)
    assert capsule["type"] == "kdna.runtime-capsule"
    assert capsule["profile"] == "compact"
    assert capsule["access"] == "licensed"
    content = capsule["context"]
    assert isinstance(content, dict)
    # The decrypted payload is the real judgment content, not an empty shell.
    assert content.get("highest_question") or content.get("axioms")


def test_authorized_load_wrong_password_fails_closed() -> None:
    data = _container_bytes("password-valid")
    with pytest.raises(KDNADecryptionError):
        load(data, "compact", password="not-the-password")


def test_authorized_load_no_password_denied() -> None:
    data = _container_bytes("password-valid")
    with pytest.raises(ValueError):
        load(data, "compact")  # plan denies: can_load_now false, no password


# -- decryption unit semantics ----------------------------------------------
def test_decrypt_plaintext_is_judgment_payload() -> None:
    envelope, manifest = _envelope_and_manifest("password-valid")
    plaintext = decrypt_password_entry(
        envelope,
        entry_name=manifest["payload"]["path"],
        manifest=manifest,
        password=PASSWORD,
    )
    import cbor2

    decoded = cbor2.loads(plaintext)
    assert isinstance(decoded, dict)
    assert "core" in decoded  # real judgment payload, not a stub


def test_decrypt_tampered_ciphertext_rejected() -> None:
    envelope, manifest = _envelope_and_manifest("password-valid")
    import base64

    tampered = dict(envelope)
    ct = bytearray(base64.b64decode(tampered["ciphertext"]))
    ct[0] ^= 0xFF
    tampered["ciphertext"] = base64.b64encode(bytes(ct)).decode()
    with pytest.raises(KDNADecryptionError):
        decrypt_password_entry(
            tampered,
            entry_name=manifest["payload"]["path"],
            manifest=manifest,
            password=PASSWORD,
        )


def test_decrypt_unknown_profile_rejected() -> None:
    envelope, manifest = _envelope_and_manifest("password-valid")
    envelope = dict(envelope, profile="kdna.encryption.licensed-entry")
    with pytest.raises(KDNADecryptionError):
        decrypt_password_entry(
            envelope,
            entry_name=manifest["payload"]["path"],
            manifest=manifest,
            password=PASSWORD,
        )


@pytest.mark.skipif(not HAS_ARGON2, reason="argon2-cffi not installed; cannot simulate its absence")
def test_argon2_kdf_unsupported_without_dependency(monkeypatch) -> None:
    # Simulate a reader WITHOUT argon2-cffi. The Argon2id slot must fail with
    # KDNA_KDF_UNSUPPORTED — never silently downgrade to scrypt (R4.3).
    real_import = builtins.__import__

    def fake_import(name, *args, **kwargs):
        if name == "argon2" or name.startswith("argon2."):
            raise ImportError("simulated missing argon2-cffi")
        return real_import(name, *args, **kwargs)

    monkeypatch.setattr(builtins, "__import__", fake_import)
    envelope, manifest = _envelope_and_manifest("password-valid")
    with pytest.raises(KDNADecryptionError) as excinfo:
        decrypt_password_entry(
            envelope,
            entry_name=manifest["payload"]["path"],
            manifest=manifest,
            password=PASSWORD,
        )
    assert "KDNA_KDF_UNSUPPORTED" in str(excinfo.value)


def test_profile_constant_matches_manifest_schema() -> None:
    # The decryption profile is the same identifier the manifest schema allows.
    envelope, _ = _envelope_and_manifest("password-valid")
    assert envelope["profile"] == PASSWORD_PROFILE


RECOVERY_CODE = "kdna-recover-00112233445566778899aabbccddeeff-00112233445566778899aabbccddeeff"


def test_recovery_code_decrypts_with_untampered_kdf() -> None:
    # Sanity: the recovery path itself works when the kdf field is intact.
    envelope, manifest = _envelope_and_manifest("password-valid")
    enriched = _with_recovery_slot(envelope, RECOVERY_CODE)
    plaintext = decrypt_password_entry(
        enriched,
        entry_name=manifest["payload"]["path"],
        manifest=manifest,
        recovery_code=RECOVERY_CODE,
    )
    assert plaintext  # non-empty plaintext proves the recovery unwrap + GCM tag verified


def test_tampered_kdf_fails_closed_on_recovery_path() -> None:
    # Mirror JS decryptProtectedEntry: the declared kdf is validated before the
    # password/recovery branch, so a tampered kdf must fail closed even when a
    # correct recovery code is supplied.
    envelope, manifest = _envelope_and_manifest("password-valid")
    enriched = _with_recovery_slot(envelope, RECOVERY_CODE)
    tampered = dict(enriched, kdf="scrypt-sha256")
    with pytest.raises(KDNADecryptionError) as excinfo:
        decrypt_password_entry(
            tampered,
            entry_name=manifest["payload"]["path"],
            manifest=manifest,
            recovery_code=RECOVERY_CODE,
        )
    assert "kdf" in str(excinfo.value)
