# KDNA: An Open Format for Domain Cognition in AI Agents

*Making Domain Judgment Explicit, Portable, Verifiable, and Reusable*

**White Paper v1.0 — May 2026**

---

## Abstract

AI agents are becoming capable enough to search, reason, generate, call tools, and execute multi-step work. As this capability grows, a deeper question emerges: not only what an agent can do, but how it should judge what is worth doing, what should be rejected, and what counts as done right within a specific domain.

Today, domain judgment already exists. It appears in expert habits, team conventions, prompts, style guides, rubrics, checklists, retrieved documents, workflow rules, tests, fine-tuned behavior, and tool-specific policies. These mechanisms can and should continue to be used.

But domain judgment is usually fragmented across them: partly written in prompts, partly hidden in documents, partly embedded in tools, partly internalized by models, and partly retained only in the minds of experienced practitioners. When an agent fails, it is difficult to inspect which judgment rule was missing, outdated, or ignored.

KDNA is an open format for representing domain judgment. It encodes the principles, conceptual boundaries, misunderstanding patterns, scenario signals, reasoning chains, and self-checks that shape expert judgment — in a form that AI agents can load, humans can inspect, and tools can validate. Its contribution is not the claim that judgment has never existed in AI systems, but that judgment now deserves its own portable, verifiable representation.

The specification is open, the reference toolchain is published under Apache 2.0, and an early public registry of open-access domains is available. KDNA does not replace prompts, knowledge bases, skills, MCP, tools, retrieval, evaluation, or fine-tuning. It gives them a clearer judgment reference.

---

## 1. Why Domain Judgment Needs a Format

### 1.1 From Capability to Judgment

AI agents are moving from passive response generation toward active work. They can write code, edit documents, call APIs, operate tools, summarize research, and execute workflows. This shift changes the central question.

In earlier AI usage, the main concern was: *Can the model produce a useful answer?* In agentic AI, the question becomes: *How does the agent decide what is worth doing, what should be avoided, and what counts as done right?*

A coding agent may be able to modify files and run tests. A writing agent may be able to produce fluent prose. But in each case, the harder question is domain-specific: what makes a fix sound rather than superficial? What makes an argument substantive rather than decorative? What makes a product decision strategically coherent rather than merely plausible?

As agent capability grows, judgment becomes more important, not less.

### 1.2 Judgment Already Exists, But It Is Fragmented

Domain judgment is not absent. Experts already use it. Teams already rely on it. AI systems already approximate parts of it through many existing mechanisms: system prompts, style guides, code review standards, compliance policies, internal playbooks, checklists, evaluation suites, fine-tuned behavior, and tool-specific validators.

These mechanisms are useful. KDNA does not argue against them.

The problem is that judgment is scattered across them. A principle may live in a prompt. A concept boundary may be described in a style guide. A failure mode may be known only by a senior reviewer. A check may be implemented in a tool. A preferred reasoning pattern may never have been written down at all. When an agent fails, it is hard to inspect which rule was missing, outdated, or contradicted.

This is not a prompting problem. It is a representation problem.

### 1.3 The Representation Problem

If domain judgment remains only in prompts, it is often fragile and task-specific. A good prompt may work in one session but is difficult to validate, version, reuse, and compose across systems.

If it remains only in documents, the agent may retrieve it but not consistently apply it. A document can contain principles, but it does not by itself distinguish axioms from examples or required self-checks from background explanation.

If it remains only in model weights, it may be powerful but opaque. The behavior can be difficult to inspect, update precisely, or attribute to a specific principle.

If it remains only in people's heads, it becomes vulnerable to loss. When experts leave, their judgment leaves with them. When teams scale, judgment becomes inconsistent.

KDNA addresses this by treating domain judgment as a first-class artifact: something that can be written, reviewed, validated, versioned, distributed, loaded, and improved.

### 1.4 What KDNA Adds

KDNA does not claim that existing approaches are wrong. It claims that as agents become more active, these approaches benefit from a portable judgment representation: one that can be inspected, validated, reused, and composed across systems. Prompts define the current task. Knowledge bases provide information. Skills package procedures. Fine-tuning shapes model behavior. Evaluations measure performance. KDNA represents the domain judgment that should guide how an agent uses these capabilities.

KDNA is close in spirit to rules files, rubrics, style guides, and structured prompts. Its contribution is not that principles have never been written down before. It is that KDNA defines a common open package format, validation rules, loading semantics, and composition model for domain judgment.

