import hashlib
import json
import os
import subprocess
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


def run_cli(*arguments: str) -> None:
    command = os.environ.get("KDNA_CLI", "kdna").split()
    subprocess.run([*command, *arguments], check=True, capture_output=True, text=True)


@pytest.fixture()
def current_asset(tmp_path: Path) -> Path:
    source = tmp_path / "judgment"
    asset = tmp_path / "judgment.kdna"
    run_cli("demo", "judgment", str(source))
    run_cli("pack", str(source), str(asset))
    return asset


def test_inspect_and_open_return_toolchain_objects(current_asset: Path):
    info = inspect_kdna(str(current_asset))
    assert info["kdna_version"] == "1.0"
    assert info["payload"] == "payload.kdnab"

    capsule = open_kdna(str(current_asset), mode="minimum")
    assert capsule["type"] == "kdna.runtime-capsule"
    assert capsule["profile"] == "compact"
    assert capsule["trace"]["payload_encoding"] == "cbor"
    assert "highest_question" in capsule["context"]

    full = open_kdna(str(current_asset), mode="all")
    assert full["profile"] == "full"
    assert "payload" in full["context"]


def test_verify_digest_accepts_prefixed_and_bare_sha(current_asset: Path):
    digest = hashlib.sha256(current_asset.read_bytes()).hexdigest()
    assert verify_digest(str(current_asset), digest)["ok"] is True
    assert verify_digest(str(current_asset), f"sha256:{digest}")["ok"] is True
    assert verify_digest(str(current_asset), "0" * 64)["ok"] is False


def test_format_context_preserves_runtime_capsule(current_asset: Path):
    rendered = format_context(open_kdna(str(current_asset)))
    parsed = json.loads(rendered)
    assert parsed["type"] == "kdna.runtime-capsule"
    assert parsed["context"]["highest_question"]


def test_invalid_mode_raises(current_asset: Path):
    with pytest.raises(KDNAAssetError, match="Invalid load mode"):
        open_kdna(str(current_asset), mode="everything")


def test_load_dev_source_and_classify_input(tmp_path: Path):
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
