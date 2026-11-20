# KDNA Maturity Overview

**Current maturity: Pre-release (`0.x`).** The Container `0.6.0` format, core packages, CLI `0.45.1`, Agent Skills, and KDNA Reader for macOS form a working end-to-end loop, while the protocol and ecosystem continue to mature toward `1.0`.

## Component Status

| Surface | Maturity | Notes |
| --- | --- | --- |
| Container `0.6.0`, manifest, CBOR sections, checksums | Pre-release (Active) | Verified by executable conformance suites |
| Local `inspect → validate → read` (CLI `0.45.1`) | Pre-release (Active) | Primary consumption route (`catalog` → `exact_selection`) |
| Local password protection (`RFC-0018`, `kdna protect`) | Pre-release (Active) | Offline, account-free AEAD encryption |
| KDNA Reader (macOS, Apple Silicon) | Public Free Release | Signed & Apple-notarized desktop app |
| Agent Skills (`kdna-creator`, `kdna-loader`) & local MCP | Pre-release (Active) | Explicit user-selected file workflow |
| Historical `validate → plan-load → load` / Runtime Capsule | Retired `0.36.1` loading workflow | Preserved in history only; replaced by `0.45.1` `read` |
| Studio `0.5.0` session line & Swift `pre-0.6.0` repos | Legacy (Archived) | Preserved for older projects; use `0.6.0` for new works |

## Four Separate Layers of Confidence

1. **Format validity** — the `.kdna` file passes container, schema, and checksum checks.
2. **Authorship & integrity** — SHA-256 digests and optional Ed25519 signatures match the exact file bytes.
3. **Human review** — readers open the work (for example in KDNA Reader) and verify that its reasoning, trade-offs, and boundaries make sense.
4. **Real-world fit** — the user decides whether a specific work fits their actual task and standards.

Format validation guarantees technical integrity; human review and real practice always decide whether a judgment work is right for you. See [Core Narrative and Boundaries](./core-narrative-and-boundaries.md).
