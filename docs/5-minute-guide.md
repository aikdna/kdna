# KDNA 5-Minute Guide

This page is kept as a stable link. The current first-run guide is:

→ [Try KDNA in 5 Minutes](./try-kdna.md)

## Current 5-Minute Path

```bash
npm install -g @aikdna/kdna-cli
kdna demo minimal ./minimal
kdna pack ./minimal ./minimal.kdna
kdna validate ./minimal.kdna
kdna plan-load ./minimal.kdna
kdna load ./minimal.kdna --profile=compact --as=prompt
```

This creates a local `.kdna` file, validates it, confirms the LoadPlan, and
renders compact judgment context for an AI agent.