---

## 2. What KDNA Is

### 2.1 Definition

KDNA is an open, file-based format for encoding domain judgment as structured, verifiable packages. A KDNA domain is a directory containing a small set of standard JSON files. Together, they describe the principles, concepts, boundaries, misunderstandings, scenarios, reasoning patterns, and self-checks that guide judgment in a specific domain.

A domain does not try to store all information. It does not try to replace an expert. It captures the judgment structures that experts repeatedly use when deciding: what matters, what should be rejected, what distinctions must be preserved, what mistakes commonly occur, what signals should change strategy, what reasoning path to follow, what must be checked before finalizing output.

KDNA is compact by design. A useful domain may contain only two files. Richer domains contain up to six. The goal is not volume — it is clarity, specificity, and reusability.

### 2.2 What KDNA Encodes

**Axioms** — Inviolable principles. Not inspirational statements. These are judgment anchors that define what must remain true when the agent reasons. Example: *A bug fix should address the root cause, not merely suppress the visible symptom.*

**Ontology** — Core concepts and their boundaries. What a concept is, what it is not, and which distinctions must not be blurred. Example: *Emotional resonance helps the reader recognize a real experience. Anxiety-selling pressures the reader by making them feel inadequate.*

**Frameworks** — Decision procedures with trigger conditions, steps, and expected outputs.

**Stances** — Default positions. What the domain tends to prefer or reject before a specific task begins. Example: *Prefer concrete tension over decorative adjectives.*

**Terminology** — Standard terms with operational definitions, and banned terms with concrete replacements. Words often carry hidden assumptions. A domain can reject certain terms not for style reasons, but because they encode the wrong mental model.

**Misunderstandings** — Common wrong interpretations, paired with correct interpretations and the key distinction to preserve. Helps the agent detect when output is drifting into a known error pattern.

**Self-checks** — Yes/no questions the agent must answer before finalizing output. Verifiable, not vague. Example: *Does the recommendation identify the trade-off, rather than presenting only the benefit?*

**Scenario signals** — Observable input patterns that should change how the agent responds.

**Reasoning chains** — Structured paths from premise to conclusion to practical consequence.

**Capability stages** — Definitions of what improvement looks like, enabling evaluation over time.

### 2.3 Domain Structure

A KDNA domain is a directory named in lowercase snake_case. A complete domain may contain up to six standard files:

| File | Encodes | Required |
|------|---------|:--------:|
| `KDNA_Core.json` | Axioms, ontology, frameworks, core structure, stances | Yes |
| `KDNA_Patterns.json` | Terminology, misunderstandings, self-checks | Yes |
| `KDNA_Scenarios.json` | Scenario signals that trigger strategy shifts | No |
| `KDNA_Cases.json` | Concrete cases demonstrating judgment in action | No |
| `KDNA_Reasoning.json` | Reasoning chains from premise to consequence | No |
| `KDNA_Evolution.json` | Capability stages and measurement | No |

The minimum valid domain contains `KDNA_Core.json` and `KDNA_Patterns.json`. Each file contains a required `meta` object with `version`, `domain`, `created`, `purpose`, and `load_condition`. All files are validated against published JSON Schemas.

The canonical form is a directory of JSON files — source-first, transparent, version-controllable. For distribution, the toolchain can package a domain into a `.kdna` container (ZIP-based single file with packaging metadata).

### 2.4 Why a File Format Matters

A file format may seem modest compared with a model, agent framework, or platform. But formats matter because they make things portable. Documents became portable because they had document formats. Packages became reusable because ecosystems had package formats. APIs became interoperable because they had interface descriptions. Configuration became manageable because behavior could be separated from code.

KDNA applies this logic to domain judgment. Just as configuration files separate environment-specific behavior from application code, KDNA separates domain judgment from temporary prompts and agent implementations. It gives judgment a place to live.

### 2.5 What KDNA Is Not

| KDNA is not | Why |
|-------------|-----|
| **Not a prompt library** | Prompts are task-scoped. KDNA is domain-scoped and versioned. |
| **Not a knowledge base** | Knowledge bases store information. KDNA encodes judgment constraints. |
| **Not a workflow engine** | Workflows define steps. KDNA defines judgment across steps. |
| **Not a fine-tuned model** | Fine-tuning internalizes behavior in model weights. KDNA keeps selected judgment principles explicit and auditable. |
| **Not an agent framework** | KDNA is a format — not an agent. Any framework can implement loading. |
| **Not a guarantee of correctness** | KDNA provides an explicit reference. Quality depends on the judgment encoded. |

