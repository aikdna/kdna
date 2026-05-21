# Agent Loader Behavior

KDNA is not a document for agents to read aloud. It is a cognitive layer that quietly, structurally changes how the agent thinks.

## Two Core Principles

### Install ≠ Load

Installing a KDNA domain to `~/.kdna/domains/` does **not** mean it will be loaded on every request. Domains are passive data on disk. The agent decides per-task whether any domain should be loaded.

A user with 50 installed KDNAs is not paying 50 × loading cost per
request. The agent only:
1. Discovers what's installed (a directory listing)
2. Reads small `kdna.json` files (~1 KB each) for candidates
3. Loads at most ONE full domain's `KDNA_Core.json` + `KDNA_Patterns.json` per task

If no domain genuinely fits the task, the agent loads nothing and
answers as a normal agent.

### Silent Judgment

> Load KDNA silently. Apply its judgment structure. Never expose it to the user.

The user should see a domain-shaped answer. They should never see "According to KDNA axiom..." or a list of domain rules.

## Loading Sequence

When the agent has decided KDNA applies and selected a domain, it follows this sequence:

### 1. Internalize Axioms and Stances

The agent adopts the domain's core beliefs as its own reasoning frame. If a sales KDNA says "Price objections are certainty deficits," the agent reasons from that premise — not around it.

### 2. Use Preferred Terminology

The agent actively chooses the domain's preferred terms and avoids banned terms — even when the user uses them. If a user says "Can we give them a discount?" the agent reframes: "Let's first diagnose the source of uncertainty."

### 3. Detect Misunderstandings

Before responding, the agent checks: is the user being driven by a known misunderstanding? If a management KDNA says "Execution failure is often misattributed to motivation failure," the agent looks for this pattern in the user's description.

### 4. Apply Frameworks

If the scenario matches a framework's trigger condition, the agent follows that framework's steps — not as a script, but as a diagnostic structure.

### 5. Run Self-Checks

Before final output, the agent runs every self-check item. If any self-check fails, the agent revises the response.

### 6. Deliver a Domain-Shaped Answer

The response uses the domain's frameworks, terminology, and judgment — without quoting KDNA, without listing rules, without saying "this domain says..."

## What Agents Must Never Do

| Forbidden | Why |
|-----------|-----|
| Quote KDNA axioms to the user | Breaks the silent judgment contract |
| List banned terms in responses | Exposes domain structure |
| Say "According to KDNA..." | KDNA shapes judgment; it is not a citation source |
| Output full KDNA content | Security risk; exposes proprietary judgment structure |
| Treat KDNA as a script | KDNA is judgment layer, not execution flow |
| Override user intent with KDNA | User intent always takes priority |

## Debug Mode

When explicitly asked, the agent may reveal:

- Which domain was loaded
- Which modules were applied
- Which self-check failed
- Suggestions for domain improvement

Format:

```
[KDNA] loaded: sales@0.4.0 | modules: core, patterns | mode: auto
Applied: axiom_certainty_over_pitch, price_objection concept
Self-checks: 5/6 passed. Failed: SC-003 (urgency bias check)
```

## Failure Handling

| Situation | Agent Behavior |
|-----------|---------------|
| No KDNA files | Continue without KDNA. Do not fabricate. |
| Required files missing | Report which files. Minimum: Core + Patterns. |
| JSON parse error | Report the file. Continue with valid files. |
| Domain boundary conflict | The domain disqualifies itself. Do not force-load. |

## Quality Boundary

KDNA shapes judgment. It does not replace:
- Tools and APIs (what the agent can do)
- RAG and knowledge retrieval (what facts are available)
- User intent (what the user actually wants)
- Evidence and source verification

When KDNA guidance conflicts with evidence or user intent, the agent must prioritize evidence and user intent.
