# KDNA: An Open Protocol for Domain Judgment in AI Agents

*Making Expert Judgment Explicit, Portable, Verifiable, Composable, and Reusable*

**White Paper v1.2 — May 2026**  
**Website:** https://aikdna.com  
**GitHub:** https://github.com/aikdna/kdna

---

## Abstract

AI agents are becoming capable enough to understand language, generate outputs, call tools, retrieve knowledge, operate software, and execute multi-step work. As this capability grows, a deeper question becomes more important: not only what an agent can do, but how it should judge what is worth doing, what should be rejected, which risks matter, and what counts as done right within a specific domain.

Today, domain judgment already exists. It appears in expert habits, team conventions, prompts, style guides, rubrics, checklists, retrieved documents, workflow rules, tests, fine-tuned behavior, and tool-specific policies. These mechanisms can and should continue to be used.

But domain judgment is usually fragmented across them: partly written in prompts, partly hidden in documents, partly embedded in workflows, partly internalized by models, and partly retained only in the minds of experienced practitioners. When an agent fails, it is difficult to inspect which judgment rule was missing, outdated, contradicted, or ignored.

KDNA is an open protocol for representing domain judgment. It encodes the principles, conceptual boundaries, misunderstanding patterns, scenario signals, reasoning chains, risk boundaries, and self-checks that shape expert judgment — in a form that AI agents can load, humans can inspect, and tools can validate.

KDNA does not claim that judgment has never existed in AI systems. Its contribution is that judgment now deserves its own portable, verifiable representation: a domain asset that can be authored, reviewed, validated, versioned, composed, distributed, and improved over time.

KDNA stands for **Knowledge DNA**. The name does not treat knowledge as a static collection of content, but as a structure that can be expressed, inherited, and evolved. The "K" refers to structured domain cognition — the judgment system behind how knowledge is selected, interpreted, rejected, and applied — not to stored information in the narrow sense. In biological systems, DNA is not the organism itself, nor any single behavior; it is an underlying code that allows stable traits to be preserved, expressed, copied, and changed over time. KDNA uses this metaphor for domain judgment: the most valuable part of expertise is often not isolated knowledge, but the recurring judgment structure behind it — how experts draw distinctions, recognize situations, weigh risks, preserve boundaries, form taste, avoid misunderstandings, and decide what counts as done well. KDNA gives this implicit structure a readable, verifiable, composable, and transmissible form.

The specification is open, the reference toolchain is published under Apache 2.0, and an early public registry of open-access domains is available. KDNA does not replace prompts, knowledge bases, skills, MCP, tools, retrieval, evaluation, workflows, or fine-tuning. It gives them a clearer judgment reference.

---

## 0. The Missing Layer in the AI Agent Stack

AI agents already have several major capability layers:

| Layer | What it gives the agent | Examples |
|---|---|---|
| **Model Layer** | General language, reasoning, and generation capability | LLMs, multimodal models |
| **Knowledge Layer** | Access to external facts, context, documents, and memory | RAG, vector databases, search, memory |
| **Tool Layer** | Ability to act on external systems | APIs, MCP, function calling, computer use |
| **Workflow Layer** | Procedures for organizing tasks and execution order | agent frameworks, skills, workflows, automations |
| **Judgment Layer** | Domain-specific standards for classification, trade-offs, risks, boundaries, and output quality | KDNA domains and clusters |

The first four layers allow agents to answer questions, retrieve information, call systems, and execute tasks. But after an agent answers or acts, a different question remains:

- Was this answer good?
- Was this decision sound?
- Was the right standard applied?
- Was the task correctly classified?
- Were the relevant risks considered?
- Did the output cross a boundary that should have blocked it?
- Did it satisfy the domain’s own criteria for being done right?

These questions can be partially answered by a model. Strong LLMs do have judgment. KDNA does not deny that. The question is not whether LLMs can judge. The question is whose judgment they are using, whether that judgment is visible, and whether it can be tested, versioned, composed, and reused.

A model contains implicit judgment. A workflow may contain embedded judgment. A skill may include procedural judgment. A prompt may include task-specific judgment. But when judgment is hidden inside weights, scattered across prompts, or buried in execution procedures, it cannot be governed as an independent asset.

KDNA gives this missing layer a name and a structure: the judgment layer.

---

## 1. Why Domain Judgment Needs a Format

### 1.1 From Capability to Judgment

AI agents are moving from passive response generation toward active work. They can write code, edit documents, call APIs, operate tools, summarize research, and execute workflows. This shift changes the central question.

In earlier AI usage, the main concern was: *Can the model produce a useful answer?* In agentic AI, the question becomes: *How does the agent decide what is worth doing, what should be avoided, and what counts as done right?*

A coding agent may be able to modify files, inspect diffs, run tests, and call linters. But the harder question is domain-specific: is the change safe to merge? Does it address the root cause, or merely suppress a symptom? Is the comment a meaningful blocker, or just review noise?

A meeting assistant may be able to transcribe, summarize, and extract action items. But the harder question is judgmental: did this conversation actually produce a decision, or did it remain a discussion? Was responsibility assigned, or only implied?

A writing assistant may be able to produce fluent prose, correct grammar, and suggest stronger wording. But the harder question is editorial: is the problem in the language, the structure, the argument, the evidence, the audience frame, or the underlying point?

As agent capability grows, judgment becomes more important, not less.

### 1.2 Judgment Already Exists, But It Is Fragmented

Domain judgment is not absent. Experts already use it. Teams already rely on it. AI systems already approximate parts of it through many existing mechanisms: system prompts, style guides, code review standards, compliance policies, internal playbooks, checklists, evaluation suites, fine-tuned behavior, tool-specific validators, and human review.

These mechanisms are useful. KDNA does not argue against them.

