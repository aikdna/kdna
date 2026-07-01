import hashlib
import json
import zipfile
from pathlib import Path

import pytest

from kdna import (
    KDNAAssetError,
    classify_input,
    format_context,
    inspect_kdna,
    load_dev_source,
    open_kdna,
    verify_digest,
)


REPO_ROOT = Path(__file__).resolve().parents[2]
LEGACY_FIXTURE = REPO_ROOT / "fixtures" / "test_conformance.kdna"


def test_inspect_and_open_legacy_entry_asset():
    info = inspect_kdna(str(LEGACY_FIXTURE))

    assert info["name"] == "@test/conformance"
    assert info["missing_required_entries"] == []
    assert info["required_entries"] == ["kdna.json", "KDNA_Core.json", "KDNA_Patterns.json"]
    assert "KDNA_Core.json" in info["entries"]
    assert info["asset_digest"].startswith("sha256:")

    domain = open_kdna(str(LEGACY_FIXTURE), mode="all")
    assert domain["manifest"]["name"] == "@test/conformance"
    assert domain["core"]["meta"]["domain"] == "@test/conformance"
    assert domain["patterns"]["misunderstandings"][0]["wrong"] == "Digest computation is optional."


def test_verify_digest_accepts_prefixed_and_bare_sha():
    digest = hashlib.sha256(LEGACY_FIXTURE.read_bytes()).hexdigest()

    assert verify_digest(str(LEGACY_FIXTURE), digest)["ok"] is True
    assert verify_digest(str(LEGACY_FIXTURE), f"sha256:{digest}")["ok"] is True
    assert verify_digest(str(LEGACY_FIXTURE), "0" * 64)["ok"] is False


def test_format_context_for_legacy_entries():
    context = format_context(open_kdna(str(LEGACY_FIXTURE), mode="all"))

    assert "# Domain: @test/conformance v1.0" in context
    assert "Test axiom for conformance." in context
    assert "Digest computation is optional." in context


def test_payload_profile_asset_loads_minimum_and_all_modes(tmp_path):
    asset_path = tmp_path / "payload-profile.kdna"
    write_payload_profile_asset(asset_path)

    info = inspect_kdna(str(asset_path))
    assert info["required_entries"] == ["kdna.json", "payload.kdnab"]
    assert info["missing_required_entries"] == []
    assert info["payload_profile"] == "judgment-profile-v1"

    minimum = open_kdna(str(asset_path), mode="minimum")
    assert minimum["payload_profile"] == "judgment-profile-v1"
    assert minimum["core"]["highest_question"] == "Should this decision ship?"
    assert minimum["patterns"][0]["wrong"] == "Assuming tests are optional."
    assert "scenarios" not in minimum

    full = open_kdna(str(asset_path), mode="all")
    assert full["scenarios"][0]["id"] == "scenario-1"
    assert full["reasoning"]["self_checks"] == ["Did we verify the artifact?"]

    context = format_context(full)
    assert "# Domain: @test/payload-profile v0.1.0" in context
    assert "Highest question: Should this decision ship?" in context
    assert "Assuming tests are optional." in context
    assert "Did we verify the artifact?" in context


def test_invalid_mode_raises():
    with pytest.raises(KDNAAssetError, match="Invalid load mode"):
        open_kdna(str(LEGACY_FIXTURE), mode="everything")


def test_load_dev_source_and_classify_input(tmp_path):
    source = tmp_path / "source"
    source.mkdir()
    (source / "KDNA_Core.json").write_text(
        json.dumps({"meta": {"domain": "dev-source"}, "axioms": []}),
        encoding="utf-8",
    )
    (source / "KDNA_Patterns.json").write_text(
        json.dumps({"misunderstandings": [], "self_check": []}),
        encoding="utf-8",
    )
    (source / "KDNA_Scenarios.json").write_text(
        json.dumps({"scenes": []}),
        encoding="utf-8",
    )

    domain = load_dev_source(str(source), mode="all")

    assert domain is not None
    assert domain["core"]
    assert domain["patterns"]
    assert domain["scenarios"] == {"scenes": []}
    assert classify_input("What if this real world incident happens, and why?") == [
        "scenario",
        "reasoning",
        "case",
    ]


def write_payload_profile_asset(path: Path) -> None:
    manifest = {
        "format": "kdna-v1",
        "format_version": "1.0",
        "name": "@test/payload-profile",
        "version": "0.1.0",
        "access": "public",
        "status": "experimental",
        "quality_badge": "test",
    }
    payload = {
        "profile": "judgment-profile-v1",
        "core": {
            "highest_question": "Should this decision ship?",
            "axioms": [
                {
                    "id": "axiom-1",
                    "one_sentence": "Evidence beats optimism.",
                }
            ],
            "stances": ["Prefer verified artifacts over status claims."],
            "ontology": [],
            "frameworks": [],
        },
        "patterns": [
            {
                "id": "pattern-1",
                "wrong": "Assuming tests are optional.",
                "correct": "Treat tests as release evidence.",
                "key_distinction": "Confidence is not evidence.",
            }
        ],
        "scenarios": [{"id": "scenario-1", "trigger": "Before release"}],
        "cases": [{"id": "case-1", "scenario": "A release candidate"}],
        "reasoning": {"self_checks": ["Did we verify the artifact?"]},
        "evolution": {"version_history": []},
    }

    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("mimetype", "application/vnd.kdna")
        zf.writestr("kdna.json", json.dumps(manifest))
        zf.writestr("payload.kdnab", json.dumps(payload))
        zf.writestr("checksums.json", "{}")
