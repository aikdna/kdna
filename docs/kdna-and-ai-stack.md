# KDNA and the AI Stack

## How KDNA Relates to Knowledge Bases, Memory, Skills, MCP, Workflows, Prompts, and Evaluations

KDNA does not replace the existing AI stack. It does not replace knowledge bases, memory, skills, MCP, workflows, prompts, retrieval systems, evaluation suites, or fine-tuning.

KDNA exists because these components often need a clear judgment reference.

In short:

> **KDNA is not another tool layer. KDNA is the judgment layer that guides how other layers should be used.**

---

## 1. The Core Boundary

The AI stack contains many useful layers:

| Component | Primary role | What it gives the agent |
|-----------|-------------|------------------------|
| **LLM** | General intelligence | Language, reasoning, generation |
| **Prompt** | Task instruction | What to do now |
| **Knowledge base** | Information source | Facts, documents, references |
| **Memory** | Context continuity | Past interactions, preferences, history |
| **Skill** | Procedure | How to perform a repeatable task |
| **MCP** | Tool and data connection | Standard access to external systems |
| **Workflow** | Execution structure | Steps, dependencies, task order |
| **RAG** | Retrieval | External context and documents |
| **Evaluation** | Measurement | Whether output meets a test or rubric |
| **Fine-tuning** | Model behavior shaping | Internalized patterns in model weights |
| **KDNA** | **Judgment system** | **What matters, what to reject, what counts as good** |

KDNA does not compete with these components. It gives them a judgment reference.

> Knowledge provides information. Memory preserves context. Skills perform procedures. MCP connects tools and data. Workflows organize execution. KDNA provides judgment standards.

---

## 2. KDNA vs Knowledge Base

A knowledge base stores information: documents, notes, articles, manuals, policies, cases, FAQs, research material, structured data.

A knowledge base answers: *What information is available? What does the document say? What facts are relevant? What examples exist?*

KDNA answers different questions: *How should this information be interpreted? Which information matters most? Which distinction must not be blurred? Which source should be treated cautiously? What risk should block action? What standard determines whether the answer is good?*

A knowledge base gives the agent material. KDNA gives the agent judgment standards for using that material.

**Example:** A company knowledge base may contain all past customer support tickets. A customer-support KDNA domain may encode how to classify urgency, when to escalate, what language preserves trust, which risks require human review, and what patterns indicate a legal or safety issue.

> The knowledge base says what happened. KDNA says how to judge what matters.

---

## 3. KDNA vs Memory

Memory preserves context over time: user preferences, previous conversations, personal facts, project history, recurring instructions, past decisions.

Memory answers: *What happened before? What does this user prefer? What has already been decided?*

KDNA answers: *How should the agent judge this type of situation? Which principles apply regardless of this session? Which boundaries should be preserved? Which self-checks must be passed?*

Memory is contextual. KDNA is domain-judgmental. They work together.

**Example:** Memory may remember that a user prefers concise writing. A writing KDNA domain may judge whether a draft has a real argument, sufficient evidence, clear audience tension, and a structure that supports the claim.

> Memory personalizes. KDNA judges.

---

## 4. KDNA vs Skill

A skill packages a repeatable capability or procedure: transcribe audio, generate subtitles, run tests, edit video, call an API, convert files, create a chart, deploy software.

A skill answers: *How do I perform this task? Which steps should be executed? Which tools should be called?*

KDNA answers: *Should this procedure be used in this situation? What quality standard should the result meet? What failure patterns should be avoided? When is the output not good enough? When should the agent stop and ask a human?*

A skill executes. KDNA judges the execution.

**Example:** A subtitle skill may extract audio, transcribe speech, align timestamps, and export an `.srt` file. A subtitle-quality KDNA domain may define what counts as readable subtitle segmentation, how to detect recognition errors, when timing drift is unacceptable, and when human review is required.

> Skills tell an agent how to do something. KDNA tells an agent how to judge whether it should be done, how well it was done, and when it should not proceed.

---

## 5. KDNA vs MCP

MCP (Model Context Protocol) connects AI systems to tools, data sources, and external services through a standard interface.

MCP answers: *What tools are available? How can the agent call this system? What data can be accessed? What operation can be performed?*

