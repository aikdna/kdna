#!/usr/bin/env python3
"""
Custom Agent with KDNA — No framework required.

Shows how to integrate KDNA into any Python agent:
1. Load a canonical .kdna judgment asset
2. Inject into system prompt
3. Run judgment on user input
"""

import os
import json
from pathlib import Path

# Add parent to path if running without pip install
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from kdna import open_kdna, format_context, classify_input


class KDNAAgent:
    """A minimal agent that uses a `.kdna` asset for judgment."""

    def __init__(self, asset_path: str):
        self.domain = open_kdna(asset_path, mode="all")
        self.context = format_context(self.domain) if self.domain else ""
        self.history = []

    def system_prompt(self) -> str:
        return f"""You are an expert analyst with deep domain judgment.

Use the following domain cognition framework to analyze all inputs. Do not ignore it.

{self.context}

When analyzing any input:
1. First classify what kind of situation this is
2. Check for common misunderstandings
3. Apply the relevant framework
4. Run self-checks before finalizing your answer
5. State your classification explicitly

Be concise. Focus on judgment, not description."""

    def analyze(self, user_input: str) -> dict:
        """Analyze input using KDNA-loaded judgment."""

        # Detect what kind of input this is
        signals = classify_input(user_input)

        # Build the prompt
        prompt = f"""{self.system_prompt()}

---

USER INPUT:
{user_input}

Analyze this input using the loaded domain cognition. Provide:
1. Classification: What decision state or situation type is this?
2. Missing elements: What is missing if anything?
3. Misunderstandings detected: Any common errors in the input?
4. Recommended action: What should be done next?
5. Self-check: Did you verify all four operational commitment elements?"""

        # In a real implementation, this would call an LLM API
        # For demo purposes, we simulate the judgment process
        result = self._simulate_judgment(user_input, signals)

        self.history.append({
            "input": user_input,
            "signals": signals,
            "result": result,
        })

        return result

    def _simulate_judgment(self, user_input: str, signals: list) -> dict:
        """Simulate judgment based on KDNA domain rules (for demo without API)."""

        text_lower = user_input.lower()

        # Check for UNRESOLVED indicators
        unresolved_indicators = [
            "discussed", "we should", "someone should", "let's revisit",
            "we need more", "tbd", "no owner", "no deadline",
        ]
        has_unresolved = any(ind in text_lower for ind in unresolved_indicators)

        # Check for EXECUTABLE indicators
        executable_indicators = [
            "owner:", "deadline:", "by ", "will do", "responsible for",
        ]
        has_executable = any(ind in text_lower for ind in executable_indicators)

        # Check for CONDITIONAL indicators
        conditional_indicators = [
            "pending", "contingent on", "subject to", "if approved",
        ]
        has_conditional = any(ind in text_lower for ind in conditional_indicators)

        # Determine state
        if has_conditional and has_executable:
            state = "CONDITIONAL"
        elif has_executable and not has_unresolved:
            state = "EXECUTABLE_DECISION"
        elif has_unresolved and not has_executable:
            state = "UNRESOLVED"
        else:
            state = "UNRESOLVED"

        # Find missing elements
        missing = []
        if "owner" not in text_lower and "responsible" not in text_lower:
            missing.append("owner")
        if any(w in text_lower for w in ["soon", "later", "revisit", "tbd"]):
            missing.append("timing")
        if "discussed" in text_lower and "decided" not in text_lower:
            missing.append("explicit choice")

        # Check for misunderstandings
        misunderstandings = []
        if "agreed" in text_lower or "on the same page" in text_lower:
            misunderstandings.append(
                "Social agreement mistaken for commitment (MS-001)"
            )
        if "action items" in text_lower and missing:
            misunderstandings.append(
                "Action items without owners/deadlines (MS-002)"
            )

        return {
            "classification": state,
            "missing_elements": missing,
            "misunderstandings_detected": misunderstandings,
            "signals_detected": signals,
            "recommended_action": self._recommend_action(state, missing),
            "domain_loaded": self.domain is not None,
        }

    def _recommend_action(self, state: str, missing: list) -> str:
        if state == "UNRESOLVED":
            if missing:
                return f"Before execution: assign {', '.join(missing)}."
            return "Clarify what decision needs to be made and who decides."
        if state == "CONDITIONAL":
            return "Track conditions. Set reminder for condition verification."
        if state == "EXECUTABLE_DECISION":
            return "Proceed with execution. Monitor for blockers."
        return "Review and classify."


def main():
    print("=" * 60)
    print("KDNA Custom Agent Demo")
    print("=" * 60)

    # Set KDNA_ASSET to a local .kdna file, for example ./decision_state.kdna.
    asset_path = os.environ.get("KDNA_ASSET", "./decision_state.kdna")
    agent = KDNAAgent(asset_path)

    print(f"\nLoaded asset: {asset_path}")
    print(f"Context size: {len(agent.context)} chars")
    print()

    # Test scenarios
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

        result = agent.analyze(scenario)

        print(f"Classification: {result['classification']}")
        print(f"Missing: {result['missing_elements'] or 'None'}")
        print(f"Misunderstandings: {result['misunderstandings_detected'] or 'None detected'}")
        print(f"Recommendation: {result['recommended_action']}")
        print("-" * 40)

    print("\n=== History ===")
    for entry in agent.history:
        print(f"Input: {entry['input'][:50]}...")
        print(f"  -> {entry['result']['classification']}")


if __name__ == "__main__":
    main()