The problem is that judgment is scattered across them. A principle may live in a prompt. A concept boundary may be described in a style guide. A failure mode may be known only by a senior reviewer. A check may be implemented in a tool. A preferred reasoning pattern may never have been written down at all. When an agent fails, it is hard to inspect which rule was missing, outdated, contradicted, or ignored.

This is not merely a prompting problem. It is a representation problem.

### 1.3 The Representation Problem

If domain judgment remains only in prompts, it is often fragile and task-specific. A good prompt may work in one session but is difficult to validate, version, reuse, and compose across systems.

If judgment remains only in documents, the agent may retrieve the document but not consistently apply the relevant distinctions. A document can contain principles, but it does not by itself distinguish axioms from examples, risk boundaries from background explanation, or required self-checks from optional guidance.

If judgment remains only in model weights, it may be powerful but opaque. The behavior can be difficult to inspect, update precisely, attribute to a specific principle, or transfer across models.

If judgment remains only inside workflows and skills, it becomes coupled to a specific execution path. It may guide one procedure well, but it is hard to test, compose, license, or reuse independently.

If judgment remains only in people's heads, it becomes vulnerable to loss. When experts leave, their judgment leaves with them. When teams scale, judgment becomes inconsistent.

KDNA addresses this by treating domain judgment as a first-class artifact: something that can be written, reviewed, validated, versioned, distributed, loaded, composed, and improved.

### 1.4 What KDNA Adds

KDNA does not claim that existing approaches are wrong. It claims that as agents become more active, these approaches benefit from a portable judgment representation.

Prompts define the current task. Knowledge bases provide information. Skills package procedures. Workflows organize steps. MCP connects tools and context. Fine-tuning shapes model behavior. Evaluations measure performance. KDNA represents the domain judgment that should guide how an agent uses these capabilities.

For a detailed comparison, see [KDNA and the AI Stack](kdna-and-ai-stack.md).

KDNA is close in spirit to rules files, rubrics, style guides, and structured prompts. Its contribution is not that principles have never been written down before. It is that KDNA defines a common open package format, validation rules, loading semantics, composition model, and quality governance path for domain judgment.

### 1.5 Judgment System Assets

A single KDNA domain is not a single opinion, rule, or prompt. It is a **judgment system asset**: a structured, connected set of principles, concept boundaries, stances, misunderstandings, risk thresholds, scenario signals, self-checks, and reasoning paths — all packaged as a versioned, loadable, verifiable unit.

A judgment system asset is not a knowledge base (which stores information) or a skill (which packages a procedure). It defines **how** information should be interpreted, which procedures are appropriate, what quality standard applies, and when human confirmation is required.

This concept is explored in detail in [Judgment Systems](judgment-systems.md).

### 1.6 Human-Led, AI-Assisted

KDNA domains may be assisted by AI, but they must be human-led. AI can help extract candidate principles, identify contradictions, generate test cases, and suggest structure. But domain judgment becomes KDNA only after human review, confirmation, and accountability.

> **AI can propose. Human must confirm. Only human-locked judgment can become KDNA.**

This principle is enforced in the KDNA authoring toolchain through the Human Lock mechanism: judgment-class cards (axioms, boundaries, risks) must be explicitly locked by a human before they can be compiled into a KDNA domain. Changes to locked content are detected via cryptographic fingerprint and require re-lock.

---

## 2. Origin: From a Book to a Judgment Protocol

KDNA began with a concrete authoring problem. Zhang Ling, the author of *Minimal Communication*, initially was not trying to design a protocol. He was trying to structure the underlying judgment behind his own book: which principles were non-negotiable, which conceptual distinctions had to be preserved, which expressions appeared reasonable but led communication into misunderstanding, and which questions had to be checked before finalizing an answer.

That process exposed a broader problem. A book can record knowledge. A course can teach methods. A prompt can describe a task. But the judgment accumulated by an expert over years — how they classify situations, detect misunderstandings, preserve boundaries, weigh risks, and decide what counts as done right — rarely has a stable representation.

The early goal was not merely to make an AI system know what *Minimal Communication* said. It was to make the judgment structure behind the work loadable, inspectable, and usable when an agent faced concrete communication, writing, or content problems.

KDNA emerged from that process. What began as an attempt to structure one author’s domain judgment became a more general question: how can the implicit judgment of experts, teams, and organizations be encoded as an open format that AI agents can load, humans can inspect, tools can validate, and multiple systems can compose?

KDNA therefore did not begin as an abstract protocol idea. It began as a real attempt to extract and preserve domain judgment, and evolved into an open judgment protocol.

---

## 3. What Judgment Is Made Of

### 2.1 Definition of Judgment

Judgment is a domain-specific process of classifying a situation, applying values and boundaries, weighing risks, choosing a response frame, and verifying whether the output satisfies domain standards.

More simply:

> Judgment is knowing what kind of situation this is, what matters most, what must not be done, and what counts as a good response.

Judgment is not a single rule. It is a structured interaction among principles, distinctions, values, risks, cases, signals, and self-checks.

### 2.2 The 13 Elements of Domain Judgment

A KDNA domain is designed to encode recurring judgment patterns. The following elements describe what domain judgment usually consists of and where KDNA carries each element.