---

## 3. How KDNA Works

### 3.1 Validation

KDNA domains can be verified at multiple levels:

- **Structural linting** — Required files present, fields populated, IDs unique, self-checks answerable with yes/no, cross-file references valid, and flags for potentially vague axioms or non-actionable checks.
- **Schema validation** — Fields match JSON Schema types, arrays have required items, cross-file references are consistent.
- **Quality evaluation** — Benchmark-based scoring against human-annotated test cases, measuring whether agent output follows domain principles.

The first two levels are fully automated. The third is emerging. Schema compliance does not guarantee quality. A domain can be structurally valid but weak in judgment. KDNA separates structural validity from judgment quality.

### 3.2 Loading

When an agent loads a KDNA domain, the loader reads and validates the domain files, renders them into a structured context block using a standard template, and makes that context available to the agent at runtime. The rendered context preserves the domain's structure as distinct, named sections. Multiple domains can be loaded simultaneously — each contributes an independent judgment reference.

### 3.3 Composition and Clusters

Rich judgment often comes from composing several smaller domains. A coding agent may need bug diagnosis judgment, test-driven development judgment, security review judgment, and technical writing judgment. Each should remain separate.

A **cluster** groups multiple domains and declares how they should be composed:

- **Primary domains** are always loaded.
- **Secondary domains** are loaded only when scenario signals match the task.
- **Boundary preservation** — each domain's axioms, terminology, and self-checks remain distinct. When domains conflict, the agent reports the conflict rather than silently merging incompatible principles.

### 3.4 Examples

**Writing.** An AI agent asked to write a product announcement may produce fluent copy. But without explicit judgment criteria, it may use anxiety-selling language, decorate text with impressive-sounding phrases that do not change understanding, or fail to create a real decision question for the reader. A writing KDNA domain can encode these distinctions: axioms about structural argument, banned patterns such as abstract praise without concrete meaning or transformation claims without a specified before-and-after change, and self-checks like "Can the core tension be stated in one concrete sentence?" The agent works against a declared editorial judgment structure.

**Code Review.** An AI agent reviewing a pull request may have access, tests, linters, and a long prompt. But it may approve a fix that removes a symptom while preserving the underlying cause — because no judgment rule explicitly required root cause analysis. A code review domain can encode axioms such as "A fix that removes a symptom while preserving the failure condition is not complete," misunderstandings like "Confusing tests passed with risk removed," and self-checks like "Has the change introduced a new hidden dependency?"

---

## 4. Where KDNA Fits

KDNA is easiest to understand alongside existing agent components:

| Component | Primary Role | What It Usually Does Not Standardize |
|-----------|-------------|-------------------------------------|
| **Prompts** | Define the current task or behavior | Reusable domain judgment as a versioned artifact |
| **Knowledge Bases** | Provide information and references | Structured judgment constraints, self-checks, composition rules |
| **Skills** | Package repeatable procedures | The domain principles for accepting or rejecting results |
| **MCP / APIs** | Connect agents to tools and data | Domain-specific evaluation principles |
| **Fine-tuning** | Internalize behavior patterns | Inspectable and precisely editable judgment rules |
| **Evaluation Suites** | Measure performance | The portable judgment package being measured |
| **KDNA** | Represent domain judgment | It does not execute tasks or replace model capability |

KDNA is not a competitor to these components. It is a complement. A prompt tells the agent what to do now. A skill tells it how to perform a procedure. MCP connects it to tools. A knowledge base provides reference material. Fine-tuning shapes behavior. Evaluations measure outcomes. KDNA gives the agent a structured domain judgment reference for deciding what matters, what to reject, and what counts as good within a specific field.

---

## 5. Why Explicit Domain Judgment Matters

### 5.1 Inspectability

When judgment is hidden in prompts, model behavior, or undocumented expert habits, it is difficult to inspect. KDNA makes judgment readable. A human can open a domain and ask: Are these principles correct? Are the concept boundaries clear? Are the self-checks concrete? An agent's output may still need review, but the judgment reference guiding it is no longer invisible.

### 5.2 Portability

A prompt may work in one tool but not another. A team convention may exist in one department but not another. A fine-tuned behavior may be bound to one model. KDNA makes domain judgment portable — stored in a repository, packaged as a `.kdna` container, installed through tooling, loaded by different agents, and versioned over time.

