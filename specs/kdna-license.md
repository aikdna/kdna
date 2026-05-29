# KDNA License Specification

Version: 0.2
Status: Draft

## 1. Purpose

This specification defines the license framework for KDNA assets.
It separates the open-source protocol license from the domain asset license,
and defines the KDNA Commercial License for protected domain judgment.

## 2. Dual Licensing Architecture

KDNA follows a strict two-layer licensing model:

```
┌─────────────────────────────────────┐
│        KDNA Protocol (Apache 2.0)    │  ← Open source, always free
│  format, schema, validators, loader  │
├─────────────────────────────────────┤
│     KDNA Domain Assets (per-asset)   │  ← Creator's choice
│   .kdna files and runtime projections│
└─────────────────────────────────────┘
```

### Layer 1: Protocol (Apache 2.0)

The KDNA specification, JSON schemas, validator code, loader library, CLI tools,
and documentation in the main `KDNA` repository are licensed under **Apache License 2.0**.

This ensures:
- Anyone can implement KDNA support in any Agent
- The format and tooling are always free and open
- Commercial adoption is unencumbered by protocol licensing

### Layer 2: Domain Assets (Creator's Choice)

Each `.kdna` file or runtime-projected asset carries its own license.
The creator chooses the license that governs how their domain judgment asset
may be used, shared, and monetized.

## 3. Recommended Open Licenses

For open-access KDNA domains, we recommend:

| License | Use case |
|---------|----------|
| **CC BY 4.0** | Attribution required. Good for community domains. |
| **CC BY-SA 4.0** | Attribution + share-alike. Derivative works must stay open. |
| **CC0** | Public domain. Maximum openness, no restrictions. |

These licenses are suitable for:
- Official KDNA domains (writing, code_review, agent_safety, etc.)
- Community-contributed domains
- Educational and reference KDNA

## 4. KDNA Commercial License (KCL) v1.0 Draft

For commercial KDNA domains, we define the **KDNA Commercial License (KCL)**.
This is a custom license designed for the unique nature of KDNA as an AI Agent
cognitive asset.

### 4.1 Grant

Subject to payment of the applicable fee and compliance with this license,
the Licensor grants the Licensee a **non-exclusive, non-transferable, revocable**
right to:

1. **Load** the KDNA into an AI Agent for the Licensee's own use
2. **Use** the Agent's KDNA-informed output in the Licensee's work
3. **Receive updates** to the KDNA during the license period

### 4.2 Prohibitions

The Licensee MUST NOT:

1. **Redistribute** the KDNA or any derivative thereof to any third party
2. **Reverse engineer** the KDNA to extract, summarize, or reconstruct its
   judgment structure, axioms, frameworks, or decision logic
3. **Generate a substitute KDNA** by prompting an LLM to extract or summarize
   the KDNA's rules and patterns
4. **Use for model training** — the KDNA content and Agent outputs informed by
   it must not be used to train, fine-tune, or improve any AI model
5. **Embed in commercial products** — the KDNA must not be embedded in any
   SaaS, API, or product that exposes KDNA-informed judgment to third parties
   without an Enterprise License
6. **Bypass Runtime protections** — if the KDNA uses `runtime` access mode,
   the Licensee must not attempt to access the full content or reconstruct it
   from projections

### 4.3 License Types

| Type | Users | Agents | Period | Price model |
|------|-------|--------|--------|-------------|
| **Personal** | 1 individual | Up to 3 Agents | Perpetual or annual | One-time / subscription |
| **Team** | Up to 10 individuals | Unlimited (within team) | Annual | Per-seat subscription |
| **Enterprise** | Unlimited (organization) | Unlimited | Annual | Custom pricing |
| **API** | Per-call | N/A | Usage-based | Per 1,000 calls |

### 4.4 Termination

The license may be terminated:
- By the Licensee: stop using the KDNA and delete all copies
- By the Licensor: if the Licensee violates the license terms
- Automatically: at the end of the license period (for time-limited licenses)

Upon termination, the Licensee must delete all copies of the KDNA from all
systems and Agents.

### 4.5 No Warranty

THE KDNA IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. THE LICENSOR DOES
NOT GUARANTEE THAT THE KDNA WILL PRODUCE CORRECT OR APPROPRIATE AGENT BEHAVIOR.

### 4.6 Limitation of Liability

IN NO EVENT SHALL THE LICENSOR BE LIABLE FOR ANY DAMAGES ARISING FROM THE USE
OR INABILITY TO USE THE KDNA, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

## 5. License Declaration in KDNA Files

### In .kdna file:

```yaml
license:
  type: "KCL-1.0"
  url: "https://aikdna.com/licenses/KCL-1.0"
  allow_agent_use: true
  allow_redistribution: false
  allow_training: false
  commercial: true
```

### In kdna.json manifest:

```json
{
  "license": {
    "type": "CC-BY-4.0",
    "url": "https://creativecommons.org/licenses/by/4.0/",
    "allow_agent_use": true,
    "allow_redistribution": true,
    "allow_training": false,
    "commercial": false
  }
}
```

### License Type Identifiers

| Identifier | Description |
|------------|-------------|
| `CC-BY-4.0` | Creative Commons Attribution 4.0 |
| `CC-BY-SA-4.0` | Creative Commons Attribution-ShareAlike 4.0 |
| `CC0-1.0` | Creative Commons Zero (Public Domain) |
| `KCL-1.0` | KDNA Commercial License v1.0 |
| `KCL-E-1.0` | KDNA Commercial License — Enterprise v1.0 |
| `Apache-2.0` | Apache License 2.0 (for protocol, not recommended for domain assets) |
| `MIT` | MIT License |
| `custom` | Custom license (URL required) |

## 6. License Compatibility

When composing multiple KDNA domains in a single Agent session:

- `open` mode KDNA can be composed with any other KDNA
- `licensed` mode KDNA can be composed if both licenses permit it
- `runtime` mode KDNA can be composed via multi-projection (each domain projects independently)
- Mixing `open` and `licensed` KDNA does not impose the licensed KDNA's terms on the open KDNA

## 7. Enforcement

### Technical Enforcement

- `licensed` and `runtime` modes provide technical enforcement of license terms
- `open` mode relies on social norms and copyright law
- Watermarking helps detect unauthorized redistribution

### Legal Enforcement

- KDNA Commercial License is a legal contract
- Violations may be pursued under applicable copyright and contract law
- Chain-of-custody logging provides evidence for enforcement

## 8. Creator Revenue Model

The license framework supports these revenue models:

1. **One-time purchase:** Personal license, perpetual use
2. **Subscription:** Annual Team license with continuous updates
3. **API metering:** Per-call pricing via Runtime
4. **Enterprise:** Custom pricing for organization-wide deployment
5. **Royalty split:** Multi-creator KDNA with automated revenue sharing

Revenue sharing details are defined in the KDNA Marketplace specification
(future).