| Judgment element | What it answers | KDNA carrier |
|---|---|---|
| **Worldview** | How this domain assumes the world works | `KDNA_Core.json` |
| **Values** | What matters more than what | `KDNA_Core.json`, `KDNA_Patterns.json` |
| **Purpose** | What this judgment serves | `meta`, `KDNA_Core.json` |
| **Role** | Who is judging and with what responsibility | `KDNA_Core.json` |
| **Knowledge assumptions** | What background knowledge affects judgment | `KDNA_Core.json`, `KDNA_Cases.json` |
| **Ontology** | What distinctions must not be blurred | `KDNA_Core.json` |
| **Classification** | What kind of situation this is | `KDNA_Scenarios.json` |
| **Taste / aesthetics** | What counts as good, poor, elegant, crude, trustworthy, or noisy | `KDNA_Patterns.json`, `KDNA_Cases.json` |
| **Boundaries** | What must not be done, even if it might appear effective | `KDNA_Patterns.json`, `KDNA_Core.json` |
| **Risk model** | Which errors are most costly | `KDNA_Patterns.json`, `KDNA_Scenarios.json` |
| **Context signals** | When this judgment should be activated | `KDNA_Scenarios.json` |
| **Experience** | Past cases, failure patterns, and counterexamples | `KDNA_Cases.json`, `KDNA_Patterns.json` |
| **Evaluation** | How judgment quality is tested | `evals/`, `KDNA_Evolution.json` |

This is why KDNA is not merely a prompt template. A prompt usually gives a task instruction. A KDNA domain models the recurring judgment structure behind a class of tasks.

### 2.3 What KDNA Can and Cannot Formalize

KDNA does not claim to exhaust human judgment. It provides a structure for approximating recurring judgment patterns: principles, distinctions, signals, boundaries, risks, cases, and evaluations.

Some judgment remains tacit, contextual, perceptual, and human-accountable. KDNA is most useful when a domain has recurring standards, stable distinctions, known failure modes, explicit risk boundaries, and reviewable outputs.

KDNA should not be used to pretend that all judgment can be reduced to rules. It should be used to make the parts of judgment that are recurring, teachable, reviewable, and testable easier to preserve and apply.

---

## 4. What KDNA Is

### 3.1 Definition

KDNA is an open protocol for encoding domain judgment as structured, verifiable judgment assets. A KDNA domain is represented, distributed, installed, verified, and loaded as a `.kdna` asset file. Internally, that asset contains a payload of encoded judgment modules. The payload describes the principles, concepts, boundaries, misunderstandings, scenarios, reasoning patterns, risk models, examples, and self-checks that guide judgment in a specific domain.

A domain does not try to store all information. It does not try to replace an expert. It captures the judgment structures that experts repeatedly use when deciding:

- what kind of situation this is;
- what matters most;
- what should be rejected;
- what distinctions must be preserved;
- what mistakes commonly occur;
- what signals should change strategy;
- what reasoning path should be followed;
- what risks should block or warn;
- what must be checked before finalizing output.

KDNA is compact by design. A useful domain may contain only two files. Richer domains contain up to six. The goal is not volume. The goal is clarity, specificity, verifiability, and reusability.

### 3.2 What KDNA Encodes

**Axioms** — Inviolable judgment anchors. Not inspirational statements. These are principles that define what must remain true when the agent reasons. Example: *A bug fix should address the root cause, not merely suppress the visible symptom.*

**Ontology** — Core concepts and their boundaries. What a concept is, what it is not, and which distinctions must not be blurred. Example: *A discussion is not a decision unless ownership, commitment, and next action are sufficiently specified.*

**Frameworks** — Decision procedures with trigger conditions, steps, and expected outputs.

**Stances** — Default positions. What the domain tends to prefer or reject before a specific task begins. Example: *Prefer concrete tension over decorative adjectives.*

**Judgment role** — The role the agent should assume when applying the domain. Example: *Act as a structural writing diagnostician, not a language polisher.*

**Terminology** — Standard terms with operational definitions, and banned terms with concrete replacements. Banned terms are not taboos. They are signals that a term may push the agent toward the wrong classification or mental model.

**Misunderstandings** — Common wrong interpretations, paired with correct interpretations and the key distinction to preserve. These help the agent detect when output is drifting into a known error pattern.

**Aesthetic preferences** — What this domain considers good, poor, elegant, noisy, manipulative, trustworthy, generic, or precise. Taste is not treated as mysticism; it is encoded through preferences, examples, counterexamples, and self-checks.

**Boundaries** — What must not be done, even if it might appear effective.

**Risk model** — Which errors carry the highest cost, when to warn, and when to block.

**Self-checks** — Yes/no questions the agent must answer before finalizing output. Verifiable, not vague. Example: *Does the recommendation identify the trade-off, rather than presenting only the benefit?*

**Scenario signals** — Observable input patterns that should change how the agent responds.

**Reasoning chains** — Structured paths from premise to conclusion to practical consequence, including trade-offs, evidence requirements, and uncertainty handling.

**Capability stages and evolution** — Definitions of how the domain improves over time, including changed judgments, deprecated assumptions, new failure modes, and evaluation results.

### 3.3 The Internal Standard Entries

A `.kdna` asset contains an internal domain tree. Authoring tools may expose a dev source workspace while creating an asset, but that workspace is not the canonical runtime or distribution form. A complete asset may contain up to six standard entries:

| File | Encodes | Required |
|---|---|:---:|
| `KDNA_Core.json` | Axioms, ontology, frameworks, core structure, stances, worldview, judgment role, value order | Yes |
| `KDNA_Patterns.json` | Terminology, misunderstandings, self-checks, boundaries, risk model, aesthetic preferences, counterexamples | Yes |
| `KDNA_Scenarios.json` | Scenario signals, classification rules, risk levels, expected judgment shifts | No |
| `KDNA_Cases.json` | Concrete cases demonstrating judgment in action, good/bad responses, judgment paths | No |
| `KDNA_Reasoning.json` | Reasoning chains, trade-offs, conflict resolution, evidence requirements, uncertainty handling | No |
| `KDNA_Evolution.json` | Capability stages, measurement, changed judgments, known limitations, evaluation history | No |

The minimum valid asset contains `KDNA_Core.json` and `KDNA_Patterns.json`. Each entry contains a required `meta` object with `version`, `domain`, `created`, `purpose`, and `load_condition`. Standard entries are validated against published JSON Schemas.

