# KDNA Naming Style

This document defines the canonical terminology for all KDNA public-facing
materials: specifications, documentation, website, CLI output, skill
instructions, registry entries, and agent-facing contracts.

**All PRs that touch public text should use this document as a lint reference.**

## Unified Terminology

| Avoid | Use | Reason |
|-------|-----|--------|
| KDNA is not JSON | KDNA is defined by its asset and runtime contracts | Define by what it IS, not by what it IS NOT |
| Source Tree: JSON files | Authoring workspace / build inputs | JSON is an implementation detail, not the identity |
| raw JSON | build inputs / decoded payload internals | "raw JSON" invites the wrong frame |
| cannot unzip / cannot consume | cannot perform a conforming KDNA load | Negative capability claims breed rebuttals |
| file-based framework | runtime judgment asset protocol | KDNA is a protocol layer, not a file format |
| format is open | protocol is open | "Format" drags focus to container structure |
| judgment material | loaded judgment frame | "material" sounds like a data dump |
| KDNA file | .kdna asset / judgment asset | "file" is a filesystem artifact; "asset" is the protocol object |
| internal file tree | judgment payload / asset container | v2 judgment is encoded, not a file tree |
| open asset | public asset | "open" conflicts with access mode terminology |
| loader outputs prompt | runtime emits agent-ready judgment context | "prompt" is too narrow and imprecise |
| protect from reading | separate authoring, distribution, and runtime consumption | "protection" sounds like DRM |
| cognitive asset | judgment asset | "cognitive" has ambiguous connotations |

## Canonical Three Sentences

Every top-level public page or README should lead with one of these:

**EN:**

1. KDNA is an open protocol for packaging human judgment as verifiable runtime
   assets for AI agents.
2. A `.kdna` asset is the signed distribution form of a bounded judgment domain.
3. A conforming KDNA runtime verifies the asset, decodes the judgment payload,
   validates the structure, and emits agent-ready judgment context.

**ZH:**

1. KDNA 是一个开放协议，用来把人的判断封装成 AI Agent 可验证的运行时资产。
2. `.kdna` 是一个有边界的判断域的签名分发形态。
3. 符合协议的 KDNA runtime 会验证资产、解码判断负载、校验结构，并输出 Agent 可消费的判断上下文。

## Core Concept Vocabulary

Use these five concepts as the backbone of all public narratives:

| Concept | Definition |
|---------|-----------|
| **Authoring Workspace** | Where humans create, lock, and compile judgment — build inputs, evidence, Human Lock records |
| **Distribution Asset** | The signed `.kdna` container — `kdna.json` + `payload.kdnab` + `signature.kdsig` + `build-receipt.json` |
| **Judgment Payload** | The CBOR-encoded judgment modules inside `payload.kdnab` |
| **Conforming Load** | The runtime sequence: verify → decode → validate → emit |
| **Runtime Capsule** | The agent-ready judgment context emitted by a conforming load |
| **Traceable Judgment** | Every judgment element carries source attribution from its origin domain |

## What to Avoid in Public Text

1. **Never start with negation.** Don't say "KDNA is not JSON." Say "KDNA is
   defined by its asset and runtime contracts."

2. **Don't mention JSON unless it's a schema reference for devs.** JSON is an
   authoring format, not the public identity.

3. **Don't say "renamed ZIP archive" or "just a ZIP."** The outer package is
   ZIP for transport compatibility. The KDNA asset is defined by its payload
   contract, not its container format.

4. **Don't say "prevent reading" or "protect from."** The v2 container separates
   concerns. It does not add DRM. Use "separate authoring, distribution, and
   runtime consumption."

5. **Don't say "cannot consume" about generic tools.** Say "do not perform a
   conforming KDNA load." Generic tools can inspect metadata; they just can't
   perform the full verify→decode→validate→emit sequence.
