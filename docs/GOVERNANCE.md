# KDNA Governance & Safety Framework

KDNA is an open standard for human-locked domain judgment assets. Because KDNA can influence AI agent judgment, the ecosystem is designed around human accountability, provenance, risk-based review, quality gates, and transparent loading.

This framework is not a disclaimer — it is the constitutional layer of the KDNA ecosystem.

## 1. Human Accountability

**AI may propose judgment candidates. Humans must review, revise, lock, and take authorship responsibility.**

AI 可以提出判断候选，人必须审查、修改、锁定，并对发布的判断承担作者责任。

Every KDNA domain published to the registry carries the author's explicit confirmation via Human Lock. The author, not the AI, is accountable for the encoded judgment.

## 2. No One-Click Domain Generation

KDNA Studio and all compliant authoring tools MUST NOT offer automated domain generation that bypasses human review.

A valid KDNA domain requires:
- Evidence collection
- Structured interview or expert extraction
- Judgment Card authoring
- Human Lock on every card
- Feynman Restatement
- Quality Gate evaluation
- Test Lab verification
- Versioned release

These are governance mechanisms, not optional product features.

## 3. Intended Use & Out-of-Scope Declaration

Every KDNA domain MUST declare:
- **Intended use**: What situations the domain is designed for
- **Out-of-scope**: What situations the domain explicitly does NOT cover
- **Risk boundaries**: Known failure modes where application would be dangerous
- **High-risk domain restrictions**: If applicable, explicit warnings
- **Known limitations**: What the domain cannot do or was not tested for
- **Author responsibility**: Who stands behind the encoded judgment

## 4. Risk-Based Review (R0–R3)

| Level | Risk | Examples | Requirements |
|-------|------|----------|-------------|
| **R0** | Low | Writing, note-taking, content structure, personal productivity | Human Lock + validate |
| **R1** | Medium | Career development, management, education, business communication, sales | R0 + Feynman + Test Lab + known_limitations |
| **R2** | High | Relationships, mental well-being, enterprise compliance, financial decisions | R1 + expert_review + stronger_warnings + evidence_coverage |
| **R3** | Restricted | Medical diagnosis, legal judgment, investment advice, child safety, public safety, weapons, surveillance, political manipulation | Default: not allowed in public registry without special review |

## 5. Provenance & Signature

Every .kdna container MUST carry:
- Author identity
- Studio Core version used
- Source evidence references
- Locked card count
- Content fingerprint (sha256)
- Build timestamp
- Signature (Ed25519, scope-trusted)
- Registry source (if applicable)

Provenance establishes trust. Without it, .kdna is just an anonymous blob.

## 6. Runtime Transparency

When an agent loads a KDNA domain, the loading system SHOULD record:
- Which domain was loaded and at what version
- The domain's risk level and quality badge
- Whether the domain is signed and from a trusted scope
- Which axioms, misunderstandings, and self-checks were triggered
- Whether the domain was yanked or deprecated

This enables audit, debugging, and accountability.

## 7. Registry Moderation

The canonical KDNA registry classifies domains by review status:

| Status | Meaning |
|--------|---------|
| **Unlisted** | Installable but not displayed in default listings |
| **Community** | Community-submitted, basic validation passed |
| **Verified** | Signature, provenance, quality gate passed |
| **Reviewed** | Human review completed |
| **Trusted** | Long-term maintenance, stable version history, no complaints |
| **Restricted** | High-risk, private registry or special review only |
| **Deprecated** | Superseded by replacement |
| **Yanked** | Severe risk — blocked from new installations |

## 8. User Control & Non-Automatic Authority

KDNA domains influence judgment. They do NOT grant automatic authority.

The loading priority is:
1. System policy and safety rules (highest)
2. Legal and compliance requirements
3. User's explicit intent
4. KDNA domain judgment
5. Tool/skill instructions
6. General context (lowest)

KDNA MUST NOT override system safety policies, legal requirements, or user's explicit refusal.

## Responsibility Model

| Role | Responsibility |
|------|---------------|
| **KDNA Protocol Maintainers** | Maintain format, validation rules, safety baselines, registry policy |
| **KDNA Authors** | Account for Human Locked judgment, applicability boundaries, risk declarations |
| **Studio Integrators** | Must not bypass Human Lock; must not forge provenance |
| **Registry Maintainers** | Review, classify, moderate, yank, and provide risk warnings |
| **Agent/App Developers** | Implement loading strategy, permission controls, user warnings, logging |
| **End Users / Deployers** | Judge applicability in their specific context, especially high-risk scenarios |

## Reporting

Security vulnerabilities: See [SECURITY.md](./SECURITY.md)

Governance proposals: Open an issue in [knowledge-dna/KDNA](https://github.com/aikdna/KDNA/issues)

Registry moderation requests: Open an issue in [knowledge-dna/kdna-registry](https://github.com/aikdna/kdna-registry/issues)
