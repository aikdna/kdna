"""Signature tests — RFC-0021 M1 (`kdsig.ed25519`) known-answer vectors.

These tests consume the same ``conformance/signature/vectors.json`` file as
the JS conformance runner. They prove the Python implementation is an
independent verifier/signer for the pinned bytes: canonicalization parity,
deterministic re-signing, offline verification, fail-closed loading, and the
documented wrong-key pinning semantics.
"""

from __future__ import annotations

import copy
import json
from pathlib import Path

import cbor2
import pytest

from kdna.core import (
    KDSIG_PROFILE,
    KDSIG_PROFILE_VERSION,
    SIGNATURE_ENTRY_NAME,
    KDNASignatureError,
    build_signing_payload,
    generate_signing_key_pair,
    key_fingerprint,
    load,
    pack_entries,
    parse_signature_bundle,
    plan_load,
    run_validate,
    serialize_signature_bundle,
    sign_container_bytes,
    sign_content_digest,
    validate_bytes,
    verify_signature_bundle,
)
from kdna.core import container
from kdna.core.load import _compute_content_digest

ROOT = Path(__file__).resolve().parents[2]
VECTORS_PATH = ROOT / "conformance" / "signature" / "vectors.json"


@pytest.fixture(scope="module")
def vectors() -> dict:
    return json.loads(VECTORS_PATH.read_text("utf-8"))


def entry_map(vectors: dict) -> dict:
    return {
        name: bytes.fromhex(hex_bytes)
        for name, hex_bytes in vectors["asset"]["entries"].items()
    }


def layout_from_entries(entries: dict) -> container.Layout:
    return container.read_layout(pack_entries(entries))


def test_vectors_pin_the_current_profile(vectors: dict):
    assert vectors["profile"] == KDSIG_PROFILE
    assert vectors["profile_version"] == KDSIG_PROFILE_VERSION
    assert vectors["entry_name"] == SIGNATURE_ENTRY_NAME


def test_content_digest_matches_js_known_answer(vectors: dict):
    layout = layout_from_entries(entry_map(vectors))
    assert _compute_content_digest(layout) == vectors["expected"]["content_digest"]


def test_signing_payload_matches_js_known_answer(vectors: dict):
    payload = build_signing_payload(vectors["expected"]["content_digest"])
    assert payload.hex() == vectors["expected"]["signing_payload_hex"]
    assert payload.decode("utf-8") == vectors["expected"]["signing_payload"]


def test_python_resigning_reproduces_the_pinned_bundle_bytes(vectors: dict):
    bundle = sign_content_digest(
        vectors["expected"]["content_digest"], vectors["key"]["seed_hex"]
    )
    assert bundle == vectors["expected"]["bundle"]
    assert (
        serialize_signature_bundle(bundle).hex()
        == vectors["expected"]["bundle_bytes_hex"]
    )


def test_pinned_bundle_verifies_offline(vectors: dict):
    evidence = verify_signature_bundle(
        bytes.fromhex(vectors["expected"]["bundle_bytes_hex"]),
        vectors["expected"]["content_digest"],
    )
    assert evidence["state"] == "verified"
    assert evidence["key_fingerprint"] == vectors["expected"]["key_fingerprint"]
    assert evidence["content_digest"] == vectors["expected"]["content_digest"]
    assert key_fingerprint(vectors["key"]["public_key_hex"]) == evidence["key_fingerprint"]


def test_generated_key_pair_round_trips():
    pair = generate_signing_key_pair()
    digest = "sha256:" + "1" * 64
    bundle = sign_content_digest(digest, pair["private_key"])
    assert bundle["public_key"] == pair["public_key"]
    evidence = verify_signature_bundle(serialize_signature_bundle(bundle), digest)
    assert evidence["state"] == "verified"


def test_signed_container_loads_with_verified_capsule_evidence(vectors: dict):
    entries = entry_map(vectors)
    unsigned = pack_entries(entries)
    signed = sign_container_bytes(unsigned, vectors["key"]["seed_hex"])

    validation = validate_bytes(signed["container_bytes"])
    assert validation["overall_valid"] is True
    assert validation["signature_valid"] is True
    assert validation["signature_state"] == "verified"

    plan = plan_load(signed["container_bytes"])
    assert plan["can_load_now"] is True
    assert plan["checks"]["signature_valid"] is True
    assert plan["signature_state"] == "verified"

    capsule = load(signed["container_bytes"], profile="compact")
    assert capsule["signature"]["state"] == "verified"
    assert capsule["signature"]["profile"] == KDSIG_PROFILE
    assert (
        capsule["signature"]["key_fingerprint"]
        == vectors["expected"]["key_fingerprint"]
    )
    assert capsule["signature"]["content_digest"] == vectors["expected"]["content_digest"]
    assert capsule["trace"]["signature_state"] == "verified"


def test_unsigned_container_reports_absent_signature(vectors: dict):
    unsigned = pack_entries(entry_map(vectors))
    validation = validate_bytes(unsigned)
    assert validation["overall_valid"] is True
    assert validation["signature_state"] == "absent"
    capsule = load(unsigned, profile="compact")
    assert capsule["signature"] == {"state": "absent"}
    assert capsule["trace"]["signature_state"] == "absent"


