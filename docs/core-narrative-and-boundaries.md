# KDNA Core Narrative and Boundaries

**Status:** Definitive — 2026-07. This is the normative product definition for
the KDNA open protocol. Protocol implementers should read this document alongside
[SPEC.md](../SPEC.md) and the adopted normative specs in [`specs/`](../specs/).

---

## 1. One-Sentence Definition

> KDNA is an open judgment-asset format and protocol that gives reusable,
> bounded judgment an independent identity and lifecycle. People, teams,
> Agents, and tools can create assets whose judgment, versions, provenance,
> access, projections, and evidence are managed independently from any one
> Prompt, Skill, model, or application. KDNA Core validates the protocol; it
> does not judge whether the content is correct, good, or worthy of existence.

## 2. Ten Immutable Boundaries

These boundaries MUST NOT change across any protocol version. A change to any of
these is a change to what KDNA fundamentally is — and requires a new protocol,
not a new version.

### 2.1 Open Creation

Anyone — individual, Agent, organization, or software — can create KDNA assets.
The protocol defines format validity (`kdna validate`). It does not define who
may create, what judgments are correct, what quality level is required, or
whether an asset is "good enough" to exist.

MUST NOT:
- Require official approval, review, registry listing, or "expert" status
- Gate creation on behavior evaluation, field validation, or human review
- Rate, rank, or recommend asset content

### 2.2 Content Neutrality

KDNA Core validates structure, not content. It answers "is this a valid KDNA
asset?" never "is this good judgment?"

KDNA Core MUST NOT:
- Define what judgment is correct, advanced, or valuable
- Rate assets by quality, usefulness, or correctness
- Serve as a content judge, recommendation engine, or trust authority

KDNA Core MAY:
- Validate schema, digest, signature, and authorization
- Enable optional Evidence Claims that describe what an asset has been observed to do
- Enable optional catalogs/registries that list asset metadata

### 2.3 Judgment, Not Fact

KDNA carries judgment structure: value ordering, taste, standards, boundaries,
risk models, preferences, personality, stance, and methods of choosing.

KDNA does NOT carry:
- Facts, knowledge bases, or ground truth
- Documents, RAG content, or information retrieval data
- Executable code, workflow steps, or automation scripts

Facts and knowledge belong to document stores, databases, and RAG systems.
Judgment belongs to KDNA.

### 2.4 `.kdna` Is THE Asset

The `.kdna` file is the sole official distribution and loading format. It is not
a generic prompt, not a plaintext ZIP, and not a loose source directory.

Source directories (`KDNA_Core.json`, `KDNA_Patterns.json`, etc.) are authoring
workspaces. They MUST NOT be distributed as assets or loaded by Agents.

### 2.5 Toolchain-Mediated Creation and Consumption

Creation and consumption happen through the KDNA toolchain: KDNA Studio, CLI,
SDK, Loader, or API.

Agents MUST NOT use generic `unzip`, CBOR decode, or internal JSON parsing as a
normal consumption path. The consumption contract is:

```text
inspect → LoadPlan → authorization → load/project → Runtime Capsule → Agent
```

### 2.6 Runtime Capsule Is The Agent Interface

Agents consume KDNA through a Runtime Capsule emitted by `kdna load`. They
MUST NOT read raw asset internals (ZIP entries, CBOR payload, source-tree JSON).

A compatible third-party implementation that wants to serve as an Agent's KDNA
runtime MUST:
- Implement the full LoadPlan contract
- Implement the full authorization contract
- Verify digests and optional signatures
- Emit a compliant Runtime Capsule
- NOT expose raw payload internals to the consuming Agent

Direct unzip-and-read is not a compatible implementation — it is bypassing the
consumption contract.

### 2.7 Three Access Modes, Author Decides

Every KDNA asset declares exactly one canonical access value:

| Value | Meaning |
|---|---|
| `public` | Content has no secrecy. Can be inspected, forked, and re-authored through official toolchain paths. Agent consumption still goes through Capsule. |
| `licensed` | Judgment content is encrypted. LoadPlan validates entitlement before in-memory-only decryption. Decrypted content MUST NOT be written to disk, logs, or Trace. |
| `remote` | Full judgment content never leaves the server. Only task-scoped projections are returned to authorized callers. |

Legacy values MUST be accepted as input but MUST NOT be emitted as canonical
output:

| Legacy | Canonical |
|---|---|
| `open` | `public` |
| `protected` | `licensed` |
| `runtime` | `remote` |

The author chooses the access mode. The toolchain enforces the declared access
and authorization rules. The toolchain is not a content censor and does not
override the author's access declaration.

### 2.8 Evidence Is Optional

Evidence Claims, Asset Assay, and Field Validation are optional quality-evidence
layers. They describe what an asset has been observed to prove — nothing more.

An asset without evidence is still a valid KDNA asset. Load-ready evidence MUST
NOT be conflated with behavior-evaluated or production status.

Evidence MUST NOT be required for:
- Asset creation
- Asset validation
- Asset loading
- Asset consumption

Evidence MAY be required for:
- Specific quality or trust claims the author chooses to publish
- Optional catalog/registry listings with quality metadata
- Internal quality gates defined by the consumer's own policy

**Signature is an integrity and provenance mechanism, not evidence of quality.**
Signatures bind an asset version to a key. Whether signatures are optional or
required for a given protocol version or distribution profile is determined by
the container specification, not by this boundary. A signature verifies who
signed — it does not endorse content correctness, quality, or authority.

### 2.9 Private Experiments Cannot Redefine These Boundaries

Private experimental results (Router performance, advisor contamination
thresholds, trust-runtime policies, etc.) may inform toolchain improvements but
MUST NOT redefine:

