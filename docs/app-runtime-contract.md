# KDNA App Runtime Contract

Version: 0.1  
Status: Draft  
Audience: KDNAChat, KDNA Studio, KDNAWork, VS Code, agent adapters, runtime integrators

## Purpose

The KDNA App Runtime Contract defines the shared object boundary between KDNA domain assets and applications that consume them.

KDNA applications may have different user experiences:

- KDNAChat shows judgment differences during conversation.
- KDNA Studio creates, locks, tests, and exports judgment assets.
- KDNAWork applies KDNA inside agent work and review loops.
- VS Code and agent adapters provide developer and runtime entry points.

They must not invent separate meanings for "route", "trace", "report", "domain quality", or "trust". This contract keeps the ecosystem interoperable.

## Non-goals

This contract does not define:

- UI layout or product flows
- provider-specific LLM request formats
- workflow or skill execution steps
- private enterprise policy
- pricing, licensing UX, or marketplace behavior

Those layers may vary by product. The judgment objects below should remain stable across products.

## Core Principle

Apps consume KDNA through a four-stage runtime boundary:

```
KDNA Asset -> Route Result -> Judgment Trace -> Judgment Report
```

The `.kdna` asset is the judgment source. The route result decides whether and how to load it. The judgment trace records what influenced the agent. The judgment report turns the trace into a human-readable artifact.

## Contract Objects

### 1. KDNA Asset

Canonical source: [SPEC.md](../SPEC.md)

A KDNA asset is a `.kdna` container containing the standard internal KDNA files:

- `KDNA_Core.json`
- `KDNA_Patterns.json`
- `KDNA_Scenarios.json`
- `KDNA_Cases.json`
- `KDNA_Reasoning.json`
- `KDNA_Evolution.json`

Minimum valid asset:

- `KDNA_Core.json`
- `KDNA_Patterns.json`
- `kdna.json`

Apps must treat the six KDNA files as internal judgment content. Product metadata, UI state, install metadata, or workflow configuration must not be written into the asset after installation; use external indices, traces, or sidecars.

### 2. Route Result

Canonical source: [runtime-routing.md](./runtime-routing.md)  
Schema: [route-result.schema.json](../specs/route-result.schema.json)

A route result answers one question:

> Should this task load KDNA, and if yes, which domain?

Apps must respect these actions:

| Action | Required behavior |
|---|---|
| `skip` | Continue without loading KDNA. Do not treat this as an error. |
| `load` | Load `selected_domain` and preserve source attribution. |
| `ask` | Present the domain choice to the user or caller. Do not silently blend. |
| `block` | Stop KDNA loading because trust or policy failed. |

Apps must preserve the route status and candidate reasons in logs or trace artifacts. This is how KDNA proves that it avoided wrong-domain loading, not just that it loaded a domain.

### 3. Judgment Trace

Canonical source: [kdna-trace.md](./kdna-trace.md)  
Schema: [judgment-trace-schema.json](../specs/judgment-trace-schema.json)

A judgment trace records what KDNA influenced during a task. It is not a generic execution log.

Apps should record:

- route result
- loaded domains and versions
- triggered axioms
- triggered concepts or scenarios
- triggered misunderstandings
- self-check outcomes
- guard or approval events when present
- generated judgment or final classification
- source attribution for every triggered judgment element

Apps must not claim a trace proves correctness. A trace proves inspectability: what was loaded, why it was loaded, and which judgment structures influenced the result.

### 4. Judgment Report

Schema: [judgment-report-schema.json](../specs/judgment-report-schema.json)

A judgment report is the human-readable projection of a trace. It can be rendered as Markdown, JSON, UI panels, PDF, or app-native views, but it should preserve the same sections.

Minimum report sections:

1. Task summary
2. Route decision
3. Loaded domain(s)
4. Triggered judgment elements
5. Self-check results
6. Risk, boundary, or guard events
7. Final judgment
8. Limits and unresolved questions

Apps may add product-specific sections:

- KDNAChat: side-by-side No KDNA / KDNA comparison
- KDNA Studio: card provenance, Human Lock status, readiness gate
- KDNAWork: Skill Only / Skill + KDNA comparison, artifact paths, approval events

Product-specific sections must not redefine the shared sections above.

## Shared Runtime Flow

```
input
  -> kdna route <input> --json
  -> if action=load: kdna load <selected_domain>
  -> agent or app applies judgment context
  -> postvalidate or self-check records results
  -> trace is written
  -> report is generated from the trace
```

The CLI is the reference runtime control plane. Apps may call a library, sidecar, native port, or hosted runtime, but the observable objects should match the same contract.

## Product Responsibilities

### KDNAChat

KDNAChat should prove that a loaded domain changes the user's judgment path.

Required contract outputs:

- route result for the user task
- loaded domain and version
- visible comparison between ordinary response and KDNA-shaped response
- trace or trace summary for triggered judgment elements

### KDNA Studio

KDNA Studio should prove that human judgment can become a governed domain asset.

Required contract outputs:

- domain asset export
- Human Lock evidence
- quality gate result
- local validation result
- optional Test Lab report comparing No KDNA / Best Prompt / KDNA

### KDNAWork

KDNAWork should prove that KDNA enters an agent workflow as governance, not decoration.

Required contract outputs:

- route result before task execution
- trace for the work session
- report after completion
- Skill Only / Skill + KDNA comparison when used as a demo
- guard or approval events for high-risk actions when applicable

## Conformance Levels

| Level | Name | Requirements |
|---|---|---|
| A | Domain Consumer | Can load validated domain assets and show loaded domain metadata. |
| B | Routed Consumer | Level A + emits/records route results. |
| C | Traceable Consumer | Level B + emits judgment trace artifacts. |
| D | Reportable Consumer | Level C + generates a human-readable judgment report. |
| E | Governed Consumer | Level D + enforces trust, risk, license, and Human Lock policy. |

For financing demos and enterprise pilots, KDNAWork should target Level D at minimum. KDNAChat can target Level C for conversation demos. KDNA Studio should target Level E for domain creation and release flows.

## Compatibility Rules

Apps should display or record:

- KDNA spec version
- domain version
- judgment version
- quality badge
- status
- access mode
- risk level when present
- registry or local source

Apps must not silently downgrade or ignore:

- yanked domains
- failed signature verification
- expired licenses for licensed/runtime domains
- explicit `does_not_apply_when` exclusions
- ambiguous route results

## Evidence Use

The contract is designed to create reusable evidence:

- Product evidence: screenshots and demos can show the same route/trace/report language.
- Effect evidence: No KDNA / Best Prompt / KDNA comparisons can point to trace differences.
- Engineering evidence: validators and tests can assert contract objects.
- Commercial evidence: private registry and enterprise review can audit the same artifacts.

This is why the contract belongs in the open protocol layer rather than inside one app.

## Contract Examples

Executable examples live in [examples/app-runtime-contract](../examples/app-runtime-contract/):

- `kdnachat-*.json` shows a conversation route, trace, and report.
- `kdnastudio-*.json` shows an authoring/export governance route, trace, and report.
- `kdnawork-*.json` shows an agent work session route, trace, and report.

Run:

```bash
npm run validate:runtime-contract
```

The examples are intentionally different product scenarios. The validator checks the shared evidence shape, not product behavior.

## Related Specifications

- [KDNA Specification](../SPEC.md)
- [Runtime Routing](./runtime-routing.md)
- [KDNA Trace](./kdna-trace.md)
- [Registry CI](./kdna-registry-ci.md)
- [KDNA Studio](./kdna-studio.md)
- [KDNA and AI Stack](./kdna-and-ai-stack.md)
