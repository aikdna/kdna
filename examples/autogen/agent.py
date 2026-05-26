#!/usr/bin/env python3
"""
KDNA + AutoGen Integration Example

Shows how to use KDNA domain cognition as a shared judgment layer
in a Microsoft AutoGen multi-agent conversation.
"""

import os
import sys
from pathlib import Path

# Add python-sdk to path if running without pip install
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "python-sdk"))

from kdna import load_dev_source, format_context

# AutoGen imports
try:
    import autogen
except ImportError:
    print("Missing dependencies. Run: pip install -r requirements.txt")
    sys.exit(1)


def build_agents(kdna_context: str):
    """Build AutoGen agents with KDNA-loaded judgment.

    Roles:
    - Classifier: Classifies input into decision state
    - Validator: Detects missing elements and misunderstandings
    - Recommender: Recommends next steps
    """

    # LLM config
    llm_config = {
        "config_list": [
            {
                "model": "claude-3-5-sonnet-20241022",
                "api_key": os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN"),
                "api_type": "anthropic",
            }
        ],
        "temperature": 0.1,
    }

    # Agent 1: Classifier
    classifier = autogen.ConversableAgent(
        name="classifier",
        system_message=f"""You are a Decision State Classifier.

Your job is to classify any input into exactly one of these states:
- UNRESOLVED: Discussion without clear decision
- CONDITIONAL: Decision contingent on external condition
- INTENTIONAL_DEFERRAL: Explicitly postponed
- EXECUTABLE_DECISION: Clear decision with owner, action, and timing

Use this domain cognition framework:

{kdna_context}

When classifying:
1. Look for the four operational commitment elements (choice, owner, action, timing)
2. Check for common misunderstandings
3. State your classification with evidence
4. Run self-checks before answering

Reply with ONLY the classification and brief reasoning.""",
        llm_config=llm_config,
        human_input_mode="NEVER",
    )

    # Agent 2: Validator
    validator = autogen.ConversableAgent(
        name="validator",
        system_message=f"""You are a Decision Validator.

Your job is to verify whether a classification is correct and identify
what is missing from the input.

Use this domain cognition framework:

{kdna_context}

When validating:
1. Check if the classifier missed any signals
2. Identify missing elements (owner, timing, explicit choice)
3. Detect misunderstandings (social agreement vs commitment, etc.)
4. Flag any false actionization (treating UNRESOLVED as executable)

Reply with your validation and any corrections.""",
        llm_config=llm_config,
        human_input_mode="NEVER",
    )

    # Agent 3: Recommender
    recommender = autogen.ConversableAgent(
        name="recommender",
        system_message="""You are an Action Recommender.

Your job is to recommend the correct next step based on the classification
and validation provided by the other agents.

Rules:
- UNRESOLVED: Never recommend execution. Always push for clarification.
- CONDITIONAL: Track conditions, set reminders.
- INTENTIONAL_DEFERRAL: Schedule follow-up, do not treat as executable.
- EXECUTABLE_DECISION: Recommend proceeding with monitoring.

Reply with a clear, actionable recommendation.""",
        llm_config=llm_config,
        human_input_mode="NEVER",
    )

    # User proxy to drive the conversation
    user_proxy = autogen.UserProxyAgent(
        name="user_proxy",
        human_input_mode="NEVER",
        max_consecutive_auto_reply=3,
    )

    return classifier, validator, recommender, user_proxy


def analyze_scenario(scenario: str, kdna_context: str) -> str:
    """Run a scenario through the KDNA-loaded AutoGen group chat."""

    classifier, validator, recommender, user_proxy = build_agents(kdna_context)

    # Group chat with KDNA-loaded agents
    groupchat = autogen.GroupChat(
        agents=[classifier, validator, recommender],
        messages=[],
        max_round=4,
    )

    manager = autogen.GroupChatManager(
        groupchat=groupchat,
        llm_config={
            "config_list": [
                {
                    "model": "claude-3-5-sonnet-20241022",
                    "api_key": os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN"),
                    "api_type": "anthropic",
                }
            ],
            "temperature": 0.1,
        },
    )

    # Initiate chat
    user_proxy.initiate_chat(
        manager,
        message=f"""Analyze this meeting note and produce a classification, validation, and recommendation:

{scenario}

Classifier: classify the decision state.
Validator: check for missing elements and misunderstandings.
Recommender: suggest the correct next action.""",
    )

    # Extract the final summary from chat history
    summary = "\n".join([
        f"{msg['name']}: {msg['content'][:200]}..."
        for msg in groupchat.messages
        if msg.get("name")
    ])

    return summary


def main():
    print("=" * 60)
    print("KDNA + AutoGen Multi-Agent Judgment")
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
            print("\n--- Agent Conversation Summary ---")
            print(result)
        except Exception as e:
            print(f"Error: {e}")

        print("-" * 40)

    print("\nDone.")


if __name__ == "__main__":
    main()
