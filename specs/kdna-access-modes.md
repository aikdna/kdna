# KDNA Access Modes Specification

Version: 0.2
Status: Draft

## 1. Purpose

KDNA defines three access modes that govern how an AI Agent may load, use,
and interact with a KDNA domain judgment asset.

Access modes are the bridge between the open-source protocol and the
commercial asset layer. They determine:

- Whether the full KDNA content is readable by humans
- Whether the Agent receives the complete file or a task projection
- Whether the KDNA can be redistributed or embedded
- What runtime protections apply

## 2. Three Access Modes

| Mode | Human-readable | Full content to Agent | Redistribution | Runtime required |
|------|:---:|:---:|:---:|:---:|
| `open` | Yes | Yes | Yes (per license) | No |
| `licensed` | No | No | No | Yes |
| `runtime` | No | No | No | Yes |

### 2.1 Open Mode

```yaml
access: "open"
```

**Description:** Public, human-readable KDNA. The full content is visible and
can be loaded by any compatible Agent without restrictions.

**Use cases:**
- Open-source domain packages
- Community-contributed KDNA
- Educational and reference KDNA
- Basic/free tiers of commercial domains

**Protection:** None. Content is fully transparent. License terms (e.g., CC BY 4.0)
govern attribution and redistribution, not access.

**File format:** Plain `.kdna` (YAML/JSON) or `.kdnapack` directory.

**Agent behavior:**
- Agent receives the complete KDNA context
- No runtime enforcement beyond license metadata
- Can be inspected, forked, and modified per license

### 2.2 Licensed Mode

```yaml
access: "licensed"
```

**Description:** Authorized-use KDNA. Delivered as an encrypted package (`.kdna.pkg`).
The Agent must verify a license before loading. Content is decrypted at load time
but full content is still delivered to the authorized Agent.

**Use cases:**
- Paid domain packages (one-time purchase)
- Team/enterprise licensed domains
- Subscription-based KDNA access
- Private/internal organizational KDNA

**Protection:**
- Content encrypted at rest (`.kdna.pkg` format)
- License key verification before decryption
- License key bound to user, team, or organization
- Usage logging and audit trail
- Watermark injection in Agent responses

**Agent behavior:**
- Agent receives the complete KDNA context after license verification
- Human user with license can view content through approved tools
- Redistribution and training are prohibited by license + technical enforcement

**File format:** `.kdna.pkg` (encrypted archive).

### 2.3 Runtime Mode

```yaml
access: "runtime"
```

**Description:** Protected commercial KDNA. The Agent NEVER receives the full
KDNA content. Instead, the Agent calls a Runtime API that returns **task projections** —
only the judgment fragments relevant to the current task.

**Use cases:**
- Premium commercial KDNA (high-value domain expertise)
- Proprietary expert judgment systems
- Enterprise-critical decision frameworks
- KDNA where the creator's competitive advantage is the judgment structure itself

**Protection:**
- Full KDNA content NEVER leaves Runtime server
- Task projection: Agent requests judgment for a specific task
- Fragmented delivery: only relevant sections returned
- Rate limiting and extraction detection
- Semantic watermarking
- Anti-reverse-engineering guardrails
- Creator retains full ownership

**Agent behavior:**
- Agent sends task description to Runtime API
- Runtime returns a task projection with relevant judgment constraints
- Agent applies the projection to its response
- Agent must not attempt to reconstruct the full KDNA

**File format:** `.kdna.pkg` on Runtime server. Agent only has an API endpoint.

## 3. Task Projection (Runtime Mode)

When an Agent needs KDNA judgment for a specific task, it sends:

```json
{
  "kdna_id": "writing-pro",
  "task": "review_article",
  "context": "Pre-publish review of a technical blog post",
  "mode": "judge"
}
```

The Runtime returns a projection, not the full KDNA:

```json
{
  "task_projection": {
    "diagnosis_focus": [
      "Does each paragraph serve one clear idea?",
      "Does the opening create an entry point for the intended reader?",
      "Does the ending deliver a takeaway that changes understanding?"
    ],
    "constraints": [
      "Reject sentences that rely on jargon without definition",
      "Flag passive constructions that hide agency",
      "Do not rewrite. Only judge and suggest."
    ],
    "self_check": [
      "Is this feedback specific enough to act on?",
      "Did I identify the root issue, not just the surface symptom?"
    ]
  }
}
```

### Projection Principles

1. **Task-scoped:** Only return judgment relevant to this specific task
2. **Example-scoped:** If the task is about pricing, return pricing axioms, not sales axioms
3. **Action-oriented:** Return actionable diagnosis, not abstract theory
4. **No reconstruction path:** Never return enough fragments to reconstruct the full KDNA

### Extraction Prevention

Runtime implementations SHOULD:

- Limit the number of projections within a time window
- Detect patterns suggesting extraction (e.g., "list all rules", "generate complete KDNA")
- Inject per-request semantic watermarks (term ordering, synonym selection, example numbering)
- Never return `core_structure`, full `axioms` array, or complete `ontology` in one call
- Log and alert on suspicious access patterns

## 4. Mode Declaration

Access mode is declared in the KDNA file or manifest:

**In .kdna (YAML):**
```yaml
meta:
  access: "open"
```

**In kdna.json (JSON):**
```json
{
  "access": "open"
}
```

**In .kdna.pkg (encrypted header):**
```
X-KDNA-Access: runtime
```

## 5. Mode Transition

Creators may change access modes:

| From | To | Requires |
|------|----|----------|
| `open` → `licensed` | New major version. Notify existing users. |
| `open` → `runtime` | New major version. Requires Runtime infrastructure. |
| `licensed` → `runtime` | Version upgrade. May require re-licensing. |
| `licensed` → `open` | Always allowed. Community release. |
| `runtime` → `licensed` | Architecture change. Requires creator decision. |

Once content has been published under `open` mode, it cannot be retroactively
locked. Choose mode before first publication.

## 6. Agent Compatibility

| Agent Capability | `open` | `licensed` | `runtime` |
|------------------|:------:|:----------:|:---------:|
| Offline use | Yes | Yes (after activation) | No |
| Full context awareness | Yes | Yes | No (projection only) |
| Multi-domain composition | Yes | Yes (per license) | Yes (multi-projection) |
| Self-hosting | Yes | Yes (with license server) | No |
| Forking / modification | Per license | No | No |

## 7. Security Considerations

1. **Open mode:** No technical security. Relies on license + social norms.
2. **Licensed mode:** Standard encryption + license key. Protects against casual copying, not determined reverse engineering.
3. **Runtime mode:** Server-side protection. Strongest defense. Trade-off: requires network, adds latency, reduces Agent context awareness.

The choice of mode should balance:
- Creator's need for protection vs. user's need for flexibility
- Domain sensitivity vs. distribution goals
- Revenue model vs. adoption velocity

## 8. Relationship to Other Specs

- `kdna-file-format.md` — Defines how `access` is declared in `.kdna` files
- `kdna-package-format.md` — Defines `access` in `kdna.json` manifests
- `kdna-license.md` — Defines legal terms that complement access modes
- KDNA Runtime — Technical implementation of `licensed` and `runtime` modes (future spec)
