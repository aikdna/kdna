#!/usr/bin/env python3
"""
KDNA + LangGraph Integration Example

Shows how to use KDNA domain cognition as a judgment layer
inside a LangGraph agent workflow.
"""

import os
import sys
from typing import Annotated, TypedDict
from pathlib import Path

# Add python-sdk to path if running without pip install
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "python-sdk"))

from kdna import load_dev_source, format_context, classify_input

# LangGraph imports
try:
    from langgraph.graph import StateGraph, END
    from langchain_anthropic import ChatAnthropic
except ImportError:
    print("Missing dependencies. Run: pip install -r requirements.txt")
    sys.exit(1)


# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------

class State(TypedDict):
    """Graph state carrying input and KDNA-loaded judgment."""
    input_text: str
    kdna_context: str
    signals: list[str]
    classification: str
    missing_elements: list[str]
    misunderstandings: list[str]
    judgment_trace: dict
    recommendation: str


# ---------------------------------------------------------------------------
# Nodes
# ---------------------------------------------------------------------------

def load_kdna_node(state: State) -> State:
    """Load KDNA decision_state domain and inject into state."""
    source_dir = Path(__file__).parent.parent / "examples" / "decision_state"
    domain = load_dev_source(str(source_dir), mode="all")
    context = format_context(domain) if domain else ""

    return {
        **state,
        "kdna_context": context,
        "judgment_trace": {
            "loaded_package": domain.get("core", {}).get("meta", {}).get("domain", "unknown") if domain else None,
            "version": domain.get("core", {}).get("meta", {}).get("version", "?") if domain else None,
        },
    }


def classify_node(state: State) -> State:
    """Classify input using KDNA signal detection."""
    signals = classify_input(state["input_text"])
    return {**state, "signals": signals}


def judge_node(state: State) -> State:
    """Apply KDNA judgment: classify state, find missing elements, detect misunderstandings."""
    text = state["input_text"].lower()
    context = state["kdna_context"]

    # Use an LLM if available, otherwise simulate
    llm = _get_llm()
    if llm and context:
        result = _judge_with_llm(llm, state["input_text"], context)
    else:
        result = _simulate_judgment(text)

    trace = state.get("judgment_trace", {})
    trace["triggered_frameworks"] = result.get("frameworks", [])
    trace["triggered_axioms"] = result.get("axioms", [])
    trace["self_checks_passed"] = result.get("self_checks", [])

    return {
        **state,
        "classification": result["classification"],
        "missing_elements": result["missing_elements"],
        "misunderstandings": result["misunderstandings"],
        "judgment_trace": trace,
    }


def recommend_node(state: State) -> State:
    """Recommend action based on classification."""
    classification = state["classification"]
    missing = state["missing_elements"]

    if classification == "UNRESOLVED":
        if missing:
            rec = f"Before execution: assign {', '.join(missing)}."
        else:
            rec = "Clarify what decision needs to be made and who decides."
    elif classification == "CONDITIONAL":
        rec = "Track conditions. Set reminder for condition verification."
    elif classification == "EXECUTABLE_DECISION":
        rec = "Proceed with execution. Monitor for blockers."
    elif classification == "INTENTIONAL_DEFERRAL":
        rec = "Schedule follow-up. Do not treat as executable until deferral expires."
    else:
        rec = "Review and classify."

    return {**state, "recommendation": rec}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_llm():
    """Get Anthropic LLM if API key is available."""
    key = os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")
    if key:
        return ChatAnthropic(
            model="claude-3-5-sonnet-20241022",
            anthropic_api_key=key,
        )
    return None


def _judge_with_llm(llm, user_input: str, context: str) -> dict:
    """Use LLM with KDNA context to perform judgment."""
    prompt = f"""{context}

---

USER INPUT:
{user_input}

Analyze this input using the loaded domain cognition.

Respond in JSON:
{{
  "classification": "UNRESOLVED|CONDITIONAL|INTENTIONAL_DEFERRAL|EXECUTABLE_DECISION",
  "missing_elements": ["owner", "timing", "explicit choice", ...],
  "misunderstandings": ["description (MS-xxx)", ...],
  "frameworks": ["FW-xxx"],
  "axioms": ["AX-xxx"],
  "self_checks": ["SC-x"]
}}
"""
    response = llm.invoke(prompt)
    # In a real implementation, parse JSON from response.content
    # For demo, fall through to simulation
    return _simulate_judgment(user_input.lower())


