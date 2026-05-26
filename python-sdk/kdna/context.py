"""
KDNA Context Formatter — Format loaded domain into agent-readable context.
"""

from typing import Dict, Any, Optional


def format_context(domain: Dict[str, Any]) -> str:
    """
    Format a loaded KDNA domain into a string suitable for agent context.

    Args:
        domain: Result from load_dev_source().

    Returns:
        Formatted context string.
    """
    if not domain:
        return ""

    parts = []
    core = domain.get("core", {})
    patterns = domain.get("patterns", {})

    # Meta
    meta = core.get("meta", {})
    if meta:
        parts.append(f"# Domain: {meta.get('domain', 'unknown')} v{meta.get('version', '?')}")
        parts.append(f"Purpose: {meta.get('purpose', '')}")
        parts.append(f"Load condition: {meta.get('load_condition', '')}")
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
    banned = patterns.get("terminology", {}).get("banned_terms", [])
    if banned:
        parts.append("## Banned Terms")
        for bt in banned:
            parts.append(f"- '{bt.get('term', '')}' -> use '{bt.get('replace_with', '')}'")
            parts.append(f"  Why: {bt.get('why', '')}")
        parts.append("")

    # Self checks
    checks = patterns.get("self_check", [])
    if checks:
        parts.append("## Self-Checks")
        for i, sc in enumerate(checks, 1):
            parts.append(f"{i}. {sc}")
        parts.append("")

    # Misunderstandings
    misunderstandings = patterns.get("misunderstandings", [])
    if misunderstandings:
        parts.append("## Common Misunderstandings")
        for m in misunderstandings:
            parts.append(f"- Wrong: {m.get('wrong', '')}")
            parts.append(f"  Correct: {m.get('correct', '')}")
            if m.get("key_distinction"):
                parts.append(f"  Key distinction: {m['key_distinction']}")
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
                    parts.append(f"    - {step}")
        parts.append("")

    return "\n".join(parts)