The canonical form is the `.kdna` file. Dev source workspaces remain useful for review and version control, but they are non-canonical authoring inputs. Runtime loading, installation, registry distribution, signature verification, and licensing operate on the `.kdna` asset.

### 3.4 Why a File Format Matters

A file format may seem modest compared with a model, agent framework, or platform. But formats matter because they make things portable.

Documents became portable because they had document formats. Packages became reusable because ecosystems had package formats. APIs became interoperable because they had interface descriptions. Configuration became manageable because behavior could be separated from code.

KDNA applies this logic to domain judgment. Just as configuration files separate environment-specific behavior from application code, KDNA separates domain judgment from temporary prompts, agent implementations, and platform-specific workflows. It gives judgment a place to live.

### 3.5 What KDNA Is Not

| KDNA is not | Why |
|---|---|
| **Not a prompt library** | Prompts are task-scoped. KDNA is domain-scoped, versioned, and structured for validation and composition. |
| **Not a knowledge base** | Knowledge bases store information. KDNA encodes judgment constraints, distinctions, risk boundaries, and self-checks. |
| **Not a workflow engine** | Workflows define steps. KDNA defines judgment across steps. |
| **Not a skill package** | Skills encode repeatable procedures. KDNA encodes repeatable judgment standards. Skills execute. KDNA judges. |
| **Not a fine-tuned model** | Fine-tuning internalizes behavior in model weights. KDNA keeps selected judgment principles explicit and auditable. |
| **Not an agent framework** | KDNA is a protocol and package format, not an agent. Any framework can implement loading. |
| **Not a guarantee of correctness** | KDNA provides an explicit reference. Quality depends on the judgment encoded, the evaluation evidence, and responsible use. |

---

## 5. How KDNA Works

### 4.1 Validation

KDNA domains can be verified at multiple levels:

- **Structural linting** — Required files present, fields populated, IDs unique, self-checks answerable with yes/no, cross-file references valid, and flags for vague axioms or non-actionable checks.
- **Schema validation** — Fields match JSON Schema types, arrays have required items, and cross-file references are consistent.
- **Judgment validation** — Governance fields exist, boundaries are declared, risk models are present, and self-checks are concrete.
- **Quality evaluation** — Benchmark-based scoring against annotated test cases, measuring whether agent output follows domain principles and avoids known failure patterns.

The first two levels are highly automatable. The third is partially automatable. The fourth depends on evaluation design, benchmark quality, and human review.

Schema compliance does not guarantee quality. A domain can be structurally valid but weak in judgment. KDNA separates structural validity from judgment quality.

### 4.2 Loading

When an agent loads a KDNA domain, the loader reads and validates the domain files, renders them into a structured context block using a standard template, and makes that context available to the agent at runtime.

The rendered context preserves the domain's structure as distinct, named sections:

- domain purpose;
- judgment role;
- axioms;
- ontology;
- frameworks;
- terminology;
- misunderstandings;
- risk boundaries;
- self-checks;
- relevant scenario signals.

Multiple domains can be loaded simultaneously. Each contributes an independent judgment reference.

### 4.3 Verification and Evals

A domain should not be trusted merely because it is valid JSON. KDNA encourages domains to include evaluation cases that test whether the expected judgment actually appears in agent behavior.

A standard evaluation case may include:

```json
{
  "id": "eval-001",
  "domain": "@aikdna/writing",
  "input": "Help me improve this post.",
  "expected_classification": "structural_writing_diagnosis",
  "expected_axioms": ["writing_ax_structural_problem"],
  "expected_misunderstandings_avoided": ["more_detail_equals_more_evidence"],
  "expected_banned_terms_avoided": ["polish the language"],
  "output_rubric": "The output should diagnose the structural writing problem before suggesting language changes.",
  "pass": true,
  "evidence": "The agent explicitly classified the issue as structural and avoided direct language polishing."
}
```

Evaluation results can feed quality badges, registry metadata, benchmark reports, and compare-mode evidence.

### 4.4 Judgment Trace and Judgment Delta

KDNA should make judgment inspectable, not merely influence output invisibly.

A **Judgment Trace** records what happened during a KDNA-guided response:

- which domains were loaded;
- which scenario signals were detected;
- which axioms were triggered;
- which misunderstandings were avoided;
- which banned terms or risky patterns were detected;
- which self-checks passed or failed;
- which conflicts appeared between domains;
- which composition policy resolved or surfaced the conflict.

A **Judgment Delta** compares the reasoning path with and without KDNA:

```text
Same model. Same input.

Without KDNA:
  Treats the request as language polishing.

With writing.kdna:
  Classification: structural writing diagnosis
  Triggered axiom: writing problems are often structural, not language-level
  Avoided misunderstanding: more detail equals better evidence
  Avoided term: polish the language
  Self-checks: 5/5 passed
```

Judgment Delta is important because KDNA should be evaluated by observable judgment changes, not by claims.

---

## 6. Composition, Clusters, and Judgment Systems

### 5.1 Why Composition Matters

Real judgment is often multi-domain. A single task may involve technical correctness, strategic judgment, audience understanding, legal caution, brand voice, safety boundaries, and product trade-offs.

If these standards are merged into one giant prompt, the result becomes brittle. Sources blur. Conflicts disappear. Token budgets explode. The agent cannot explain which domain shaped which judgment.

KDNA allows domains to remain separate while being loaded together. The goal is not to concatenate instructions. The goal is source-preserving composition of independent judgment references.

### 5.2 Three Levels

KDNA composition can be understood in three levels:

| Level | Definition | Example |
|---|---|---|
| **Judgment Atom** | A single KDNA domain | `writing`, `code_review`, `agent_safety` |
| **Judgment Cluster** | A composed set of domains with a composition policy | `content_creation_cluster`, `product_launch_cluster` |
| **Judgment System** | An organization-level judgment architecture with governance | an enterprise product, brand, compliance, and safety system |

