#!/usr/bin/env python3
"""
Basic KDNA Python SDK usage example.
"""

import os

from kdna import open_kdna, inspect_kdna, format_context

asset_path = os.environ.get("KDNA_ASSET", "./writing.kdna")

# Load a canonical .kdna asset directly. Set KDNA_ASSET to any local asset path.
info = inspect_kdna(asset_path)
domain = open_kdna(asset_path, mode="all")

if domain:
    print("Asset loaded successfully!")
    print(f"Name: {info.get('name')}")
    print(f"Version: {info.get('version')}")
    print(f"Digest: {info.get('asset_digest')}")
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
    print("Failed to load asset.")
