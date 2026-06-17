# Try KDNA Core v1 in 5 Minutes

No registry. No API key. No agent. No monorepo clone.

```bash
npm install -g @aikdna/kdna-cli
kdna demo minimal ./minimal
kdna inspect ./minimal
kdna validate ./minimal
kdna pack ./minimal ./minimal.kdna
kdna unpack ./minimal.kdna ./minimal-unpacked
kdna validate ./minimal-unpacked
```

## What you just did

1. **Installed** the official KDNA CLI.
2. **Created** a minimal KDNA Core v1 demo fixture (no network, no registry).
3. **Inspected** it — saw the asset ID, title, version, payload metadata.
4. **Validated** it — confirmed format, schema, payload, checksums, and
   load-contract are all valid.
5. **Packed** it deterministically — the same source packed twice produces
   byte-identical output.
6. **Unpacked** it — extracted to a directory.
7. **Re-validated** the unpacked result — it still passes.

## What this proves

KDNA Core v1 is a **working judgment-asset format** with a
**published global CLI**. You can create, inspect, validate,
pack, and unpack `.kdna` assets from any machine with Node.js
and `npm install -g @aikdna/kdna-cli`.

## What's next

- **15 minutes**: [Load KDNA into your AI agent](./15-minute-agent-guide.md)
- **30 minutes**: [Create your own domain](./30-minute-authoring-guide.md)
- **Current status**: [docs/status.md](./status.md)
- **Tools**: [docs/tool-status-matrix.md](./tool-status-matrix.md)
- **From source**: [docs/start-here.md](./start-here.md)

## What KDNA Core v1 is

KDNA Core is the **official KDNA judgment-asset format and runtime loading
contract**. `.kdna` assets are created, inspected, protected, loaded, and
consumed through the **official KDNA toolchain**. Third-party products
integrate KDNA through the official SDK, CLI, Loader, or API.

KDNA Core is content-neutral. It does not evaluate content quality,
recommend assets, operate a marketplace, or define a public registry.