A cluster is not a folder of domains. It is a composition policy: what to load, when to load it, how to preserve source attribution, how to expose conflicts, and how to evaluate combined judgment.

### 5.3 Composition Strategies

KDNA clusters may support several composition strategies:

- **Fixed** — Always load a defined set of domains.
- **Signal-based** — Load domains based on trigger signals in the input.
- **Staged** — Load different domains at different phases of a workflow.
- **Overlay** — Use a primary domain plus governance domains that always constrain it.
- **User-confirmed** — Recommend domains and let a human approve or adjust the stack.

### 5.4 Cluster Types

KDNA clusters may serve different purposes:

- **Horizontal clusters** combine domains across a broad capability, such as content creation.
- **Vertical clusters** support a business process, such as product launch judgment.
- **Governance clusters** provide safety, compliance, legal, privacy, or brand boundaries across other domains.

### 5.5 Conflict Surfacing

Domain conflicts are not failures. They are part of real judgment.

A brand domain may encourage emotional intensity while a compliance domain requires conservative wording. A growth domain may push toward urgency while a trust domain rejects false certainty. A code review domain may prefer strict blocking while a product velocity domain may tolerate controlled risk.

KDNA's principle is:

> When domains conflict, the runtime should surface the conflict, not silently resolve it, unless a composition policy explicitly defines priority.

This is one of the differences between KDNA composition and large prompt concatenation.

### 5.6 Source Attribution and Judgment Graphs

When multiple domains are composed, KDNA should preserve source attribution. A rendered axiom, misunderstanding, banned term, or self-check should remain traceable to its domain of origin.

At larger scale, domains form a judgment graph:

- one domain may depend on another;
- one domain may constrain another;
- one domain may override another in high-risk contexts;
- one domain may provide expression standards for another;
- one domain may evaluate the output of another.

This makes KDNA suitable not only for individual expert domains, but for organization-level judgment systems.

### 5.7 Load Profiles and Token Budgets

Loading too many domains can dilute judgment rather than improve it. KDNA clusters should support selective loading:

| Load profile | What is loaded | Purpose |
|---|---|---|
| **Index** | Manifest and trigger signals | Domain selection |
| **Compact** | Highest question, top axioms, risk model, self-checks | Lightweight guidance |
| **Scenario** | Relevant scenarios and frameworks | Task-specific judgment |
| **Full** | All six standard files | High-relevance or high-risk tasks |

Better-selected KDNA is better than more KDNA.

---

## 7. Where KDNA Fits

KDNA is easiest to understand alongside existing agent components:

| Component | Primary role | What it usually does not standardize |
|---|---|---|
| **LLMs** | General reasoning, language, generation | Inspectable, editable, domain-owned judgment standards |
| **Prompts** | Define the current task or behavior | Reusable domain judgment as a versioned artifact |
| **Knowledge bases / RAG** | Provide information and references | Structured judgment constraints, self-checks, and risk boundaries |
| **Skills** | Package repeatable procedures | Independent domain principles for accepting or rejecting results |
| **Workflows** | Organize execution order | Judgment that can be reused outside that workflow |
| **MCP / APIs** | Connect agents to tools and data | Domain-specific evaluation principles |
| **Fine-tuning** | Internalize behavior patterns | Inspectable and precisely editable judgment rules |
| **Evaluation suites** | Measure performance | The portable judgment package being measured |
| **KDNA** | Represent domain judgment | It does not execute tasks or replace model capability |

KDNA is not a competitor to these components. It is a complement.

A prompt tells the agent what to do now. A skill tells it how to perform a procedure. A workflow organizes steps. MCP connects it to tools. A knowledge base provides reference material. Fine-tuning shapes behavior. Evaluations measure outcomes. KDNA gives the agent a structured domain judgment reference for deciding what matters, what to reject, and what counts as good within a specific field.

Workflows can contain judgment, but they cannot govern judgment independently. When judgment is embedded inside workflows, it cannot be easily tested, versioned, composed, licensed, or reused across agents. KDNA extracts recurring judgment into a separate asset layer.

---

## 8. Why Explicit Domain Judgment Matters

### 7.1 Inspectability

When judgment is hidden in prompts, model behavior, workflows, or undocumented expert habits, it is difficult to inspect. KDNA makes judgment readable. A human can open a domain and ask: Are these principles correct? Are the concept boundaries clear? Are the self-checks concrete? Are the risk boundaries appropriate?

An agent's output may still need review, but the judgment reference guiding it is no longer invisible.

### 7.2 Portability

A prompt may work in one tool but not another. A team convention may exist in one department but not another. A fine-tuned behavior may be bound to one model. KDNA makes domain judgment portable: stored in a repository, packaged as a domain, installed through tooling, loaded by different agents, and versioned over time.

### 7.3 Verifiability

Unstructured judgment is difficult to check. KDNA introduces multiple levels of verification: schema validation, structural linting, cross-file consistency, governance checks, self-check quality rules, benchmark-based evaluation, human review, and version history.

This does not make judgment automatically correct. But it makes judgment reviewable. A domain can be compared, improved, and given quality badges based on evidence.

### 7.4 Composability

Real work is multi-domain. A single task may involve technical accuracy, strategic judgment, audience understanding, legal caution, and brand voice. If all are merged into one prompt, the result becomes brittle. KDNA allows domains to remain separate while being loaded together, each contributing an independent judgment reference.

### 7.5 Inheritance

Organizations often underestimate where their expertise lives. It is in the repeated judgments of experienced people: what they notice first, what they reject immediately, what trade-offs they consider, what mistakes they have learned to avoid.