def test_js_signed_container_verifies_and_loads_in_python(vectors: dict):
    """Cross-language parity: a container assembled from the pinned entries
    and the pinned (Ed25519-deterministic) bundle bytes must verify and load
    through Python with identical evidence. Container DEFLATE bytes are not
    pinned; the logical anchors are."""
    entries = entry_map(vectors)
    entries[SIGNATURE_ENTRY_NAME] = bytes.fromhex(
        vectors["expected"]["bundle_bytes_hex"]
    )
    signed_bytes = pack_entries(entries)
    validation = validate_bytes(signed_bytes)
    assert validation["signature_state"] == "verified"
    assert validation["overall_valid"] is True
    capsule = load(signed_bytes, profile="compact")
    assert capsule["signature"]["state"] == "verified"
    assert (
        capsule["signature"]["key_fingerprint"]
        == vectors["expected"]["key_fingerprint"]
    )


def _mutated_container(vectors: dict, negative: dict) -> bytes:
    entries = entry_map(vectors)
    mutate = negative["mutate"]
    if "entry" in mutate:
        data = bytearray(entries[mutate["entry"]])
        if "flip_byte_at" in mutate:
            data[mutate["flip_byte_at"]] ^= 0xFF
        if "json_set" in mutate:
            parsed = json.loads(bytes(data).decode("utf-8"))
            parsed[mutate["json_set"]["path"]] = mutate["json_set"]["value"]
            data = (
                json.dumps(parsed, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
                + "\n"
            ).encode("utf-8")
        if "cbor_set" in mutate:
            decoded = cbor2.loads(bytes(data))
            cursor = decoded
            segments = mutate["cbor_set"]["path"]
            for segment in segments[:-1]:
                cursor = cursor[int(segment)] if isinstance(cursor, list) else cursor[segment]
            last = segments[-1]
            if isinstance(cursor, list):
                cursor[int(last)] = mutate["cbor_set"]["value"]
            else:
                cursor[last] = mutate["cbor_set"]["value"]
            data = cbor2.dumps(decoded)
        entries[mutate["entry"]] = bytes(data)

    if "replace_bundle_bytes_hex" in mutate:
        bundle_bytes = bytes.fromhex(mutate["replace_bundle_bytes_hex"])
    else:
        bundle = copy.deepcopy(vectors["expected"]["bundle"])
        if mutate.get("bundle_signature_flip_nibble"):
            signature = bundle["signature"]
            flipped = format(int(signature[-1], 16) ^ 1, "x")
            bundle["signature"] = signature[:-1] + flipped
        if "bundle_set" in mutate:
            bundle[mutate["bundle_set"]["path"]] = mutate["bundle_set"]["value"]
        bundle_bytes = serialize_signature_bundle(bundle)
    entries[SIGNATURE_ENTRY_NAME] = bundle_bytes
    return pack_entries(entries)


def test_negative_cases_fail_closed(vectors: dict):
    for negative in vectors["negative_cases"]:
        container_bytes = _mutated_container(vectors, negative)
        expected_code = negative["expected_code"]

        validation = run_validate(container.read_layout(container_bytes))
        assert validation["signature_valid"] is False, negative["id"]
        assert validation["signature_state"] == "invalid", negative["id"]
        assert validation["overall_valid"] is False, negative["id"]

        plan = plan_load(container_bytes)
        assert plan["can_load_now"] is False, negative["id"]
        assert plan["state"] == "invalid", negative["id"]
        assert any(
            issue["code"] == expected_code for issue in plan["issues"]
        ), f"{negative['id']}: {plan['issues']}"

        with pytest.raises(ValueError) as raised:
            load(container_bytes, profile="compact")
        assert getattr(raised.value, "code", None) == expected_code, negative["id"]


def test_wrong_key_semantics_pin_foreign_keys(vectors: dict):
    semantics = vectors["wrong_key_semantics"]
    foreign_bundle = sign_content_digest(
        vectors["expected"]["content_digest"], vectors["wrong_key"]["seed_hex"]
    )
    entries = entry_map(vectors)
    entries[SIGNATURE_ENTRY_NAME] = serialize_signature_bundle(foreign_bundle)
    container_bytes = pack_entries(entries)

    unpinned = verify_signature_bundle(
        serialize_signature_bundle(foreign_bundle),
        vectors["expected"]["content_digest"],
    )
    assert unpinned["state"] == semantics["unpinned_state"]
    assert unpinned["key_fingerprint"] == semantics["unpinned_key_fingerprint"]

    validation = validate_bytes(container_bytes)
    assert validation["signature_state"] == "verified"

    with pytest.raises(KDNASignatureError) as raised:
        verify_signature_bundle(
            serialize_signature_bundle(foreign_bundle),
            vectors["expected"]["content_digest"],
            expected_public_key=semantics["pinned_public_key"],
        )
    assert raised.value.code == semantics["pinned_expected_code"]


def test_malformed_bundles_are_rejected(vectors: dict):
    digest = vectors["expected"]["content_digest"]
    for bad in (b"", b"[1,2,3]", b'{"profile": "kdsig.ed25519"}', b"\xff\xfe"):
        with pytest.raises(KDNASignatureError):
            verify_signature_bundle(bad, digest)
    with pytest.raises(KDNASignatureError):
        parse_signature_bundle(b'{"profile": 5}')
