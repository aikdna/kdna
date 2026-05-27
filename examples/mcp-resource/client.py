#!/usr/bin/env python3
"""
KDNA MCP Resource Client — Conceptual Example

Shows how an MCP client (e.g. Claude Desktop, Cursor, or a custom agent)
would consume KDNA resources to enrich its judgment layer.
"""

import sys
import os
from pathlib import Path

# Add python-sdk to path if running without pip install
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "python-sdk"))

from server import KDNAResourceServer


def main():
    print("=" * 60)
    print("KDNA MCP Resource Client Demo")
    print("=" * 60)

    # Connect to "server" (in real use, this would be an MCP stdio/sse connection)
    asset_root = os.environ.get("KDNA_ASSET_ROOT", "./assets")
    server = KDNAResourceServer(asset_root)

    # Discover available KDNA assets
    print("\n--- Resource Discovery ---")
    resources = server.list_resources()
    for r in resources:
        print(f"  Found: {r['uri']}")

    if not resources:
        print(f"  No .kdna assets found under {asset_root}")
        return

    # Select first available asset
    uri = resources[0]["uri"]
    print(f"\n--- Loading Resource: {uri} ---")
    resource = server.read_resource(uri)
    print(f"  Loaded: {resource['name']} v{resource['version']}")
    print(f"  Context: {resource['context_length']} chars")

    # Scenarios to analyze
    scenarios = [
        """Team discussed the Q3 budget. Everyone agreed marketing needs more spend.
        No specific amount was decided. No owner assigned to draft the revised budget.""",

        """Decision: Migrate payment API to Stripe. Owner: Alex. Action: implement webhook handlers.
        Deadline: June 15. Contingent on security review completion by June 10.""",
    ]

    for i, scenario in enumerate(scenarios, 1):
        print(f"\n--- Scenario {i} ---")
        print(scenario.strip()[:80] + "...")

        # Build judgment prompt using KDNA resource
        judgment = server.get_judgment_prompt(uri, scenario)
        print(f"\n  Judgment prompt length: {judgment['prompt_length']} chars")
        print(f"  This prompt would be sent to the LLM with the KDNA context injected.")

    print("\n--- MCP Integration Pattern ---")
    print("""
In a real MCP setup:

1. The MCP server (this script) runs as a separate process
2. The client (Claude Desktop / Cursor / custom agent) connects via stdio or SSE
3. The client calls `resources/list` to discover available KDNA assets
4. The client calls `resources/read` to fetch the formatted context
5. The client injects the context into the LLM system prompt
6. The LLM now has KDNA-loaded judgment for all subsequent queries

Key principle:
  KDNA = Resource (provides judgment context)
  Tools = Action (perform tasks)
  They complement each other.
""")

    print("Done.")


if __name__ == "__main__":
    main()