KDNA answers: *When should this tool be used? What risk comes with using it? Which result should be trusted? Which action requires confirmation? What domain standard should govern tool use?*

MCP provides access. KDNA provides judgment about access and use.

**Example:** An MCP server may give an agent access to a CRM system. A sales KDNA domain may define when a lead should be treated as high intent, which customer signals are misleading, which promises should not be made, and when a human salesperson should take over.

> MCP connects the CRM. KDNA guides how the CRM data should be judged.

---

## 6. KDNA vs Workflow

A workflow defines execution order: steps, dependencies, branching logic, approvals, retries, handoffs, automations, state transitions.

A workflow answers: *What happens first? What happens next? Which step depends on which output? When should the process move forward?*

KDNA answers: *Is this the right process for this situation? What judgment should govern each step? Which risks should interrupt the workflow? Which output is not good enough to continue? Which exception requires escalation?*

A workflow organizes action. KDNA judges action.

**Example:** A content publishing workflow may include topic selection, outline generation, draft writing, editing, image creation, scheduling, and publishing. A content-strategy KDNA domain may judge whether the topic has real audience tension, whether the title creates false urgency, whether the draft contains real insight, and whether the piece should be published at all.

> The workflow moves the process forward. KDNA decides whether moving forward is justified.

---

## 7. KDNA vs Prompt

A prompt gives the AI an instruction in the current context. A prompt answers: *What should the AI do now?*

KDNA answers: *What domain judgment should guide many tasks over time? What distinctions must be preserved across sessions? Which mistakes should be avoided repeatedly? Which principles define good work in this domain?*

A prompt is usually task-scoped. KDNA is domain-scoped.

**Example:**
- Prompt: *"Improve this article."*
- KDNA: *"Do not treat weak writing as a language-polishing problem first. Diagnose whether the core claim, audience tension, evidence, and structure are sound before editing sentences."*

> The prompt asks for an action. KDNA defines the judgment behind the action.

---

## 8. KDNA vs Rules Files

Rules files such as `.cursorrules`, project instructions, or agent configuration files can define coding conventions, project preferences, formatting requirements, and repository-specific behavior.

Rules files usually answer: *What should this agent do in this project? What preferences should be followed?*

KDNA answers: *What judgment system governs this domain? What are the core axioms? Which concepts must not be confused? What are the common misunderstandings? Which self-checks must pass? How can this judgment be validated, composed, versioned, distributed, and licensed?*

Rules files are usually local and project-specific. KDNA is domain-scoped, structured, portable, and governed by a standard format.

> A rules file may contain KDNA-like ideas. KDNA turns those ideas into a reusable judgment system asset.

---

## 9. KDNA vs RAG

RAG (Retrieval-Augmented Generation) retrieves relevant information from external sources and provides it to the model.

RAG answers: *What context should be retrieved? Which documents are relevant? What passages support the answer?*

KDNA answers: *How should retrieved information be judged? What should count as sufficient evidence? Which retrieved material should be treated as background only? What distinction should guide interpretation? Which risk should prevent overconfident use?*

RAG brings information into context. KDNA tells the agent how to evaluate and apply that information.

**Example:** A medical RAG system may retrieve clinical documents. A medical-risk KDNA domain would define uncertainty handling, escalation boundaries, forbidden overclaims, and when the agent must tell the user to consult a professional.

> RAG retrieves. KDNA constrains judgment.

---

## 10. KDNA vs Evaluation

Evaluations measure whether an AI system performs well: test cases, benchmarks, rubrics, expected outputs, pass/fail checks, scoring systems, human review criteria.

Evaluations answer: *Did the output pass? How good was the result? Which behavior improved or failed?*

KDNA answers: *What judgment system should guide the output before evaluation? Which principles should be triggered? Which misunderstandings should be avoided? Which boundaries should block output?*

Evaluation measures behavior. KDNA guides behavior.

A good KDNA domain should have evals. Evals can test whether KDNA changed agent judgment in the expected direction. This is where Judgment Delta becomes important: same input, same model, without KDNA versus with KDNA.

---

## 11. KDNA vs Fine-tuning

