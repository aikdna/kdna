"""KDNA Python adapter.

This module never opens a ``.kdna`` container itself. It delegates inspection,
LoadPlan evaluation, authorization, and loading to the installed KDNA CLI and
returns the Runtime Capsule emitted by Core.

``load_dev_source`` remains a developer-only helper for loose authoring source;
it is not an Agent consumption path.
"""

import hashlib
import json
import os
import re
import shlex
import subprocess
from functools import lru_cache
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple

CORE_FILES = ["KDNA_Core.json", "KDNA_Patterns.json"]
OPTIONAL_FILES = [
    "KDNA_Scenarios.json",
    "KDNA_Cases.json",
    "KDNA_Reasoning.json",
    "KDNA_Evolution.json",
]
ALLOWED_MODES = {"minimum", "all", "auto"}
MODE_TO_PROFILE = {"minimum": "compact", "all": "full", "auto": "compact"}
CLI_COMPATIBILITY = ">=0.34.0,<0.35.0"
_MINIMUM_CLI_VERSION_PARTS = (0, 34, 0)
_MAXIMUM_CLI_VERSION_PARTS = (0, 35, 0)
_CLI_VERSION_PATTERN = re.compile(r"^(\d+)\.(\d+)\.(\d+)$")


class KDNAAssetError(ValueError):
    """Raised when the official KDNA toolchain rejects an asset operation."""


def _load_json(path: Path) -> Optional[Dict[str, Any]]:
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


def _asset_digest(path: Path) -> str:
    return "sha256:" + hashlib.sha256(path.read_bytes()).hexdigest()


def _validate_mode(mode: str) -> None:
    if mode not in ALLOWED_MODES:
        allowed = ", ".join(sorted(ALLOWED_MODES))
        raise KDNAAssetError(f"Invalid load mode {mode!r}; expected one of: {allowed}")


def _cli_command() -> Tuple[str, ...]:
    command = tuple(shlex.split(os.environ.get("KDNA_CLI", "kdna")))
    if not command:
        raise KDNAAssetError("KDNA_CLI is empty")
    return command


def _invoke_cli(
    command: Tuple[str, ...], arguments: List[str]
) -> subprocess.CompletedProcess:
    try:
        return subprocess.run(
            [*command, *arguments],
            check=False,
            capture_output=True,
            encoding="utf-8",
        )
    except FileNotFoundError as exc:
        raise KDNAAssetError(
            "KDNA CLI not found. Install it with: npm install -g @aikdna/kdna-cli"
        ) from exc


@lru_cache(maxsize=4)
def _require_compatible_cli(command: Tuple[str, ...]) -> str:
    completed = _invoke_cli(command, ["--version"])
    if completed.returncode != 0:
        detail = completed.stderr.strip() or completed.stdout.strip()
        raise KDNAAssetError(
            f"KDNA CLI version check failed (exit {completed.returncode}): {detail}"
        )

    version = completed.stdout.strip()
    match = _CLI_VERSION_PATTERN.fullmatch(version)
    if match is None:
        raise KDNAAssetError(f"KDNA CLI returned an invalid version: {version!r}")

    version_parts = tuple(int(part) for part in match.groups())
    if not _MINIMUM_CLI_VERSION_PARTS <= version_parts < _MAXIMUM_CLI_VERSION_PARTS:
        raise KDNAAssetError(
            f"KDNA CLI {version} is unsupported; required range: {CLI_COMPATIBILITY}"
        )
    return version


def _run_cli(arguments: List[str]) -> Dict[str, Any]:
    command = _cli_command()
    _require_compatible_cli(command)
    completed = _invoke_cli(command, arguments)

    if completed.returncode != 0:
        detail = completed.stderr.strip() or completed.stdout.strip()
        raise KDNAAssetError(
            f"KDNA toolchain command failed (exit {completed.returncode}): {detail}"
        )
    try:
        value = json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        raise KDNAAssetError("KDNA toolchain did not return JSON") from exc
    if not isinstance(value, dict):
        raise KDNAAssetError("KDNA toolchain returned an unexpected JSON value")
    return value