### 5.3 Verifiability

Unstructured judgment is difficult to check. KDNA introduces multiple levels of verification: schema validation, structural linting, cross-file consistency, self-check quality rules, benchmark-based evaluation, human review, and version history. This does not make judgment automatically correct. But it makes judgment reviewable. A domain can be compared, improved, and given quality badges based on evidence.

### 5.4 Composability

Real work is multi-domain. A single task may involve technical accuracy, strategic judgment, audience understanding, legal caution, and brand voice. If all are merged into one prompt, the result becomes brittle. KDNA allows domains to remain separate while being loaded together, each contributing an independent judgment reference.

### 5.5 Inheritance

Organizations often underestimate where their expertise lives. It is in the repeated judgments of experienced people: what they notice first, what they reject immediately, what trade-offs they consider, what mistakes they have learned to avoid. When these people leave, much of this judgment leaves with them. KDNA does not fully preserve a person's expertise — no format can. But it can preserve recurring judgment principles, concept boundaries, failure patterns, and self-checks. That is enough to make expert judgment more teachable, reviewable, and available to AI agents.

---

## 6. Public and Private Domains

KDNA supports both modes:

**Public domains** are shared openly through a registry under explicit content licenses (such as CC-BY-4.0 or other open licenses). They serve as reference implementations, learning resources, community-maintained judgment packages, and examples of high-quality authoring.

**Private domains** encode proprietary or organization-specific judgment: an internal design review standard, a company's brand voice judgment, a compliance interpretation framework, a senior architect's review principles. They can be stored in private repositories or internal registries.

The format and tooling are identical for both. Only the distribution channel differs.

---

## 7. Limits and Risks

A serious format must define its limits.

**Not all expertise can be fully formalized.** Some judgment is deeply tacit — depending on perception, context, timing, or years of practice. KDNA is most useful when a domain has recurring principles, stable concept boundaries, known failure modes, and reviewable output criteria.

**Explicit judgment can become rigid.** A poorly written domain may over-constrain the agent, reject useful variation, or preserve outdated assumptions. Domains need versioning, review, feedback, and evolution.

**Schema validity is not quality.** A domain can pass validation and still be bad — vague principles, shallow distinctions, weak self-checks. Tooling checks structure. Quality requires expert review and real usage evaluation.

**Context limits matter.** Loading too many domains can dilute judgment rather than improve it. Clusters must be selective. Better-selected KDNA is better than more KDNA.

**Domains can conflict.** A brand domain may encourage emotional intensity while a compliance domain requires conservative wording. KDNA should expose these conflicts, not hide them. Conflict reporting is part of responsible judgment composition.

**KDNA does not replace accountability.** Even with KDNA, humans remain accountable for high-stakes decisions. KDNA improves inspectability. It does not eliminate responsibility.

---

## 8. The Ecosystem

### 8.1 Open Format and Toolchain

KDNA is defined by an open protocol specification (SPEC v1.0-rc) and JSON Schemas covering all standard domain files. The reference implementation and toolchain are published under Apache 2.0. Any agent or framework that can read structured files and inject context can implement KDNA loading.

| Tool | Purpose | Status |
|------|---------|:------:|
| `@aikdna/kdna-core` | Pure logic library (zero deps) for loading, validating, linting, rendering, composing domains | Published (npm, v0.2.2) |
| `@aikdna/kdna` CLI | Command-line tool: validate, verify, pack, unpack, install, compare, match, setup | Published (npm, v0.7.0) |
| `@aikdna/agent` | TypeScript SDK with KDNAAgent class for custom agent integration | Published (npm, v0.1.1) |
| kdna-vscode | VS Code extension: validate, preview, create domains in-editor | Marketplace published |
| kdna-website | aikdna.com: domain browser, viewer, docs, tools, studio | Deployed |

All tools share the same core library, ensuring consistent behavior.

### 8.2 Registry

The public KDNA registry (`domains.json`) is a machine-readable index of available domains. Currently includes 9 open-access domains classified by two axes: **domain field** (which context) and **judgment pattern** (what type of judgment). Registry entries carry metadata: name, author, version, status, keyword tags, quality badge, and evaluation history where available. The registry is early and growing.

### 8.3 Quality Signals

KDNA domains should not be treated as equally valuable simply because they pass schema validation. Quality requires additional signals: expert review, benchmark performance, usage evidence, version history, community feedback, and clear authorship. The format guarantees structure. It does not guarantee expertise.

