"""
KDNA Loader — Load canonical `.kdna` assets in Python.

The public entry point is `open_kdna()`. It reads the internal JSON entries
directly from the `.kdna` container and does not persistently extract the asset.
`load_dev_source()` remains available only for developer authoring workspaces.
"""

import hashlib
import json
import os
import zipfile
from pathlib import Path
from typing import Optional, Dict, Any, List

CORE_FILES = ["KDNA_Core.json", "KDNA_Patterns.json"]
OPTIONAL_FILES = [
    "KDNA_Scenarios.json",
    "KDNA_Cases.json",
    "KDNA_Reasoning.json",
    "KDNA_Evolution.json",
]


class KDNAAssetError(ValueError):
    """Raised when a `.kdna` asset cannot be opened or verified."""


def _load_json(path: Path) -> Optional[Dict[str, Any]]:
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _read_zip_json(zf: zipfile.ZipFile, entry_name: str) -> Optional[Dict[str, Any]]:
    try:
        with zf.open(entry_name) as entry:
            return json.loads(entry.read().decode("utf-8"))
    except KeyError:
        return None
    except (json.JSONDecodeError, UnicodeDecodeError, zipfile.BadZipFile) as exc:
        raise KDNAAssetError(f"Invalid JSON entry {entry_name}: {exc}") from exc


def verify_digest(asset_path: str, expected_digest: str) -> Dict[str, Any]:
    """
    Verify a `.kdna` whole-file digest.

    Args:
        asset_path: Path to a canonical `.kdna` asset.
        expected_digest: `sha256:<hex>` or bare hex digest.

    Returns:
        Dict with `ok`, `actual_digest`, and `expected_digest`.
    """
    path = Path(asset_path)
    if not path.is_file():
        raise KDNAAssetError(f"Asset not found: {asset_path}")

    actual = "sha256:" + hashlib.sha256(path.read_bytes()).hexdigest()
    expected = expected_digest if expected_digest.startswith("sha256:") else f"sha256:{expected_digest}"
    return {
        "ok": actual == expected,
        "actual_digest": actual,
        "expected_digest": expected,
    }


def inspect_kdna(asset_path: str) -> Dict[str, Any]:
    """
    Inspect a canonical `.kdna` asset without extracting it.

    Returns manifest metadata, entry names, required-entry status, and
    whole-file asset digest.
    """
    path = Path(asset_path)
    if not path.is_file():
        raise KDNAAssetError(f"Asset not found: {asset_path}")
    if path.suffix != ".kdna":
        raise KDNAAssetError(f"Expected a .kdna asset, got: {asset_path}")

    with zipfile.ZipFile(path, "r") as zf:
        entries = sorted(name for name in zf.namelist() if not name.endswith("/"))
        manifest = _read_zip_json(zf, "kdna.json")
        if not manifest:
            raise KDNAAssetError("Missing required entry: kdna.json")

    missing = [name for name in ["kdna.json", *CORE_FILES] if name not in entries]
    return {
        "name": manifest.get("name"),
        "version": manifest.get("version"),
        "access": manifest.get("access"),
        "status": manifest.get("status"),
        "quality_badge": manifest.get("quality_badge"),
        "risk_level": manifest.get("risk_level"),
        "entries": entries,
        "required_entries": ["kdna.json", *CORE_FILES],
        "missing_required_entries": missing,
        "asset_digest": "sha256:" + hashlib.sha256(path.read_bytes()).hexdigest(),
        "manifest": manifest,
    }


def open_kdna(asset_path: str, mode: str = "minimum") -> Dict[str, Any]:
    """
    Open a canonical `.kdna` asset directly.

    Args:
        asset_path: Path to a `.kdna` file.
        mode: 'minimum' (Core + Patterns only), 'all' (all standard entries),
              or 'auto' (currently equivalent to all available standard entries).

    Returns:
        Dict with `manifest`, `core`, `patterns`, optional entries, and
        `asset_info`.
    """
    info = inspect_kdna(asset_path)
    if info["missing_required_entries"]:
        missing = ", ".join(info["missing_required_entries"])
        raise KDNAAssetError(f"Missing required entries: {missing}")

    result: Dict[str, Any] = {"manifest": info["manifest"], "asset_info": info}
    with zipfile.ZipFile(asset_path, "r") as zf:
        result["core"] = _read_zip_json(zf, "KDNA_Core.json")
        result["patterns"] = _read_zip_json(zf, "KDNA_Patterns.json")

        if mode in ("all", "auto"):
            for fname in OPTIONAL_FILES:
                data = _read_zip_json(zf, fname)
                if data:
                    key = fname.replace("KDNA_", "").replace(".json", "").lower()
                    result[key] = data

    return result


def load_dev_source(source_dir: str, mode: str = "minimum") -> Optional[Dict[str, Any]]:
    """
    Load a non-canonical KDNA dev source workspace.

    Args:
        source_dir: Path to the dev source directory.
        mode: 'minimum' (Core + Patterns only), 'all' (all files),
              or 'auto' (load optional files based on input signals).

    Returns:
        Dict with 'core' and 'patterns' keys, or None if invalid.
    """
    dpath = Path(source_dir)
    if not dpath.is_dir():
        return None

    core = _load_json(dpath / "KDNA_Core.json")
    patterns = _load_json(dpath / "KDNA_Patterns.json")

    if not core or not patterns:
        return None

    result = {"core": core, "patterns": patterns}

    if mode == "all":
        for fname in OPTIONAL_FILES:
            data = _load_json(dpath / fname)
            if data:
                key = fname.replace("KDNA_", "").replace(".json", "").lower()
                result[key] = data
    elif mode == "auto":
        # Auto-load based on simple heuristics
        for fname in OPTIONAL_FILES:
            data = _load_json(dpath / fname)
            if data:
                key = fname.replace("KDNA_", "").replace(".json", "").lower()
                result[key] = data

    return result


def classify_input(text: str) -> List[str]:
    """
    Simple keyword-based classification of input text.
    Returns list of detected signal types.
    """
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

    if any(s in text_lower for s in scenario_signals):
        signals.append("scenario")
    if any(s in text_lower for s in reasoning_signals):
        signals.append("reasoning")
    if any(s in text_lower for s in case_signals):
        signals.append("case")
    if any(s in text_lower for s in evolution_signals):
        signals.append("evolution")

    return signals