Fine-tuning changes model behavior by training patterns into model weights.

Fine-tuning answers: *How can this model internalize a behavior pattern? How can behavior be shaped at the model level?*

KDNA answers: *How can selected judgment remain explicit? How can humans inspect and edit it? How can the same judgment be used across models? How can judgment be versioned, licensed, composed, and revoked?*

Fine-tuning internalizes. KDNA externalizes. Fine-tuning can be powerful, but the resulting behavior may be harder to inspect, attribute, edit precisely, or transfer across model providers. KDNA keeps judgment visible.

A mature system may use both: fine-tuning for general behavior, KDNA for explicit domain judgment at runtime.

---

## 12. How They Work Together

KDNA works best when it complements the rest of the stack.

**Example: AI writing assistant**

| Layer | Role |
|-------|------|
| **Prompt** | "Improve this article for publication." |
| **Knowledge base** | Brand notes, audience research, previous articles |
| **Memory** | User prefers direct, non-hype writing |
| **Skill** | Analyze structure, suggest outline, rewrite sections |
| **MCP** | Access CMS, analytics, document storage |
| **Workflow** | Draft → diagnose → revise → review → publish |
| **Eval** | Check clarity, evidence, originality, title strength |
| **KDNA** | Judge whether the article has a real point, avoids fake depth, preserves audience tension, and should be published |

Each layer contributes something different. KDNA does not replace them. KDNA gives them a domain judgment system.

### When One Task Needs Multiple Judgment Domains

A single `.kdna` asset should stay scoped. If a task needs writing judgment, brand judgment, legal risk, and a review gate, the correct answer is not one broad "content" KDNA. The correct answer is a KDNA Cluster: multiple domain assets loaded under explicit roles and route policy.

Example: a video creation workflow might compose:

| Role | KDNA asset | Purpose |
|------|------------|---------|
| **Primary** | `creator_style.kdna` | Keeps the core expression and point of view consistent |
| **Advisor** | `video_aesthetic.kdna` | Adds pacing, rhythm, cover, and visual taste judgment |
| **Constraint** | `brand_boundary.kdna` | Blocks claims, tone, or formats outside brand standards |
| **Critic** | `review_gate.kdna` | Reviews the final output before publishing |

For reusable work, a Work Pack can combine a KDNA or KDNA Cluster with skills, task templates, output templates, review gates, risk policy, and trace/feedback contracts. KDNA remains the judgment layer; Work Pack is the reusable work capability.

---

## 13. Common Misunderstandings

**"Is KDNA just a better prompt?"** No. A prompt is a task instruction. KDNA is a structured, domain-scoped judgment system that can be validated, versioned, composed, distributed, and reused.

**"Is KDNA just a knowledge base?"** No. Knowledge bases store information. KDNA encodes how to judge, prioritize, reject, and apply information.

**"Is KDNA just memory?"** No. Memory preserves past context. KDNA provides domain judgment standards.

**"Is KDNA just a skill?"** No. Skills execute procedures. KDNA judges procedures and results.

**"Is KDNA just MCP?"** No. MCP connects tools and data. KDNA guides when and how those tools should be used.

**"Is KDNA just workflow logic?"** No. Workflows organize steps. KDNA defines the judgment that should govern those steps.

**"Is KDNA just evals?"** No. Evals measure whether behavior was good. KDNA provides the judgment reference that behavior should follow.

**"Is KDNA just fine-tuning in files?"** No. Fine-tuning modifies behavior inside model weights. KDNA keeps domain judgment explicit, portable, inspectable, and editable.

---

## 14. Final Principle

KDNA is not trying to replace the AI stack. It is trying to make the judgment layer explicit.

The future AI stack needs models, prompts, memory, knowledge bases, skills, tools, workflows, evaluations, and fine-tuning. But as agents become more capable and more active, they also need a standard way to load human-led domain judgment systems.

That is the role of KDNA.

> Knowledge tells the agent what is available.  
> Memory tells the agent what happened before.  
> Skills tell the agent how to do things.  
> MCP tells the agent what it can access.  
> Workflows tell the agent what steps to follow.  
> Evaluations tell the agent whether it passed.  
> **KDNA tells the agent how to judge.**
