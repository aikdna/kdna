"""Authorized decryption for encrypted KDNA entries (mirror of JS crypto-profile.js).

The Python Core parses/validates/plans containers but — like the JS Core —
leaves authorized decryption to a credentials hook. This module provides the
password / recovery-code hook for the two password encryption profiles:

- ``kdna.encryption.password``        (Argon2id, optional ``argon2-cffi``)
- ``kdna.encryption.password.scrypt`` (scrypt-sha256, standard library)

Semantics mirror ``packages/kdna-core/src/crypto-profile.js`` exactly:

- AES-256-KW unwraps the content-encryption key (CEK) from a key slot;
- AES-256-GCM decrypts the entry with that CEK;
- the AAD is five lines: profile / profile_version / asset_id / version / entry path;
- unknown profile / version / alg / kdf / wrapping fail closed (no downgrade);
- KDF non-collapse (RFC-0018 R4.3): an Argon2id slot requires ``argon2-cffi``;
  when it is absent the reader fails with a KDNA_KDF_UNSUPPORTED message and
  NEVER falls back to the weaker scrypt path.
"""

from __future__ import annotations

import base64
import hashlib
from typing import Any, Dict, Optional

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.keywrap import aes_key_unwrap

PASSWORD_PROFILE = "kdna.encryption.password"
PASSWORD_SCRYPT_PROFILE = "kdna.encryption.password.scrypt"
ENCRYPTION_PROFILE_VERSION = "0.1.0"
PASSWORD_KDF = "Argon2id"
SCRYPT_KDF = "scrypt-sha256"
RFC_KEY_WRAPPING = "AES-256-KW"
ALG = "AES-256-GCM"

# hashlib.scrypt's default maxmem (32 MiB) sits exactly on the N=32768,r=8,p=1
# memory need; give it headroom so boundary rejections can't happen.
SCRYPT_MAXMEM = 128 * 1024 * 1024

# Argon2id param bounds (mirror JS MAX_ARGON2_MEMORY_KIB / _ITERATIONS / _PARALLELISM).
MAX_ARGON2_MEMORY_KIB = 262144
MAX_ARGON2_ITERATIONS = 16
MAX_ARGON2_PARALLELISM = 8


class KDNADecryptionError(ValueError):
    """Authorized-decryption failure — always fail closed."""


def _b64(value: Any, label: str) -> bytes:
    if not isinstance(value, str):
        raise KDNADecryptionError(f"{label} must be a base64 string")
    try:
        return base64.b64decode(value)
    except Exception as exc:  # noqa: BLE001
        raise KDNADecryptionError(f"{label} is not valid base64") from exc


def _bounded(value: Any, name: str, maximum: int) -> Any:
    if value is None:
        return value
    if not isinstance(value, int) or isinstance(value, bool) or value < 1 or value > maximum:
        raise KDNADecryptionError(
            f"unsupported {name}: must be an integer between 1 and {maximum}"
        )
    return value


def encrypted_entry_aad(entry_name: str, manifest: Dict[str, Any], profile: str) -> bytes:
    """Five-line Additional Authenticated Data (mirror JS ``encryptedEntryAad``)."""
    return "\n".join(
        [
            profile,
            ENCRYPTION_PROFILE_VERSION,
            str(manifest.get("asset_id") or ""),
            str(manifest.get("version") or ""),
            entry_name,
        ]
    ).encode("utf-8")


def _derive_argon2id_key(password: str, params: Dict[str, Any]) -> bytes:
    salt = params.get("salt")
    if not salt:
        raise KDNADecryptionError("salt is required for Argon2id")
    memory_kib = _bounded(params.get("memory_kib", 65536), "memory_kib", MAX_ARGON2_MEMORY_KIB)
    iterations = _bounded(params.get("iterations", 3), "iterations", MAX_ARGON2_ITERATIONS)
    parallelism = _bounded(params.get("parallelism", 4), "parallelism", MAX_ARGON2_PARALLELISM)
    try:
        from argon2.low_level import Type as Argon2Type
        from argon2.low_level import hash_secret_raw
    except ImportError as exc:
        # KDF non-collapse (RFC-0018 R4.3): the declared KDF is a contract, not a
        # hint — a reader without Argon2id support must fail, never downgrade.
        raise KDNADecryptionError(
            "KDNA_KDF_UNSUPPORTED: this entry declares the Argon2id KDF, but the "
            "argon2-cffi package is not installed"
        ) from exc
    return hash_secret_raw(
        password.encode("utf-8"),
        _b64(salt, "salt"),
        time_cost=iterations,
        memory_cost=memory_kib,
        parallelism=parallelism,
        hash_len=32,
        type=Argon2Type.ID,
    )


