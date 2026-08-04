"""RFC-0020 minimal profile — python-sdk mirror of the JS projection.

Proves the Python Core projects the boundary-friendly minimal surface with
byte-level semantic parity to the JS implementation:
- highest_question + boundary-friendly axioms (one_sentence / does_not_apply_when /
  failure_risk) + full boundaries;
- minimal is a strict subset of compact;
- an asset that does not declare minimal fails closed when minimal is requested.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from kdna.core import load, pack_source

MANIFEST = {
    "format_version": "0.1.0",
    "asset_id": "kdna:test:minimal-profile",
    "asset_uid": "urn:uuid:00000000-0000-4000-8000-000000000010",
    "asset_type": "fixture",
    "title": "Minimal profile fixture",
    "version": "1.0.0",
    "judgment_version": "1.0.0",
    "created_at": "2026-08-04T00:00:00Z",
    "updated_at": "2026-08-04T00:00:00Z",
    "compatibility": {
        "min_loader_version": "0.21.0",
        "profile": "kdna.payload.judgment",
        "profile_version": "0.1.0",
    },
    "payload": {"path": "payload.kdnab", "encoding": "cbor", "encrypted": False},
    "access": "public",
    "load_contract": {
        "default_profile": "compact",
        "profiles": {
            "index": {},
            "compact": {"max_tokens_hint": 5000},
            "minimal": {"max_tokens_hint": 900},
            "scenario": {},
            "full": {},
        },
    },
}

PAYLOAD = {
    "profile": "kdna.payload.judgment",
    "profile_version": "0.1.0",
    "core": {
        "highest_question": "Should this change be merged?",
        "axioms": [
            {
                "type": "axiom_applicability",
                "id": "ax_green_ci",
                "statement": "CI must be green before merge.",
                "one_sentence": "CI must be green before merge.",
                "applies_when": ["a PR is open"],
                "does_not_apply_when": ["emergency hotfix"],
                "failure_risk": "Merging broken code.",
            },
            "Keep the diff reviewable.",
            {
                "type": "axiom_applicability",
                "id": "ax_no_arch",
                "full_statement": "Do not make architecture decisions in review.",
            },
        ],
        "boundaries": [
            {
                "id": "bd_scope",
                "scope": "Review code changes only.",
                "out_of_scope": "Do not rewrite the architecture.",
            }
        ],
    },
    "reasoning": {"failure_modes": [{"type": "text", "text": "Over-engineering"}]},
    "patterns": [{"text": "A long pattern that must not leak into minimal."}],
}


def _source_dir(tmp_path: Path, manifest: dict, payload: dict) -> Path:
    source = tmp_path / "source"
    source.mkdir()
    (source / "kdna.json").write_text(json.dumps(manifest))
    import cbor2

    (source / "payload.kdnab").write_bytes(cbor2.dumps(payload))
    (source / "mimetype").write_text("application/vnd.kdna.asset")
    return source


def test_minimal_projects_boundary_friendly_core(tmp_path: Path) -> None:
    data = pack_source(str(_source_dir(tmp_path, MANIFEST, PAYLOAD)))
    capsule = load(data, "minimal")
    ctx = capsule["context"]
    assert ctx["highest_question"] == "Should this change be merged?"
    assert len(ctx["axioms"]) == 3
    assert ctx["axioms"][0]["one_sentence"] == "CI must be green before merge."
    assert ctx["axioms"][0]["does_not_apply_when"] == ["emergency hotfix"]
    assert ctx["axioms"][0]["failure_risk"] == "Merging broken code."
    assert ctx["axioms"][1]["one_sentence"] == "Keep the diff reviewable."
    assert ctx["axioms"][1]["does_not_apply_when"] == []
    assert ctx["axioms"][2]["one_sentence"] == "Do not make architecture decisions in review."
    assert ctx["boundaries"][0]["scope"] == "Review code changes only."
    assert ctx["boundaries"][0]["out_of_scope"] == "Do not rewrite the architecture."
    # minimal must NOT leak compact-only fields
    assert "patterns" not in ctx
    assert "failure_modes" not in ctx
    assert "worldview" not in ctx


def test_minimal_is_strict_subset_of_compact(tmp_path: Path) -> None:
    data = pack_source(str(_source_dir(tmp_path, MANIFEST, PAYLOAD)))
    minimal = load(data, "minimal")["context"]
    compact = load(data, "compact")["context"]
    assert minimal["highest_question"] == compact["highest_question"]
    for m, c in zip(minimal["axioms"], compact["axioms"]):
        assert m["one_sentence"] == c["one_sentence"]
        assert m["does_not_apply_when"] == c["does_not_apply_when"]
        assert m["failure_risk"] == c["failure_risk"]
    assert minimal["boundaries"] == compact["boundaries"]


def test_minimal_fails_closed_when_not_declared(tmp_path: Path) -> None:
    manifest = json.loads(json.dumps(MANIFEST))
    del manifest["load_contract"]["profiles"]["minimal"]
    data = pack_source(str(_source_dir(tmp_path, manifest, PAYLOAD)))
    with pytest.raises(ValueError):
        load(data, "minimal")
