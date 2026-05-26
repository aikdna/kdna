#!/usr/bin/env python3
"""
KDNA + CrewAI Integration Example

Shows how to use KDNA domain cognition as a shared judgment layer
across multiple agents in a CrewAI crew.
"""

import os
import sys
from pathlib import Path

# Add python-sdk to path if running without pip install
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "python-sdk"))

from kdna import load_dev_source, format_context

# CrewAI imports
try:
    from crewai import Agent, Task, Crew, Process
    from langchain_anthropic import ChatAnthropic
except ImportError:
    print("Missing dependencies. Run: pip install -r requirements.txt")
    sys.exit(1)


def _get_llm():
    """Get Anthropic LLM if API key is available."""
    key = os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")
    if not key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN environment variable required"
        )
    return ChatAnthropic(
        model="claude-3-5-sonnet-20241022",
        anthropic_api_key=key,
    )


def build_crew(kdna_context: str):
    """Build a CrewAI crew where agents share KDNA-loaded judgment.

    Roles:
    - Signal Detector: Identifies what kind of input this is
    - Judgment Analyst: Applies KDNA axioms and frameworks
    - Action Recommender: Recommends next steps based on classification
    """

    llm = _get_llm()

    # Agent 1: Detects signals in the input
    signal_detector = Agent(
        role="Signal Detector",
        goal="Identify what kind of decision-state signal is present in the input",
        backstory="""You are an expert at reading between the lines of meeting notes,
        emails, and project updates. You detect whether something is truly decided,
        merely discussed, conditionally agreed, or intentionally deferred.""",
        llm=llm,
        verbose=True,
    )

    # Agent 2: Applies KDNA judgment
    judgment_analyst = Agent(
        role="Judgment Analyst",
        goal="Apply domain cognition to classify the input and detect misunderstandings",
        backstory=f"""You are an expert analyst with deep domain judgment.

Use the following domain cognition framework to analyze all inputs. Do not ignore it.

{kdna_context}

When analyzing any input:
1. First classify what kind of situation this is
2. Check for common misunderstandings
3. Apply the relevant framework
4. Run self-checks before finalizing your answer
5. State your classification explicitly

Be concise. Focus on judgment, not description.""",
        llm=llm,
        verbose=True,
    )

    # Agent 3: Recommends action
    action_recommender = Agent(
        role="Action Recommender",
        goal="Recommend the correct next step based on the classification",
        backstory="""You translate judgment into action. You never treat UNRESOLVED
        as executable. You always verify conditions before recommending execution.
        You know when to push for clarification versus when to proceed.""",
        llm=llm,
        verbose=True,
    )

    return signal_detector, judgment_analyst, action_recommender


def analyze_scenario(scenario: str, kdna_context: str) -> dict:
    """Run a scenario through the KDNA-loaded CrewAI crew."""

    detector, analyst, recommender = build_crew(kdna_context)

    # Task 1: Detect signals
    detect_task = Task(
        description=f"""Analyze this input and identify the decision-state signals:

{scenario}

List:
- What indicators of UNRESOLVED do you see?
- What indicators of EXECUTABLE do you see?
- What indicators of CONDITIONAL do you see?
- What indicators of INTENTIONAL_DEFERRAL do you see?""",
        expected_output="A structured list of detected signals with quotes from the input",
        agent=detector,
    )

    # Task 2: Apply judgment
    judge_task = Task(
        description=f"""Based on the signals detected, apply the KDNA domain cognition
        to classify this input and detect any misunderstandings:

{scenario}

Provide:
1. Classification (UNRESOLVED / CONDITIONAL / INTENTIONAL_DEFERRAL / EXECUTABLE_DECISION)
2. Missing elements (owner, timing, explicit choice, etc.)
3. Misunderstandings detected (with MS-xxx codes if applicable)
4. Which axioms and frameworks were triggered""",
        expected_output="A structured judgment with classification, missing elements, and triggered rules",
        agent=analyst,
        context=[detect_task],
    )

    # Task 3: Recommend action
    recommend_task = Task(
        description=f"""Based on the classification and missing elements, recommend
        the correct next action for this scenario:

{scenario}

Use the classification from the judgment analyst. Recommend:
- What should be done next
- What should NOT be done (dangerous missteps)
- Who needs to be involved""",
        expected_output="A clear, actionable recommendation with anti-patterns to avoid",
        agent=recommender,
        context=[judge_task],
    )

    # Assemble and run crew
    crew = Crew(
        agents=[detector, analyst, recommender],
        tasks=[detect_task, judge_task, recommend_task],
        process=Process.sequential,
        verbose=True,
    )

    result = crew.kickoff()
    return result


def main():
    print("=" * 60)
    print("KDNA + CrewAI Multi-Agent Judgment Crew")
    print("=" * 60)

    # Load KDNA domain
    source_dir = str(Path(__file__).parent.parent / "examples" / "decision_state")
    domain = load_dev_source(source_dir, mode="all")
    kdna_context = format_context(domain) if domain else ""

    print(f"\nLoaded domain: decision_state")
    print(f"Context size: {len(kdna_context)} chars")
    print()

    scenarios = [
        """Team discussed the Q3 budget. Everyone agreed marketing needs more spend.
        No specific amount was decided. No owner assigned to draft the revised budget.""",

        """Decision: Migrate payment API to Stripe. Owner: Alex. Action: implement webhook handlers.
        Deadline: June 15. Contingent on security review completion by June 10.""",

        """Sprint retrospective identified deployment issues. Tech lead said: 'We should look into CI/CD improvements.
        Let's revisit next sprint.' No owner, no date, no specific improvements listed.""",
    ]

    for i, scenario in enumerate(scenarios, 1):
        print(f"\n{'=' * 60}")
        print(f"Scenario {i}")
        print("=" * 60)
        print(scenario.strip()[:100] + "...")
        print()

        try:
            result = analyze_scenario(scenario, kdna_context)
            print("\n--- Crew Result ---")
            print(result)
        except Exception as e:
            print(f"Error: {e}")

        print("-" * 40)

    print("\nDone.")


if __name__ == "__main__":
    main()
