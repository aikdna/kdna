# Try KDNA Core v1 in 5 Minutes

Create a local `.kdna` file, validate it, and render agent-ready judgment context from your terminal.

```bash
npm install -g @aikdna/kdna-cli
kdna demo minimal ./minimal
kdna inspect ./minimal
kdna validate ./minimal
kdna pack ./minimal ./minimal.kdna
kdna validate ./minimal.kdna
kdna plan-load ./minimal.kdna
kdna load ./minimal.kdna --profile=compact --as=prompt
kdna unpack ./minimal.kdna ./minimal-unpacked
kdna validate ./minimal-unpacked
```

## What you just did

1. **Installed** the official KDNA CLI.
2. **Created** a minimal KDNA Core v1 demo fixture locally.
3. **Inspected** it — saw the asset ID, title, version, payload metadata.
4. **Validated** it — confirmed format, schema, payload, checksums, and
   load-contract are all valid.
5. **Packed** it deterministically — the same source packed twice produces
   byte-identical output.
6. **Planned loading** — confirmed the LoadPlan allows this public local asset.
7. **Loaded** it — rendered compact judgment context for an agent.
8. **Unpacked** it — extracted to a directory.
9. **Re-validated** the unpacked result — it still passes.

## What this proves

KDNA Core v1 is a **working judgment-asset format** with a
**published global CLI**. You can create, inspect, validate,
pack, plan, load, and unpack `.kdna` assets from any machine with Node.js
and `npm install -g @aikdna/kdna-cli`.

## What's next

- **15 minutes**: [Load KDNA into your AI agent](./15-minute-agent-guide.md)
- **30 minutes**: [Create your own domain](./30-minute-authoring-guide.md)
- **Current status**: [docs/status.md](./status.md)
- **Tools**: [docs/tool-status-matrix.md](./tool-status-matrix.md)
- **From source**: [docs/start-here.md](./start-here.md)

## What KDNA Core v1 is

KDNA is an open file format for packaging scoped judgment and loading it into
AI agents. `.kdna` assets are created, inspected, validated, planned, loaded,
and consumed through the official KDNA toolchain.

KDNA Core is content-neutral. It does not evaluate content quality,
recommend assets, operate a marketplace, or define a public registry.
