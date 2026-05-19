"""
KDNA Loader — Load domain cognition packages in Python.
"""

import json
import os
from pathlib import Path
from typing import Optional, Dict, Any, List

CORE_FILES = ["KDNA_Core.json", "KDNA_Patterns.json"]
OPTIONAL_FILES = [
    "KDNA_Scenarios.json",
    "KDNA_Cases.json",
    "KDNA_Reasoning.json",
    "KDNA_Evolution.json",
]


def _load_json(path: Path) -> Optional[Dict[str, Any]]:
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_domain(domain_dir: str, mode: str = "minimum") -> Optional[Dict[str, Any]]:
    """
    Load a KDNA domain directory.

    Args:
        domain_dir: Path to the domain directory.
        mode: 'minimum' (Core + Patterns only), 'all' (all files),
              or 'auto' (load optional files based on input signals).

    Returns:
        Dict with 'core' and 'patterns' keys, or None if invalid.
    """
    dpath = Path(domain_dir)
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