- Who can create KDNA
- What KDNA fundamentally is
- Whether un-evaluated assets are valid KDNA
- Whether the toolchain is a content gatekeeper
- Whether Agents may bypass authorization and Capsule boundaries

### 2.10 Protocol Versioning

The KDNA Core protocol version refers to the logical specification, not the wire
format. The current public protocol and toolchain are **Beta**. The current wire
container format is the **KDNA Asset Container** (`kdna_version: "1.0"`,
`application/vnd.kdna.asset`), which implements the current Core logical model.

| Layer | Current Version | Meaning |
|---|---|---|
| Protocol (logical) | Beta | What KDNA assets are, how they load |
| Container (wire) | `kdna_version: "1.0"` | KDNA Asset Container encoding |
| Capsule (agent interface) | `kdna.context.capsule` v1.0 | What Agents receive |

Legacy plaintext ZIP containers (without `payload.kdnab`) are superseded and
MUST be rejected by conforming tools.

---

## 3. Agent Consumption Contract

The ONLY supported Agent consumption path through the official toolchain is:

```text
1. discover or explicitly select a .kdna asset
2. kdna inspect → public metadata only
3. kdna plan-load → LoadPlan (authorization, validation, readiness)
4. authorization:
   - public → proceed
   - licensed → entitlement check → in-memory decrypt
   - remote → server-side projection
5. kdna load → Runtime Capsule (profile-selected, validated, verified)
6. Agent receives Capsule, never raw internals
7. Trace emitted (what happened, how much it cost)
```

### 3.1 LoadPlan States

The LoadPlan returns a `state` and a `can_load_now` boolean. The consumer MUST
check `can_load_now`, not infer loadability from the state name alone. The
canonical states defined by the authorization contract and LoadPlan schema are:

| State | `can_load_now` | Meaning |
|---|---|---|
| `ready` | `true` | Asset can be loaded now |
| `offline_grace` | `true` | Asset can load now; entitlement sync required before grace expires |
| `needs_password` | `false` | Password-protected asset lacks a password |
| `needs_license` | `false` | Required receipt or activation is missing |
| `needs_account` | `false` | Account authorization is required |
| `needs_org_auth` | `false` | Organization or SSO authorization is required |
| `needs_runtime` | `false` | Remote runtime is required |
| `expired_grace` | `false` | Entitlement expired; grace period may apply |
| `denied` | `false` | Entitlement explicitly denied or revoked |
| `invalid` | `false` | Format, integrity, signature, crypto, access, or policy check failed |
| `format_invalid` | `false` | Not a recognized KDNA container |

A consumer MUST NOT load judgment content when `can_load_now` is false.
The consumer MUST NOT decide loadability from the state name alone — only
`can_load_now` is authoritative.

### 3.2 Licensed Asset Security

For `licensed` assets:

- Judgment content is encrypted in `payload.kdnab`
- Decryption material is obtained through entitlement check
- The full, raw decrypted payload exists ONLY in memory
- The full raw payload MUST NOT be written to disk, logs, or Trace output
- Authorized, task-scoped, profile-selected judgment projection MAY enter the Runtime Capsule as the Agent's consumption interface
- `kdna dev decode --reveal` is a developer/debug interface; it MUST NOT be
  auto-invoked by Agents or exposed to normal consumption paths

### 3.3 Developer Inspection Paths

Developers MAY use these paths for debugging, forking, or audit:

```bash
kdna inspect <asset.kdna>          # manifest metadata only
kdna unpack <asset.kdna> <dir>     # source tree for forking/audit (public only)
kdna dev decode <asset.kdna> --reveal  # raw payload (dev/debug, explicit opt-in)
```

These are developer tools, not Agent consumption paths.

---

## 4. Asset Lifecycle

Every KDNA asset follows this lifecycle model:

```text
draft (authoring)
→ packed (.kdna container created)
→ validated (kdna validate passes)
→ published (available for consumption)
→ optionally: deprecated → removed or revoked
```

At each stage, the asset MAY carry optional evidence:

- **none:** Valid asset, loadable, usable — nothing more claimed
- **conformance evidence:** Proven to validate and load correctly
- **behavioral evidence:** Proven to change Agent judgment in controlled tests
- **field evidence:** Proven useful by real users in real tasks
- **production:** All structural, behavioral, trust, UX, and maintenance gates passed

No evidence level is required for the asset to exist as a valid KDNA asset.

---

## 5. Single Asset Is The Default Path

A new user MUST be able to receive value without learning Router, Advisor,
Consumer Index, Cluster, Bundle, or Work Pack terminology.

Single-asset consumption is:

```text
select one .kdna → plan-load → load → use → trace
```

Single-asset mode MUST NOT implicitly invoke Router or Cluster behavior.

---

## 6. Cluster Is Advanced

Cluster is a separate, explicitly-enabled advanced capability. A Cluster
manifest (`kdna.cluster.json`) references independently loadable `.kdna` assets
and defines selection, composition, conflict, and budget rules.

Cluster MUST NOT:
- Be the default consumption path
- Be invoked implicitly in single-asset mode
- Embed Cluster policy inside `.kdna` containers
- Load assets that cannot independently authorize and validate

---

## 7. Evidence And Catalog Are Optional Layers

### 7.1 Evidence

- Asset Assay: measures whether an asset changes Agent judgment against baselines
- Evidence Claim: a bounded, verifiable statement about observed behavior
- Field Validation: evidence from real users in real tasks

Evidence is always optional. An asset without evidence is a valid KDNA asset.

### 7.2 Catalogs And Registries

Catalogs and registries provide discovery, version, download, and metadata. They
are optional distribution channels, not approval bodies.

Official listing, official example, official recommendation, and behaviorally
validated MUST be four distinct concepts. Registry inclusion MUST NOT imply any
of the others.

---