When these people leave, much of this judgment leaves with them. KDNA does not fully preserve a person's expertise — no format can. But it can preserve recurring judgment principles, concept boundaries, failure patterns, and self-checks. That is enough to make expert judgment more teachable, reviewable, and available to AI agents.

### 7.6 Governance

As agents become more active, organizations will need to govern not only tools and data access, but also the standards used to classify situations, make trade-offs, block risky action, and evaluate outputs.

KDNA provides a path for governing judgment as an explicit layer: authored, reviewed, versioned, evaluated, and audited.

---

## 9. Public, Private, and Enterprise Domains

KDNA supports several modes of use.

### 8.1 Open Reference Domains

Open reference domains are shared publicly through a registry under explicit content licenses. They serve as reference implementations, learning resources, community-maintained judgment packages, and examples of high-quality authoring.

### 8.2 Creator Domains

A respected editor could publish a writing judgment domain. A senior engineer could publish a code review domain. A product leader could publish a prioritization domain.

These would not be templates. They would be structured judgment packages carrying the creator's principles, distinctions, risk boundaries, and self-checks. As registries and evaluation systems mature, high-quality domains can accumulate reputation.

### 8.3 Enterprise Private Domains

Organizations hold cognitive assets they rarely recognize as assets:

- how senior engineers review architecture;
- how compliance teams interpret risk;
- how product teams prioritize trade-offs;
- how brand teams decide what language preserves trust;
- how support teams classify customer states;
- how leadership teams distinguish discussion from decision.

Private KDNA domains allow organizations to encode this expertise in a format that can be loaded by AI agents and reviewed by humans. This is not automation of expertise. It is preservation, distribution, and operationalization of expertise.

### 8.4 Enterprise Judgment Systems

At enterprise scale, the most valuable artifact may not be a single domain, but a cluster or system of domains:

- product judgment;
- legal risk;
- security review;
- brand voice;
- customer communication;
- pricing policy;
- escalation boundaries;
- compliance standards.

The long-term enterprise use case is not merely a private prompt library. It is an internal judgment system: a governed set of domains, composition policies, quality badges, audit traces, and review cycles.

---

## 10. Quality Governance

A KDNA domain should not be treated as high quality simply because it passes schema validation. Quality requires evidence.

KDNA separates several levels of quality governance:

### 9.1 Structural Inclusion

A domain can be included structurally if it:

- passes schema validation;
- has required files;
- has unique IDs;
- has a README;
- declares license and authorship;
- has no obvious structural errors.

### 9.2 Judgment Inclusion

A domain should demonstrate judgment substance:

- clear core insight;
- at least two meaningful axioms;
- explicit ontology or concept boundaries;
- at least two misunderstandings or failure patterns;
- explicit boundaries or risk rules;
- concrete yes/no self-checks.

### 9.3 Evaluation Inclusion

A domain should include evaluation cases. A minimum official threshold may require at least three evals. Stronger domains should include more.

Evaluation should test not only output quality, but also:

- classification accuracy;
- axiom trigger accuracy;
- misunderstanding avoidance;
- banned term or risky pattern avoidance;
- self-check pass rate;
- judgment delta compared with baseline.

### 9.4 Badge Promotion

Quality badges should be evidence-based, not manually assigned as decoration.

A possible badge path:

| Badge | Evidence |
|---|---|
| `untested` | Structurally valid, no meaningful eval set |
| `tested` | At least 10 evals with reproducible results |
| `validated` | At least 30 evals and strong benchmark performance |
| `expert_reviewed` | Reviewed by qualified external experts |
| `production_ready` | Real-world use evidence, maintained version history, and monitoring |

Quality governance is necessary because a structured domain can still encode shallow, outdated, or harmful judgment.

---

## 11. Economic Vision

### 10.1 Judgment as a Reusable Asset

The internet made information abundant. AI makes generation abundant. But judgment remains scarce — not because it cannot be expressed, but because it is often not structured as a reusable asset.

A KDNA domain can encode how a person, team, or community judges within a domain. If useful, it can be reused across tasks, agents, teams, and organizations. This gives domain judgment some properties of intellectual property: authorship, versioning, review, licensing, attribution, reputation, and improvement over time.

### 10.2 Creator Domains

A respected editor could publish a writing judgment domain. A senior engineer could publish a code review domain. A product leader could publish a prioritization domain. A communication expert could publish a relationship diagnosis domain. A security expert could publish an agent safety domain.

These would not be generic templates. They would be structured judgment packages carrying the creator's principles, distinctions, risk boundaries, examples, and self-checks.

If domains prove useful in real workflows, creators who build verified, well-reviewed domains may accrue value that compounds across their body of work.

### 10.3 Enterprise Private Domains

Organizations hold judgment assets in scattered form: review comments, style guides, decision memos, onboarding documents, escalation policies, compliance notes, and the habits of senior people.

Private KDNA domains allow organizations to encode these judgment assets in a format that can be loaded by AI agents and reviewed by humans.

The most important enterprise value may come from judgment continuity: preserving and distributing standards that would otherwise remain implicit, inconsistent, or dependent on a few experienced individuals.

### 10.4 Long-Term Evolution

1. **Format Layer** — Standardized encoding of domain judgment.
2. **Verification Layer** — Evaluation cases, benchmark results, review processes, quality badges.
3. **Discovery Layer** — Registry, faceted browsing, domain preview, dependency discovery.
4. **Composition Layer** — Clusters, composition policies, judgment graphs, conflict surfacing.
5. **Market Layer** — Licensing, attribution, revenue sharing, creator reputation.
6. **Asset Layer** — Cognitive and judgment assets as a recognized category of reusable intellectual property.

KDNA is currently at the format and verification layers, with early work on discovery and composition. We do not describe KDNA as a financial instrument.

---

## 12. Beyond Software Agents

