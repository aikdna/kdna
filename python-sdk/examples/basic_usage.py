#!/usr/bin/env python3
"""
Basic KDNA Python SDK usage example.
"""

from kdna import load_dev_source, format_context

# Load the decision_state dev source
domain = load_dev_source("../../examples/decision_state", mode="all")

if domain:
    print("Domain loaded successfully!")
    print(f"Axioms: {len(domain['core'].get('axioms', []))}")
    print(f"Misunderstandings: {len(domain['patterns'].get('misunderstandings', []))}")
    print()

    # Format context for an agent
    context = format_context(domain)
    print(f"Context length: {len(context)} characters")
    print()
    print("--- First 500 characters ---")
    print(context[:500])
else:
    print("Failed to load domain.")
