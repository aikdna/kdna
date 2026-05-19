#!/usr/bin/env python3
"""
KDNA as MCP Resource — Conceptual Example

Shows how KDNA domain packages can be served as MCP Resources,
making judgment cognition available to any MCP-compatible client.

Architecture:
- KDNA = Resource layer (provides judgment context)
- Tools = Action layer (perform tasks using that context)
- KDNA does NOT compete with MCP tools. It enriches them.
"""

import json
import sys
from pathlib import Path

# Add python-sdk to path if running without pip install
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "python-sdk"))

from kdna import load_domain, format_context

# ---------------------------------------------------------------------------
# In-memory "MCP Server" — conceptual implementation
# ---------------------------------------------------------------------------

class KDNAResourceServer:
    """Serves KDNA domain packages as MCP-style resources.

    In a real implementation, this would use the official MCP SDK:
    https://github.com/modelcontextprotocol/python-sdk

    This conceptual version shows the data model and resource schema.
    """

    def __init__(self, domains_dir: str):
        self.domains_dir = Path(domains_dir)
        self.loaded = {}

    def list_resources(self) -> list[dict]:
        """Return list of available KDNA resources."""
        resources = []
        for domain_dir in self.domains_dir.iterdir():
            if domain_dir.is_dir() and (domain_dir / "KDNA_Core.json").exists():
                domain = load_domain(str(domain_dir), mode="minimum")
                if domain:
                    meta = domain.get("core", {}).get("meta", {})
                    resources.append({
                        "uri": f"kdna://{meta.get('domain', domain_dir.name)}",
                        "name": meta.get("domain", domain_dir.name),
                        "description": meta.get("purpose", ""),
                        "mimeType": "application/json",
                    })
        return resources

    def read_resource(self, uri: str) -> dict:
        """Read a KDNA resource by URI.

        Returns the formatted context suitable for injection into
        an agent's system prompt.
        """
        # Parse URI: kdna://domain-name
        domain_name = uri.replace("kdna://", "")

        domain_dir = self.domains_dir / domain_name
        if not domain_dir.exists():
            # Try fuzzy match
            for d in self.domains_dir.iterdir():
                if d.is_dir():
                    domain = load_domain(str(d), mode="minimum")
                    if domain:
                        meta = domain.get("core", {}).get("meta", {})
                        if meta.get("domain") == domain_name:
                            domain_dir = d
                            break

        domain = load_domain(str(domain_dir), mode="all")
        if not domain:
            return {"error": f"Domain not found: {domain_name}"}

        context = format_context(domain)
        meta = domain.get("core", {}).get("meta", {})

        return {
            "uri": uri,
            "name": meta.get("domain", domain_name),
            "version": meta.get("version", "?"),
            "purpose": meta.get("purpose", ""),
            "context": context,
            "context_length": len(context),
            "axioms_count": len(domain.get("core", {}).get("axioms", [])),
            "misunderstandings_count": len(domain.get("patterns", {}).get("misunderstandings", [])),
        }

    def get_judgment_prompt(self, uri: str, user_input: str) -> dict:
        """Build a judgment prompt using KDNA resource + user input.

        This is the key integration point: the MCP client (e.g. Claude Desktop)
        fetches the KDNA resource, then combines it with user input to build
        a system prompt for the LLM.
        """
        resource = self.read_resource(uri)
        if "error" in resource:
            return resource

        prompt = f"""You are an expert analyst with deep domain judgment.

Use the following domain cognition framework to analyze all inputs. Do not ignore it.

{resource['context']}

When analyzing any input:
1. First classify what kind of situation this is
2. Check for common misunderstandings
3. Apply the relevant framework
4. Run self-checks before finalizing your answer
5. State your classification explicitly

Be concise. Focus on judgment, not description.

---

USER INPUT:
{user_input}

Analyze this input using the loaded domain cognition."""

        return {
            "uri": uri,
            "prompt": prompt,
            "prompt_length": len(prompt),
        }


def main():
    print("=" * 60)
    print("KDNA as MCP Resource — Server Demo")
    print("=" * 60)

    server = KDNAResourceServer("../../examples")

    print("\n--- Available Resources ---")
    resources = server.list_resources()
    for r in resources:
        print(f"  {r['uri']} — {r['description'][:60]}...")

    print("\n--- Reading decision_state Resource ---")
    resource = server.read_resource("kdna://decision_state")
    print(f"  Name: {resource['name']}")
    print(f"  Version: {resource['version']}")
    print(f"  Context length: {resource['context_length']} chars")
    print(f"  Axioms: {resource['axioms_count']}")
    print(f"  Misunderstandings: {resource['misunderstandings_count']}")

    scenario = (
        "Team discussed the Q3 budget. Everyone agreed marketing needs more spend. "
        "No specific amount was decided. No owner assigned."
    )

    print(f"\n--- Judgment Prompt (scenario: {scenario[:50]}...) ---")
    judgment = server.get_judgment_prompt("kdna://decision_state", scenario)
    print(f"  Prompt length: {judgment['prompt_length']} chars")
    print(f"  First 500 chars:\n{judgment['prompt'][:500]}...")

    print("\n--- JSON Resource Format ---")
    print(json.dumps({
        "uri": "kdna://decision_state",
        "mimeType": "application/json",
        "context_length": resource['context_length'],
        "schema_version": "0.3",
    }, indent=2))

    print("\nDone.")


if __name__ == "__main__":
    main()