KDNA is initially most applicable to software agents: writing assistants, coding agents, research agents, meeting assistants, workflow agents, and domain-specific AI copilots.

But as AI systems become more embodied — operating computers, machines, robots, vehicles, labs, factories, or physical environments — the cost of poor judgment increases.

Perception, planning, tools, and control systems are necessary, but they are not sufficient. Embodied agents also need explicit judgment boundaries:

- when not to act;
- when to ask for confirmation;
- which risks block action;
- which trade-offs require escalation;
- which domain standards govern safe execution;
- which outputs require human review.

KDNA is not a robotics control system. It does not replace perception, planning, safety controllers, simulation, formal verification, or human oversight. It provides a portable judgment reference that higher-level agents may use when deciding whether and how to act.

As AI moves from text generation toward action in the world, explicit judgment references become more important, not less.

---

## 13. Limits and Risks

A serious protocol must define its limits.

### 12.1 Not All Expertise Can Be Fully Formalized

Some judgment is deeply tacit — depending on perception, context, timing, emotional sensitivity, embodied practice, or years of experience. KDNA is most useful when a domain has recurring principles, stable concept boundaries, known failure modes, and reviewable output criteria.

### 12.2 Judgment Capture Can Distort Judgment

Encoding judgment can oversimplify it. A poorly authored domain may preserve a caricature of expertise rather than expertise itself. Authors must avoid reducing living judgment into rigid slogans.

### 12.3 Explicit Judgment Can Become Rigid

A poorly written domain may over-constrain the agent, reject useful variation, or preserve outdated assumptions. Domains need versioning, review, feedback, and evolution.

### 12.4 Schema Validity Is Not Quality

A domain can pass validation and still be bad: vague principles, shallow distinctions, weak self-checks, missing boundaries, or poor examples. Tooling checks structure. Quality requires expert review and real usage evaluation.

### 12.5 Structured Domains Can Create False Authority

A domain may appear authoritative because it is structured. KDNA must distinguish structure from authority. Quality badges and registry trust should be evidence-based.

### 12.6 Context Limits Matter

Loading too many domains can dilute judgment rather than improve it. Clusters must be selective. Better-selected KDNA is better than more KDNA.

### 12.7 Domains Can Conflict

A brand domain may encourage emotional intensity while a compliance domain requires conservative wording. KDNA should expose these conflicts, not hide them. Conflict reporting is part of responsible judgment composition.

### 12.8 KDNA Does Not Replace Accountability

Even with KDNA, humans remain accountable for high-stakes decisions. KDNA improves inspectability. It does not eliminate responsibility.

---

## 14. Current Status

KDNA has moved from concept to a working protocol ecosystem with early evidence.

### 14.1 Protocol & Governance

- Protocol specification: SPEC v1.0-rc. Six standard domain files. JSON Schemas.
- Governance: TRADEMARK, COMPATIBILITY, FORK_POLICY, GOVERNANCE — open standard with protected identity.
- Benchmark evidence: 5-model agent_safety mini benchmark (150 raw outputs, Best Prompt control). KDNA outperforms Best Prompt on all 5 models (avg +7.4 points).

### 14.2 Runtime & Toolchain

| Component | Repository | Role |
|-----------|-----------|------|
| `@aikdna/kdna-core` | aikdna/kdna | Pure JS logic: load, validate, lint, render, compose |
| `@aikdna/kdna-cli` | aikdna/kdna-cli | CLI: verify, install, load, match, route, compare, diff, publish existing assets, identity, trace, guard |
| `@aikdna/kdna-studio-core` | aikdna/kdna-studio-core | JS authoring kernel: evidence → cards → Human Lock → compiler provenance |
| `@aikdna/kdna-studio-cli` | aikdna/kdna-studio-cli | CLI: `kdna-studio` create, import, cards, lock, compile, export |
| kdna-core-swift | aikdna/kdna-core-swift | Native Swift runtime: load, validate, route (7-state), compose, trust verify |
| kdna-studio-swift | aikdna/kdna-studio-swift | Native Swift authoring: project, cards, Human Lock, compile, export |
| kdna-registry | aikdna/kdna-registry | Domain catalog with signatures, quality badges, risk levels, CI validation |
| kdna-vscode | aikdna/kdna-vscode | VS Code extension: validate, preview, dev-source diagnostics, configurable scan depth |
| kdna-skills | aikdna/kdna-skills | Agent loader skill with 7-state routing ("No KDNA is better than wrong KDNA") |
| kdna-runtime | (private) | Server-side projection engine with Judgment Guard, rate limiting, signed licenses |

### 14.3 Runtime Routing

The `kdna route` command implements a 5-Gate 7-State domain router (Intent Gate → Negative Match → Domain Fit → Trust Gate → Ambiguity Gate). Output conforms to `specs/route-result.schema.json`. The router's first principle: "No KDNA is better than wrong KDNA" — skipping is the default, loading requires positive fit evidence.

### 14.4 Human Lock Gate

Human Lock has moved from specification to working code at two enforcement points:
- **Studio Gate**: integrated into `exportProject()` — blocks export if judgment-class cards are not properly locked. 4 rules: must be locked, must have Human Lock record, must confirm `applies_when`/`does_not_apply_when`/`failure_risk` reviewed, fingerprint change detection for post-lock modifications. 16 tests.
- **Runtime Gate**: `kdna dev pack` remains a dev-only diagnostic bundle path, while `kdna publish` accepts existing Studio-compiled `.kdna` assets and checks authoring provenance for trusted quality claims.

### 14.5 Reference Domains

The public registry may retain experimental and yanked entries for transparency, but the official install surface is a focused reference set: kdna_authoring, agent_safety, prompt_diagnosis, code_review, and writing. Together they demonstrate authoring, safety, prompt diagnosis, code review, and writing judgment across the core install, verify, and load flow. Commercial pro domains (writing-pro, speaking-pro, management-pro, silver-age-pro) are in staging.

