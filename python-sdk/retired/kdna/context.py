"""Formatting helpers for developer source and Runtime Capsules."""

import json

from typing import Dict, Any, List


def format_context(domain: Dict[str, Any]) -> str:
    """
    Format a loaded KDNA domain into a string suitable for agent context.

    Args:
        domain: Result from open_kdna() or load_dev_source().

    Returns:
        Formatted context string.
    """
    if not domain:
        return ""

    if domain.get("type") == "kdna.runtime-capsule":
        return json.dumps(domain, ensure_ascii=False, indent=2)

    parts = []
    core = domain.get("core") or {}
    patterns = domain.get("patterns") or {}
    manifest = domain.get("manifest") or {}
    reasoning = domain.get("reasoning") or {}

    # Meta
    meta = core.get("meta", {})
    if meta:
        parts.append(f"# Domain: {meta.get('domain', 'unknown')} v{meta.get('version', '?')}")
        parts.append(f"Purpose: {meta.get('purpose', '')}")
        parts.append(f"Load condition: {meta.get('load_condition', '')}")
        parts.append("")
    elif manifest:
        parts.append(f"# Domain: {manifest.get('name', 'unknown')} v{manifest.get('version', '?')}")
        if manifest.get("description"):
            parts.append(f"Purpose: {manifest['description']}")
        if core.get("highest_question"):
            parts.append(f"Highest question: {core['highest_question']}")
        parts.append("")

    # Axioms
    axioms = core.get("axioms", [])
    if axioms:
        parts.append("## Axioms")
        for ax in axioms:
            parts.append(f"- {ax.get('id', '')}: {ax.get('one_sentence', '')}")
        parts.append("")

    # Stances
    stances = core.get("stances", [])
    if stances:
        parts.append("## Stances")
        for s in stances:
            parts.append(f"- {s}")
        parts.append("")

    # Banned terms
    patterns_dict = patterns if isinstance(patterns, dict) else {}
    patterns_list = patterns if isinstance(patterns, list) else []

    banned = patterns_dict.get("terminology", {}).get("banned_terms", [])
    if banned:
        parts.append("## Banned Terms")
        for bt in banned:
            parts.append(f"- '{bt.get('term', '')}' -> use '{bt.get('replace_with', '')}'")
            parts.append(f"  Why: {bt.get('why', '')}")
        parts.append("")

    # Self checks
    checks = patterns_dict.get("self_check", []) or reasoning.get("self_checks", [])
    if checks:
        parts.append("## Self-Checks")
        for i, sc in enumerate(checks, 1):
            parts.append(f"{i}. {sc}")
        parts.append("")

    # Misunderstandings
    misunderstandings: List[Any] = patterns_dict.get("misunderstandings", []) or patterns_list
    if misunderstandings:
        parts.append("## Common Patterns")
        for m in misunderstandings:
            if isinstance(m, dict):
                if m.get("wrong") or m.get("correct"):
                    parts.append(f"- Wrong: {m.get('wrong', '')}")
                    parts.append(f"  Correct: {m.get('correct', '')}")
                else:
                    parts.append(f"- {m.get('id', '')}: {m.get('name') or m.get('one_sentence') or m.get('description', '')}")
                if m.get("key_distinction"):
                    parts.append(f"  Key distinction: {m['key_distinction']}")
                if m.get("failure_mode"):
                    parts.append(f"  Failure mode: {m['failure_mode']}")
            else:
                parts.append(f"- {m}")
            parts.append("")

    # Ontology
    ontology = core.get("ontology", [])
    if ontology:
        parts.append("## Key Concepts")
        for concept in ontology:
            parts.append(f"- {concept.get('id', '')}: {concept.get('one_sentence', '')}")
            if concept.get("trigger_signal"):
                parts.append(f"  Trigger: {concept['trigger_signal']}")
        parts.append("")

    # Frameworks
    frameworks = core.get("frameworks", [])
    if frameworks:
        parts.append("## Frameworks")
        for fw in frameworks:
            parts.append(f"- {fw.get('id', '')}: {fw.get('name', '')}")
            parts.append(f"  When: {fw.get('when_to_use', '')}")
            steps = fw.get("steps", [])
            if steps:
                parts.append("  Steps:")
                for step in steps:
                    if isinstance(step, dict):
                        label = step.get("name") or step.get("id") or ""
                        text = step.get("description") or step.get("one_sentence") or ""
                        parts.append(f"    - {label}: {text}".rstrip(": "))
                    else:
                        parts.append(f"    - {step}")
        parts.append("")

    return "\n".join(parts)
