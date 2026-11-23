# KDNA Demos & Hands-On Experience

The fastest way to experience KDNA is with a real Container `0.6.0` `.kdna` work—either by reading it directly in **KDNA Reader** or by loading it into your AI Agent via **`@aikdna/kdna-cli@0.45.2`** (Node.js `>=22`, permanently account-free).

## 1. Read a Real `.kdna` Work in KDNA Reader

1. Download [KDNA Reader for macOS](https://aikdna.com/en/downloads) (free, Apple-notarized).
2. Open the official bilingual **KDNA Whitepaper `v1.0.2`** (`45` connected judgments, `CC BY 4.0`):
   - English: [`kdna-whitepaper-1.0.2.en.kdna`](https://aikdna.com/downloads/whitepaper/v1.0.2/kdna-whitepaper-1.0.2.en.kdna)
   - Chinese: [`kdna-whitepaper-1.0.2.zh-CN.kdna`](https://aikdna.com/downloads/whitepaper/v1.0.2/kdna-whitepaper-1.0.2.zh-CN.kdna)

## 2. Try Selective Reading with the CLI

```bash
# Download the official bilingual Whitepaper
curl -fsSLo kdna-whitepaper-1.0.2.en.kdna \
  https://aikdna.com/downloads/whitepaper/v1.0.2/kdna-whitepaper-1.0.2.en.kdna

# 1. Verify container integrity
npx -y @aikdna/kdna-cli@0.45.2 validate kdna-whitepaper-1.0.2.en.kdna

# 2. Browse the 45-judgment catalog
npx -y @aikdna/kdna-cli@0.45.2 read kdna-whitepaper-1.0.2.en.kdna \
  --mode catalog --format human --allow-read

# 3. Read selected judgments with intact premises and boundaries
npx -y @aikdna/kdna-cli@0.45.2 read kdna-whitepaper-1.0.2.en.kdna \
  --mode exact_selection --judgment-id judgment:origins,judgment:work-itself \
  --format human --allow-read
```

## 3. Create, Encrypt, and Diff Your Own `.kdna`

```bash
npx -y @aikdna/kdna-cli@0.45.2 init --example --mode interview --output draft.json
npx -y @aikdna/kdna-cli@0.45.2 validate-input draft.json --format human
npx -y @aikdna/kdna-cli@0.45.2 create --draft draft.json --output my-judgments.kdna --allow-create
npx -y @aikdna/kdna-cli@0.45.2 read my-judgments.kdna --mode catalog --format human --allow-read
```

For full Agent instructions (Claude Code, Cursor, Codex, OpenCode, Antigravity), see [`docs/agent-entry.md`](../docs/agent-entry.md).