### 14.6 Reference Applications

- **a KDNA-compatible client** (macOS): reference GUI client for loading, comparing, and tracing KDNA judgment. Compare Mode: same input, same model, with/without KDNA.
- **Authoring environment** (macOS): authoring client built on Studio Core.

---

## 15. Roadmap

KDNA's roadmap is organized into six phases, reflecting the protocol's evolution from format to ecosystem.

### Phase 1: Protocol and Runtime Foundation ✅

- SPEC v1.0-rc stable, six standard files, JSON Schemas
- `@aikdna/kdna-core` — pure JS runtime library
- `@aikdna/kdna-cli` — command-line toolchain (verify, install, load, match, route, compare, diff, publish existing assets, identity, trace)
- `kdna-registry` — machine-readable domain catalog with signatures, quality badges, CI validation
- Benchmark infrastructure: 5-model mini benchmark with Best Prompt control, 150 raw outputs
- Governance: TRADEMARK, COMPATIBILITY, FORK_POLICY, GOVERNANCE

### Phase 2: Authoring Infrastructure ✅

- `@aikdna/kdna-studio-core` (npm) — JS authoring kernel
- `@aikdna/kdna-studio-cli` (npm) — `kdna-studio` command-line authoring entry
- `kdna-studio-swift` (SPM) — Swift authoring kernel for Apple platforms
- Judgment Cards (9 types, 6-state machine)
- Human Lock Gate (Studio + CLI enforcement, fingerprint change detection)
- Quality Gates (readiness check, contradiction detection, anti-vagueness)
- Compiler (locked cards → KDNA_Core.json + KDNA_Patterns.json)

### Phase 3: Native App Integration ✅

- `kdna-core-swift` — native Swift runtime (load, route, compose, trust verify)
- `kdna-vscode` — VS Code extension (validate, preview, pack)
- `kdna-skills` — Agent loader skill with 7-state routing
- Agent integrations emerging (Claude Code, OpenCode, Codex)

### Phase 4: Trust and Distribution (In Progress)

- .kdna open package profile ✅
- Ed25519 signing ✅
- SHA256 hash verification ✅
- Risk levels (R0–R3) ✅
- Yanked/deprecated mechanism ✅
- Registry attestation ✅
- Judgment Guard (Runtime R1–R15) ✅
- `kdna route` 7-state Trust Gate ✅

### Phase 5: Encrypted and Licensed KDNA (In Progress)

- Licensed encrypted-entry profile (CLI/Core MVP implemented)
- License activation and verification (CLI MVP)
- Entitlement API contract (activation, sync, revoke, audit)
- Private packages (pro domains in staging)
- Organization access control
- Offline license lease

### Phase 6: KDNA Store and Judgment Asset Market (Future)

- Creator profiles and verified creators
- Package pages with quality evidence
- Reviews and certifications
- Paid domains and subscriptions
- Enterprise private registry
- Revenue sharing for multi-creator domains

### Phase 1: Protocol Foundation

- Add a formal Judgment Model section to SPEC.
- Define the 13 elements of judgment and their file carriers.
- Upgrade schemas in controlled waves:
  - Core + Patterns;
  - Scenarios + Cases;
  - Reasoning + Evolution + manifest/version matrix.
- Unify `status`, `quality_badge`, and `access` fields.

### Phase 2: Reference Domains

- Strengthen the official reference set:
  - kdna_authoring;
  - agent_safety;
  - prompt_diagnosis;
  - code_review;
  - writing;
- Ensure each has a complete six-file package.
- Add at least 10 evals per domain.
- Make `kdna verify --judgment` and `kdna compare` produce meaningful evidence.
- Use reference domains to validate that the protocol is executable, not merely conceptual.

### Phase 3: Composition and Clusters

- Add cluster concepts to SPEC:
  - Judgment Atom;
  - Judgment Cluster;
  - Judgment System.
- Define cluster schema and composition policy schema.
- Define load profiles and token budget strategies.
- Defer full engineering implementation until real demand justifies it.

### Phase 4: Developer and Public Experience

- Simplify README.
- Publish a Judgment Anatomy guide for domain creators.
- Add Judgment Delta examples to the website.
- Upgrade registry policy from inclusion rules to quality governance.
- Improve onboarding for agent developers, domain creators, and evaluators.

---

## Conclusion

AI agents are becoming more capable, more connected, and more active. That progress does not make human judgment less important. It makes the representation of human judgment more important.

Human knowledge has been digitized through books, documents, code, databases, and search. Human procedures have been digitized through workflows, automations, CI/CD systems, and agent frameworks. But human judgment — the implicit, multidimensional, experience-shaped standards by which experts classify situations, weigh risks, reject bad patterns, preserve boundaries, and decide what counts as good — has not had a standard, portable representation.

KDNA addresses this representation problem. It gives domain judgment an open protocol: one that can be authored, validated, loaded, traced, composed, versioned, shared, and improved.

KDNA does not replace models, prompts, knowledge bases, skills, workflows, tools, retrieval, evaluation, or fine-tuning. It gives them a clearer judgment reference.

The project is early. The format and toolchain exist. The next challenge is proof through high-quality domains, benchmark evidence, Compare Mode, and real usage — demonstrating that explicit domain judgment can improve agent behavior in measurable, inspectable, and repeatable ways.

If this succeeds, the AI stack will not only have models, tools, knowledge, and workflows. It will have a judgment layer.

---

*KDNA is an open-source project under Apache 2.0 license. The specification, schemas, and reference toolchain are published under this license. Individual domains may carry their own content licenses.*

*Website: https://aikdna.com*  
*GitHub: https://github.com/aikdna/kdna*  
*npm: @aikdna/kdna-cli, @aikdna/kdna-core*
