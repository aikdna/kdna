#!/usr/bin/env python3
"""
KDNA as MCP Resource — Conceptual Example

Shows how canonical `.kdna` assets can be served as MCP Resources,
making judgment cognition available to any MCP-compatible client.

Architecture:
- KDNA = Resource layer (provides judgment context)
- Tools = Action layer (perform tasks using that context)
- KDNA does NOT compete with MCP tools. It enriches them.
"""

import json
import os
import sys
from pathlib import Path

# Add python-sdk to path if running without pip install
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "python-sdk"))

from kdna import open_kdna, inspect_kdna, format_context

# ---------------------------------------------------------------------------
# In-memory "MCP Server" — conceptual implementation
# ---------------------------------------------------------------------------

class KDNAResourceServer:
    """Serves `.kdna` assets as MCP-style resources.

    In a real implementation, this would use the official MCP SDK:
    https://github.com/modelcontextprotocol/python-sdk

    This conceptual version shows the data model and resource schema.
    """

    def __init__(self, asset_root: str):
        self.asset_root = Path(asset_root)
        self.loaded = {}

    def list_resources(self) -> list[dict]:
        """Return list of available KDNA resources."""
        resources = []
        if not self.asset_root.exists():
            return resources

        for asset_path in sorted(self.asset_root.glob("*.kdna")):
            info = inspect_kdna(str(asset_path))
            resources.append({
                "uri": f"kdna://{info.get('name') or asset_path.stem}",
                "name": info.get("name") or asset_path.stem,
                "description": info.get("manifest", {}).get("description", ""),
                "mimeType": "application/vnd.kdna.asset+json",
                "asset_digest": info.get("asset_digest"),
            })
        return resources

    def read_resource(self, uri: str) -> dict:
        """Read a KDNA resource by URI.

        Returns the formatted context suitable for injection into
        an agent's system prompt.
        """
        asset_name = uri.replace("kdna://", "")

        asset_path = None
        for candidate in self.asset_root.glob("*.kdna"):
            info = inspect_kdna(str(candidate))
            if info.get("name") == asset_name or candidate.stem == asset_name:
                asset_path = candidate
                break

        if not asset_path:
            return {"error": f"Asset not found: {asset_name}"}

        domain = open_kdna(str(asset_path), mode="all")
        context = format_context(domain)
        info = domain.get("asset_info", {})
        meta = domain.get("core", {}).get("meta", {})

        return {
            "uri": uri,
            "name": info.get("name") or meta.get("domain", asset_name),
            "version": info.get("version") or meta.get("version", "?"),
            "purpose": domain.get("manifest", {}).get("description") or meta.get("purpose", ""),
            "asset_digest": info.get("asset_digest"),
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

    asset_root = os.environ.get("KDNA_ASSET_ROOT", "./assets")
    server = KDNAResourceServer(asset_root)

    print("\n--- Available Resources ---")
    resources = server.list_resources()
    for r in resources:
        print(f"  {r['uri']} — {r['description'][:60]}...")

    if not resources:
        print(f"  No .kdna assets found under {asset_root}")
        print("  Set KDNA_ASSET_ROOT to a directory containing canonical assets.")
        return

    print("\n--- Reading First Resource ---")
    resource = server.read_resource(resources[0]["uri"])
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
    judgment = server.get_judgment_prompt(resources[0]["uri"], scenario)
    print(f"  Prompt length: {judgment['prompt_length']} chars")
    print(f"  First 500 chars:\n{judgment['prompt'][:500]}...")

    print("\n--- JSON Resource Format ---")
    print(json.dumps({
        "uri": resource["uri"],
        "mimeType": "application/vnd.kdna.asset+json",
        "context_length": resource['context_length'],
        "asset_digest": resource["asset_digest"],
        "schema_version": "1.0-rc",
    }, indent=2))

    print("\nDone.")


if __name__ == "__main__":
    main()
