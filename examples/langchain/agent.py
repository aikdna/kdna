#!/usr/bin/env python3
"""
KDNA + LangChain Integration Example

Shows how to use KDNA domain cognition as a judgment layer
in a LangChain pipeline.
"""

import os
import sys
from pathlib import Path

# Add python-sdk to path if running without pip install
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "python-sdk"))

from kdna import load_domain, format_context

# LangChain imports
try:
    from langchain_anthropic import ChatAnthropic
    from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
    from langchain_core.output_parsers import StrOutputParser
except ImportError:
    print("Missing dependencies. Run: pip install -r requirements.txt")
    sys.exit(1)


def build_judgment_chain(domain_dir: str):
    """Build a LangChain chain that uses KDNA-loaded judgment.

    The chain injects KDNA domain cognition into the system prompt,
    then classifies the input and produces a structured judgment.
    """
    # Load KDNA domain
    domain = load_domain(domain_dir, mode="all")
    context = format_context(domain) if domain else ""

    # Build prompt with KDNA context as system message
    system_template = f"""You are an expert analyst with deep domain judgment.

Use the following domain cognition framework to analyze all inputs. Do not ignore it.

{context}

When analyzing any input:
1. First classify what kind of situation this is
2. Check for common misunderstandings
3. Apply the relevant framework
4. Run self-checks before finalizing your answer
5. State your classification explicitly

Be concise. Focus on judgment, not description."""

    prompt = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(system_template),
        HumanMessagePromptTemplate.from_template("""USER INPUT:
{input}

Analyze this input using the loaded domain cognition. Provide:
1. Classification: What decision state or situation type is this?
2. Missing elements: What is missing if anything?
3. Misunderstandings detected: Any common errors in the input?
4. Recommended action: What should be done next?
5. Self-check: Did you verify all four operational commitment elements?""")
    ])

    # Initialize LLM
    llm = _get_llm()

    # Build chain: prompt -> llm -> output parser
    chain = prompt | llm | StrOutputParser()

    return chain


def build_naive_chain():
    """Build a chain WITHOUT KDNA for comparison.

    This chain has no domain cognition loaded. It relies entirely
    on the LLM's base knowledge, producing generic summaries.
    """
    system_template = """You are a helpful assistant. Summarize the input and suggest next steps."""

    prompt = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(system_template),
        HumanMessagePromptTemplate.from_template("{input}")
    ])

    llm = _get_llm()
    chain = prompt | llm | StrOutputParser()
    return chain


def _get_llm():
    """Get Anthropic LLM if API key is available, else raise."""
    key = os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")
    if not key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN environment variable required"
        )
    return ChatAnthropic(
        model="claude-3-5-sonnet-20241022",
        anthropic_api_key=key,
    )


def main():
    print("=" * 60)
    print("KDNA + LangChain Judgment Chain")
    print("=" * 60)

    domain_dir = str(Path(__file__).parent.parent / "examples" / "decision_state")

    # Build both chains
    kdna_chain = build_judgment_chain(domain_dir)
    naive_chain = build_naive_chain()

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

        print("WITHOUT KDNA:")
        try:
            naive_result = naive_chain.invoke({"input": scenario})
            print(naive_result[:300])
        except Exception as e:
            print(f"Error: {e}")

        print("\nWITH KDNA:")
        try:
            kdna_result = kdna_chain.invoke({"input": scenario})
            print(kdna_result[:500])
        except Exception as e:
            print(f"Error: {e}")

        print("-" * 40)

    print("\nDone.")


if __name__ == "__main__":
    main()
