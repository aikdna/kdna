# KDNA Governance & Safety Framework

KDNA is an open standard for human-locked domain judgment assets. Because KDNA can influence AI agent judgment, the ecosystem is designed around human accountability, provenance, risk-based review, quality gates, and transparent loading.

This framework is not a disclaimer — it is the constitutional layer of the KDNA ecosystem.

## 1. Human Accountability

**AI may propose judgment candidates. Humans must review, revise, lock, and take authorship responsibility.**

AI 可以提出判断候选，人必须审查、修改、锁定，并对发布的判断承担作者责任。

Every KDNA domain published to the registry carries the author's explicit confirmation via Human Lock. The author, not the AI, is accountable for the encoded judgment.

## 2. No One-Click Domain Generation

KDNA-compatible authoring tools and all compliant authoring tools MUST NOT offer automated domain generation that bypasses human review.

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

### Official Quality Badges

Official KDNA quality badges (`untested`, `tested`, `validated`, `expert_reviewed`, `production_ready`) are issued only by the official registry or authorized registries. Forked tools may compute local validation results, but cannot claim official badge status unless signed by an authorized registry. Badge issuance requires:

1. Domain passes structural validation (`kdna dev validate`)
2. Domain passes provenance verification (Ed25519 signature)
3. For `tested`: at least 10 manually verified eval cases
4. For `validated`: at least 30 eval cases, benchmark report, rubric, and raw outputs
5. For `expert_reviewed`: validated evidence plus external domain expert review
6. For `production_ready`: expert-reviewed evidence plus real-world deployment evidence

This ensures that badge status is a trust signal, not a self-declared label.

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

Governance proposals: Open an issue in [aikdna/kdna](https://github.com/aikdna/kdna/issues)

Registry moderation requests: Open an issue in [aikdna/kdna-registry](https://github.com/aikdna/kdna-registry/issues)

## 9. Public documentation rules

Public-facing documentation in this repository (`docs/`, `specs/`,
`README.md`, `README.zh.md`, and public audit notes under
`docs/audits/`) is read by external contributors, downstream
consumers, and the open-source community. It MUST describe only
public facts: published RFCs, merged PRs, public commit hashes on
the remote, public issues, and accepted governance decisions.

This section is the canonical rule. It is enforced by the
pre-merge grep checklist at the end.

### 9.1 What public documentation MUST NOT include

Public-facing documentation MUST NOT include:

- Internal file paths outside the repository (for example, paths
  under a maintainer's local thinking space, private notes, or
  any other private directory).
- Private workspace paths or local machine paths (for example,
  `/Users/<name>/...` or any other absolute path that reveals
  the maintainer's local environment).
- Internal work-plan section references (for example,
  `Per the work plan §4.2 PR-3 boundary` or any other reference
  to a private planning document's section numbering).
- Internal planning document names, by file or by category.
- Internal review document names, or finding numbers tied to
  those documents (for example, references to a private
  reverse-audit or upgrade-recommendations document, or
  references to specific gaps / findings / items / F-numbers
  defined only in those private documents).
- Private conversation instructions or agent directives, in any
  language, including direct quotes from maintainer or agent
  instructions.
- Personal names, personal book titles, or personal authoring
  narratives in marketing, whitepaper, or audit documents,
  unless they are already public metadata and necessary for
  attribution.
- Maintainer team identity in audit notes, unless already public
  and necessary (use `the project maintainer` or `a single
  maintainer`).
- Local-only commit hashes that are not on the public remote.
- Local backup tag names.
- Unpublished roadmap decisions that are not already accepted
  into an RFC, an open issue, or a merged PR.

### 9.2 What public documentation SHOULD use

Public-facing documentation SHOULD use:

- Public RFC references (for example, `RFC-0013 §9 #4`).
- Public PR references (for example, `PR-1 / PR-2 / PR-3 /
  PR-4 / PR-4b` and the actual public PR number).
- Public commit hashes on the remote (for example, the merge
  commit SHA visible via `git log origin/main`).
- Public issue links.
- Neutral phrases such as:
  - `RFC-0013 implementation scope`
  - `RFC-0013 implementation boundary`
  - `the RFC-0013 PR-N scope`
  - `follow-up PR`
  - `external review pending`
  - `public status remains Draft`
  - `public-facing status policy`
  - `the public status policy`

### 9.3 Examples

**Bad (must not appear in public docs):**

- `Work plan: Kdna内部思考/KDNA 协议升级工作计划 2026-06-16.md §4.2`
- `Per the user's instruction`
- `KDNA_STUDIO_CORE_PATH=/Users/AI/K/OPEN/kdna-studio-core`
- `backup-before-reset` (a local backup tag, not pushed to origin)
- `single maintainer (aikdna / aikdna)`
- `不要在外部审计前再引入复杂 book-derived 变量` (a directive
  from a private conversation)
- `atomspeak-kdna-v4.0` (a private version string on a public
  reference domain)
- `the反审计 file's 缺口三` (a reference to a private review
  document's finding number)

**Good (preferred public-facing wording):**

- `RFC-0013 implementation scope: PR-3 SAG/TC compile gates`
- `Per the public status policy`
- `KDNA_STUDIO_CORE_PATH=/path/to/kdna-studio-core`
- `a local backup tag (not pushed to origin)`
- `single maintainer`
- `Complex book-derived domain testing is deferred to a follow-up PR.`
- `atomspeak` (without a private version string)
- `an internal review's third finding` (a generic reference,
  not a private document name or finding number)

### 9.4 Required pre-merge grep checklist

Before merging any PR that adds or modifies public-facing
documentation, the contributor MUST run the following grep from
the repository root and paste the output in the PR description:

```bash
grep -RIn \
  -e "Kdna内部思考" \
  -e "KDNA 协议升级工作计划" \
  -e "Per the user's instruction" \
  -e "用户指令" \
  -e "等你指令" \
  -e "不要在外部审计前" \
  -e "/Users/AI/K" \
  -e "aikdna" \
  -e "aikdna" \
  -e "work plan" \
  -e "Work plan" \
  -e "反审计" \
  -e "升级建议" \
  -e "backup-before-reset" \
  docs specs README.md README.zh.md 2>/dev/null
```

Notes on the checklist:

- A non-empty grep result does not automatically block the PR.
  Each hit MUST be either removed or explicitly justified as a
  false positive in the PR description.
- Public concept names (for example, `WorkPack` the KDNA
  concept, or "WorkPack implementation") are not hits against
  the `work plan` keyword and are allowed.
- Synthetic example paths (for example, `/Users/me/.kdna` or
  `/Users/alice/writing-samples/`) in clearly-marked template
  or example code are allowed when they are obviously
  synthetic. Real local paths (for example,
  `/Users/<maintainer>/<project>/...`) are not.
- A contributor who is uncertain whether a hit is a false
  positive SHOULD default to rewording rather than rely on
  the "obvious" exception.