def _simulate_judgment(text: str) -> dict:
    """Simulate KDNA judgment without LLM (for demo)."""
    unresolved_indicators = [
        "discussed", "we should", "someone should", "let's revisit",
        "we need more", "tbd", "no owner", "no deadline",
    ]
    has_unresolved = any(ind in text for ind in unresolved_indicators)

    executable_indicators = ["owner:", "deadline:", "by ", "will do", "responsible for"]
    has_executable = any(ind in text for ind in executable_indicators)

    conditional_indicators = ["pending", "contingent on", "subject to", "if approved"]
    has_conditional = any(ind in text for ind in conditional_indicators)

    deferral_indicators = ["revisit", "defer", "postpone", "table for now"]
    has_deferral = any(ind in text for ind in deferral_indicators)

    if has_conditional and has_executable:
        classification = "CONDITIONAL"
    elif has_executable and not has_unresolved:
        classification = "EXECUTABLE_DECISION"
    elif has_deferral and not has_executable:
        classification = "INTENTIONAL_DEFERRAL"
    elif has_unresolved and not has_executable:
        classification = "UNRESOLVED"
    else:
        classification = "UNRESOLVED"

    missing = []
    if "owner" not in text and "responsible" not in text:
        missing.append("owner")
    if any(w in text for w in ["soon", "later", "revisit", "tbd"]):
        missing.append("timing")
    if "discussed" in text and "decided" not in text:
        missing.append("explicit choice")

    misunderstandings = []
    if "agreed" in text or "on the same page" in text:
        misunderstandings.append("Social agreement mistaken for commitment (MS-001)")
    if "action items" in text and missing:
        misunderstandings.append("Action items without owners/deadlines (MS-002)")

    frameworks = []
    axioms = []
    self_checks = []

    if classification == "UNRESOLVED":
        frameworks.append("FW-001")
        axioms.append("AX-001")
        self_checks.append("SC-1")
    if classification == "CONDITIONAL":
        frameworks.append("FW-003")
        axioms.append("AX-003")
        self_checks.append("SC-4")
    if has_deferral:
        frameworks.append("FW-002")
        axioms.append("AX-004")
        self_checks.append("SC-5")

    return {
        "classification": classification,
        "missing_elements": missing,
        "misunderstandings": misunderstandings,
        "frameworks": frameworks,
        "axioms": axioms,
        "self_checks": self_checks,
    }


# ---------------------------------------------------------------------------
# Build Graph
# ---------------------------------------------------------------------------

def build_graph():
    """Build and compile the KDNA + LangGraph judgment workflow."""
    builder = StateGraph(State)

    builder.add_node("load_kdna", load_kdna_node)
    builder.add_node("classify", classify_node)
    builder.add_node("judge", judge_node)
    builder.add_node("recommend", recommend_node)

    builder.set_entry_point("load_kdna")
    builder.add_edge("load_kdna", "classify")
    builder.add_edge("classify", "judge")
    builder.add_edge("judge", "recommend")
    builder.add_edge("recommend", END)

    return builder.compile()


# ---------------------------------------------------------------------------
# Demo
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("KDNA + LangGraph Judgment Agent")
    print("=" * 60)

    graph = build_graph()

    scenarios = [
        """Team discussed the Q3 budget. Everyone agreed marketing needs more spend.
        No specific amount was decided. No owner assigned to draft the revised budget.""",

        """Decision: Migrate payment API to Stripe. Owner: Alex. Action: implement webhook handlers.
        Deadline: June 15. Contingent on security review completion by June 10.""",

        """Sprint retrospective identified deployment issues. Tech lead said: 'We should look into CI/CD improvements.
        Let's revisit next sprint.' No owner, no date, no specific improvements listed.""",
    ]

    for i, scenario in enumerate(scenarios, 1):
        print(f"\n--- Scenario {i} ---")
        print(scenario.strip()[:100] + "...")
        print()

        result = graph.invoke({"input_text": scenario})

        print(f"Classification: {result['classification']}")
        print(f"Missing: {result['missing_elements'] or 'None'}")
        print(f"Misunderstandings: {result['misunderstandings'] or 'None detected'}")
        print(f"Recommendation: {result['recommendation']}")

        trace = result.get("judgment_trace", {})
        print(f"Trace: loaded={trace.get('loaded_package')}, "
              f"frameworks={trace.get('triggered_frameworks', [])}, "
              f"axioms={trace.get('triggered_axioms', [])}")
        print("-" * 40)

    print("\nDone.")


if __name__ == "__main__":
    main()