def verify_digest(asset_path: str, expected_digest: str) -> Dict[str, Any]:
    """Verify the digest of the opaque ``.kdna`` file bytes."""
    path = Path(asset_path)
    if not path.is_file():
        raise KDNAAssetError(f"Asset not found: {asset_path}")

    actual = _asset_digest(path)
    expected = expected_digest if expected_digest.startswith("sha256:") else f"sha256:{expected_digest}"
    return {
        "ok": actual == expected,
        "actual_digest": actual,
        "expected_digest": expected,
    }


def inspect_kdna(asset_path: str) -> Dict[str, Any]:
    """Return public metadata through ``kdna inspect``."""
    metadata = _run_cli(["inspect", asset_path, "--json"])
    required = ("format_version", "asset_id", "version", "payload")
    missing = [field for field in required if not metadata.get(field)]
    if missing:
        raise KDNAAssetError(
            "KDNA inspect response is missing required fields: " + ", ".join(missing)
        )
    return metadata


def open_kdna(asset_path: str, mode: str = "minimum") -> Dict[str, Any]:
    """Plan and load an asset through Core, returning a Runtime Capsule.

    ``minimum`` selects the compact Capsule profile, ``all`` selects the full
    developer/application profile, and ``auto`` selects compact. Applications
    needing password, receipt, account, organization, or remote authorization
    should invoke the corresponding CLI/API authorization flow explicitly.
    """
    _validate_mode(mode)
    plan = _run_cli(["plan-load", asset_path, "--json"])
    if plan.get("can_load_now") is not True:
        state = plan.get("state", "unknown")
        action = plan.get("required_action", "unknown")
        raise KDNAAssetError(
            f"KDNA LoadPlan does not permit loading (state={state}, required_action={action})"
        )

    capsule = _run_cli(
        ["load", asset_path, f"--profile={MODE_TO_PROFILE[mode]}", "--as=json"]
    )
    if capsule.get("type") != "kdna.runtime-capsule":
        raise KDNAAssetError("returned capsule has an unknown type")
    return capsule


def load_dev_source(source_dir: str, mode: str = "minimum") -> Optional[Dict[str, Any]]:
    """Load a loose developer source workspace, never a distribution asset."""
    _validate_mode(mode)
    directory = Path(source_dir)
    if not directory.is_dir():
        return None

    core = _load_json(directory / "KDNA_Core.json")
    patterns = _load_json(directory / "KDNA_Patterns.json")
    if not core or not patterns:
        return None

    result = {"core": core, "patterns": patterns}
    if mode in ("all", "auto"):
        for filename in OPTIONAL_FILES:
            data = _load_json(directory / filename)
            if data:
                key = filename.replace("KDNA_", "").replace(".json", "").lower()
                result[key] = data
    return result


def classify_input(text: str) -> List[str]:
    """Return simple scenario/reasoning/case/evolution routing signals."""
    text_lower = text.lower()
    signals = []

    scenario_signals = [
        "scenario", "situation", "case", "example", "what if",
        "when", "假设", "场景", "情况", "案例",
    ]
    reasoning_signals = [
        "why", "how", "reason", "explain", "because",
        "为什么", "怎么", "原因", "解释", "因为",
    ]
    case_signals = [
        "case study", "real world", "incident", "post-mortem",
        "case", "实例", "真实", "事故",
    ]
    evolution_signals = [
        "evolve", "improve", "mature", "growth", "progression",
        "演变", "进化", "改进", "成熟",
    ]

    if any(signal in text_lower for signal in scenario_signals):
        signals.append("scenario")
    if any(signal in text_lower for signal in reasoning_signals):
        signals.append("reasoning")
    if any(signal in text_lower for signal in case_signals):
        signals.append("case")
    if any(signal in text_lower for signal in evolution_signals):
        signals.append("evolution")

    return signals