def _derive_scrypt_key(password: str, params: Dict[str, Any]) -> bytes:
    salt = params.get("salt")
    if not salt:
        raise KDNADecryptionError("salt is required for scrypt")
    return hashlib.scrypt(
        password.encode("utf-8"),
        salt=_b64(salt, "salt"),
        n=int(params.get("N", 32768)),
        r=int(params.get("r", 8)),
        p=int(params.get("p", 1)),
        dklen=32,
        maxmem=SCRYPT_MAXMEM,
    )


def _find_slot(envelope: Dict[str, Any], slot: str) -> bytes:
    for entry in envelope.get("key_slots") or []:
        if isinstance(entry, dict) and entry.get("slot") == slot:
            return _b64(entry.get("wrapped_key"), f"{slot} slot wrapped_key")
    raise KDNADecryptionError(f"{slot} slot missing from envelope")


def _decode_recovery_code(code: str) -> bytes:
    if not isinstance(code, str) or not code.startswith("kdna-recover-"):
        raise KDNADecryptionError('recovery code must start with "kdna-recover-"')
    hexpart = code[len("kdna-recover-"):].replace("-", "")
    if len(hexpart) != 64 or any(c not in "0123456789abcdefABCDEF" for c in hexpart):
        raise KDNADecryptionError("recovery code format is invalid")
    return bytes.fromhex(hexpart)


def decrypt_password_entry(
    envelope: Dict[str, Any],
    *,
    entry_name: str,
    manifest: Dict[str, Any],
    password: Optional[str] = None,
    recovery_code: Optional[str] = None,
) -> bytes:
    """Decrypt one encrypted entry, returning the plaintext bytes.

    Only ``kdna.encryption.password`` / ``kdna.encryption.password.scrypt``
    envelopes are supported; everything else — and every wrong credential —
    raises :class:`KDNADecryptionError` (fail closed).
    """
    if not isinstance(envelope, dict):
        raise KDNADecryptionError("encrypted entry must be a CBOR envelope object")

    profile = envelope.get("profile")
    if profile not in (PASSWORD_PROFILE, PASSWORD_SCRYPT_PROFILE):
        raise KDNADecryptionError(
            f"unsupported encrypted entry profile: {profile or 'unknown'} "
            f"(expected {PASSWORD_PROFILE} or {PASSWORD_SCRYPT_PROFILE})"
        )
    if envelope.get("profile_version") != ENCRYPTION_PROFILE_VERSION:
        raise KDNADecryptionError(
            "unsupported encrypted entry profile_version: "
            f"{envelope.get('profile_version') or 'unknown'} (expected {ENCRYPTION_PROFILE_VERSION})"
        )
    if envelope.get("alg") != ALG:
        raise KDNADecryptionError(f"unsupported encrypted entry alg: {envelope.get('alg') or 'unknown'}")
    if envelope.get("key_wrapping") != RFC_KEY_WRAPPING:
        raise KDNADecryptionError(
            f"unsupported encrypted entry key_wrapping: {envelope.get('key_wrapping') or 'unknown'}"
        )

    if password is not None:
        if not isinstance(password, str) or not password:
            raise KDNADecryptionError("password must be a non-empty string")
        if profile == PASSWORD_PROFILE:
            if envelope.get("kdf") != PASSWORD_KDF:
                raise KDNADecryptionError(
                    f"unsupported encrypted entry kdf: {envelope.get('kdf') or 'unknown'}"
                )
            kek = _derive_argon2id_key(password, envelope.get("password_kdf") or {})
        else:  # PASSWORD_SCRYPT_PROFILE
            if envelope.get("kdf") != SCRYPT_KDF:
                raise KDNADecryptionError(
                    f"unsupported encrypted entry kdf: {envelope.get('kdf') or 'unknown'}"
                )
            kek = _derive_scrypt_key(password, envelope.get("scrypt_params") or {})
        wrapped = _find_slot(envelope, "password")
    elif recovery_code is not None:
        kek = _decode_recovery_code(recovery_code)
        wrapped = _find_slot(envelope, "recovery")
    else:
        raise KDNADecryptionError("password or recovery_code is required for authorized decryption")

    try:
        cek = aes_key_unwrap(kek, wrapped)
    except Exception as exc:  # noqa: BLE001 — wrong KEK (almost) always fails unwrap
        raise KDNADecryptionError(
            "the password or recovery code is incorrect (key unwrap failed)"
        ) from exc

    iv = _b64(envelope.get("iv"), "iv")
    tag = _b64(envelope.get("tag"), "tag")
    ciphertext = _b64(envelope.get("ciphertext"), "ciphertext")
    if len(iv) != 12:
        raise KDNADecryptionError("iv must be 12 bytes (AES-256-GCM nonce)")
    if len(tag) != 16:
        raise KDNADecryptionError("tag must be 16 bytes (AES-256-GCM auth tag)")

    aad = encrypted_entry_aad(entry_name, manifest, profile)
    try:
        return AESGCM(cek).decrypt(iv, ciphertext + tag, aad)
    except InvalidTag as exc:
        raise KDNADecryptionError(
            "the password or recovery code is incorrect, or the encrypted entry was tampered with"
        ) from exc