---

## 9. Economic Vision

### 9.1 Judgment as a Reusable Asset

The internet made information abundant. AI makes generation abundant. But judgment remains scarce — not because it cannot be expressed, but because it is often not structured as a reusable asset. A KDNA domain can encode how a person, team, or community judges within a domain. If useful, it can be reused across tasks, agents, teams, and organizations. This gives domain judgment some properties of intellectual property: authorship, versioning, review, licensing, attribution, reputation, and improvement over time.

### 9.2 Creator Domains

A respected editor could publish a writing judgment domain. A senior engineer could publish a code review domain. A product leader could publish a prioritization domain. These would not be templates — they would be structured judgment packages carrying the creator's principles, distinctions, and self-checks. As registries and evaluation systems mature, high-quality domains could accumulate reputation. If domains prove useful in real workflows, creators who build verified, well-reviewed domains may accrue value that compounds across their body of work.

### 9.3 Enterprise Private Domains

Organizations hold cognitive assets they rarely recognize as assets: how senior engineers review architecture, how compliance teams interpret risk, how product teams prioritize trade-offs. These judgment patterns are scattered across people, documents, workflows, and review comments. Private KDNA domains allow organizations to encode this expertise in a format that can be loaded by AI agents and reviewed by humans. This is not automation of expertise — it is preservation, distribution, and operationalization of expertise.

### 9.4 Long-Term Evolution

1. **Format Layer** (today) — Standardized encoding of domain judgment.
2. **Verification Layer** (emerging) — Benchmark results, review processes, quality badges.
3. **Discovery Layer** (building) — Registry, faceted browsing, domain preview.
4. **Market Layer** (future) — Licensing, attribution, revenue sharing.
5. **Asset Layer** (horizon) — Cognitive assets as a recognized category of reusable intellectual property.

We are at Layer 1–2, building deliberately. We do not describe KDNA as a financial instrument.

---

## 10. Current Status

| Component | Status |
|-----------|:------|
| Protocol specification (SPEC v1.0-rc) | Published |
| JSON Schema definitions (6 standard files) | Published |
| CLI tool (validate, verify, pack, unpack, install, compare, match, setup) | Published (npm, v0.7.0) |
| Core library (load, validate, lint, render, compose) | Published (npm, v0.2.2) |
| TypeScript Agent SDK | Published (npm, v0.1.1) |
| VS Code extension | Marketplace published |
| Website (domain browser, viewer, docs, tools, studio) | Deployed (aikdna.com) |
| Public registry (9 domains, dual-axis classification) | Published, early |
| Domain quality validation system | Implemented, running continuously |
| Cluster format and composition | Implemented, experimental |

---

## 11. Roadmap

**Near term (0–3 months):** Publish 3–5 high-quality reference domains. Strengthen benchmark methodology toward independent auditability. Provide before/after demonstrations. Launch enterprise pilot with private domain registry.

**Mid term (3–12 months):** Establish expert review processes for domain quality assurance. Add outcome tracking infrastructure (judgment-outcome pairs). Grow cluster compositions demonstrating multi-domain judgment.

**Long term (12+ months):** Develop licensing and attribution infrastructure for domain creators. Support private registries for enterprise deployments. Establish domain cognition as a recognized category in AI agent architecture.

---

## Conclusion

AI agents are becoming more capable, more connected, and more active. That progress does not make human judgment less important. It makes the representation of human judgment more important.

Domain judgment already exists in many places: prompts, documents, tools, policies, workflows, evaluations, model behavior, and expert habits. But it is often fragmented, implicit, task-scoped, platform-dependent, and difficult to validate or compose.

KDNA addresses this representation problem. It gives domain judgment an open format — one that can be authored, validated, loaded, composed, versioned, shared, and improved. It does not replace existing mechanisms. It gives them a clearer judgment reference.

The project is early. The format and toolchain exist. The next challenge is proof through high-quality domains and real usage — demonstrating that explicit domain judgment improves agent behavior in measurable, inspectable, and repeatable ways.

---

*KDNA is an open-source project under Apache 2.0 license. The specification, schemas, and reference toolchain are all published under this license. Individual domains may carry their own content licenses.*  
*Website: https://aikdna.com*  
*GitHub: https://github.com/aikdna/kdna*  
*npm: @aikdna/kdna, @aikdna/kdna-core, @aikdna/agent*
