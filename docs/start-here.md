# Start Here

English | [简体中文](./start-here.zh.md) · [README](../README.md) · [KDNA Reader (macOS)](https://aikdna.com/en/downloads) · [Agent Entry](./agent-entry.md)

Get hands-on with KDNA in a few minutes using **KDNA Reader** and the official CLI **`@aikdna/kdna-cli@0.45.0`** (Container `0.6.0`, Node.js `>=22`, permanently account-free).

---

## 1. Read a Real `.kdna` Work First

Start by opening our first official bilingual work, **KDNA Whitepaper `v1.0.2`** (*《KDNA白皮书》*, authored by Zhang Ling · `CC BY 4.0` · `45` connected judgments):

- **macOS Desktop App (free, Apple-notarized):** [Download KDNA Reader](https://aikdna.com/en/downloads) — open any local `.kdna` file offline anytime, or sign in with a free `KDNA ID` for the bundled bilingual Whitepaper and synced Judgment Asset Library.
- **Direct `.kdna` Downloads:**
  - English (`en`): [`kdna-whitepaper-1.0.2.en.kdna`](https://aikdna.com/downloads/whitepaper/v1.0.2/kdna-whitepaper-1.0.2.en.kdna) (`2,843,386` bytes · SHA-256 `6da515820eed210508d72a4ddbf68f7052cb180afe592c64e85e9a3fbb60c49e`)
  - Chinese (`zh-CN`): [`kdna-whitepaper-1.0.2.zh-CN.kdna`](https://aikdna.com/downloads/whitepaper/v1.0.2/kdna-whitepaper-1.0.2.zh-CN.kdna) (`2,725,359` bytes · SHA-256 `e344944a53f8d4bb2ca40a8d42bcd3c104e3067bfa92dce99e327cbc5aed40aa`)

---

## 2. Try the CLI in 30 Seconds (`@aikdna/kdna-cli@0.45.0`)

Everything below runs locally on **Node.js `>=22`** with zero online accounts:

```bash
# 1. Create a starter draft, validate it, and build a Container 0.6.0 .kdna work
npx -y @aikdna/kdna-cli@0.45.0 init --example --mode interview --output draft.json
npx -y @aikdna/kdna-cli@0.45.0 validate-input draft.json --format human
npx -y @aikdna/kdna-cli@0.45.0 create --draft draft.json --output my-judgments.kdna --allow-create

# 2. Validate and read selectively (catalog first, then exact_selection with intact premises)
npx -y @aikdna/kdna-cli@0.45.0 validate my-judgments.kdna
npx -y @aikdna/kdna-cli@0.45.0 read my-judgments.kdna --mode catalog --allow-read --format human
npx -y @aikdna/kdna-cli@0.45.0 read my-judgments.kdna \
  --mode exact_selection \
  --judgment-id decision:first-dilemma \
  --allow-read --compact

# 3. Protect locally with a password (offline RFC-0018 AEAD encryption)
printf '%s' 'a long passphrase' > password.txt
npx -y @aikdna/kdna-cli@0.45.0 protect my-judgments.kdna --output locked.kdna --password-file password.txt
npx -y @aikdna/kdna-cli@0.45.0 read locked.kdna \
  --mode exact_selection \
  --judgment-id decision:first-dilemma \
  --allow-read --password-file password.txt --format human
```

Key tips:
- `--allow-create` and `--allow-read` explicitly authorize local file creation and disclosure; they never grant external system actions.
- When letting an Agent read a multi-judgment `.kdna`, always pass `--format human` or `--compact` and follow `catalog` → `exact_selection`. Do not use `--mode whole_asset` to read judgment bodies inline.

---

## 3. Where to Go Next

| Goal | Guide |
| --- | --- |
| **Understand why judgment deserves its own file format** | [Why KDNA](./why-kdna.md) · [Judgment Systems](./judgment-systems.md) · [Why the Name](./why-the-name.md) |
| **Use `.kdna` with Claude Code, Cursor, Codex, or Antigravity** | [Agent Entry](./agent-entry.md) · [`aikdna/kdna-skills`](https://github.com/aikdna/kdna-skills) |
| **Author your own `.kdna` judgment work** | [Authoring Guide](./authoring-guide.md) |
| **Inspect a `.kdna` file locally in your browser (zero upload)** | Open `docs/inspector/index.html` directly from this repository |
| **Read the technical protocol specification** | [SPEC.md](../SPEC.md) · [SPEC-INDEX.md](../SPEC-INDEX.md) |
| **Check published package versions & support details** | [Status](./status.md) · [Current Release Support](./current-release-support.md) · [Public Roadmap](./public-roadmap.md) |
| **Migrate an older `0.5.0` work to `0.6.0`** | [0.5 → 0.6 Migration Checklist](./migration-checklist.md) |
| **Contribute or report a security issue** | [CONTRIBUTING.md](../CONTRIBUTING.md) · [SECURITY.md](./SECURITY.md) |

---

## 4. Public Ecosystem Map

| Repository / App | Purpose |
| --- | --- |
| [`aikdna/kdna`](https://github.com/aikdna/kdna) | Open protocol specification, schemas, conformance suites, `@aikdna/kdna-core`, and `@aikdna/kdna-read` |
| [`aikdna/kdna-cli`](https://github.com/aikdna/kdna-cli) | Official CLI (`@aikdna/kdna-cli@0.45.0`) for `init`, `validate-input`, `create`, `protect`, `validate`, `read`, `diff`, `source-open`, `source-pack`, and `convert` |
| [`aikdna/kdna-skills`](https://github.com/aikdna/kdna-skills) | Agent Skills (`kdna-creator`, `kdna-loader`) and optional local stdio MCP adapter |
| [`aikdna/kdna-assets`](https://github.com/aikdna/kdna-assets) | Official public `.kdna` works (including bilingual *KDNA Whitepaper* `v1.0.2`) |
| [KDNA Reader](https://aikdna.com/en/downloads) | Free macOS desktop app for reading and reviewing `.kdna` works |
