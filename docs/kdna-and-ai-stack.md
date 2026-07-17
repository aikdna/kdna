# KDNA and the AI Stack

## The boundary is a contract, not a monopoly on judgment

Judgment already exists throughout the AI stack: in model behavior, Prompts,
Skills, Policies, workflows, Memory, knowledge bases, retrieved documents,
tests, and human or organizational practice.

KDNA does not invent judgment, and it does not claim that other carriers lack
it. KDNA gives a selected, bounded judgment system an independent `.kdna` asset
identity and a shared contract for integrity, authorization, loading,
projection, and lifecycle.

The same judgment may appear in a Prompt, Skill, Policy, document, and `.kdna`
asset at the same time. It may even produce the same behavior in a particular
task. That is normal. KDNA's additional value is protocol portability and
asset control, not automatic intelligence or behavioral superiority.

## Primary responsibilities can overlap

| System | Primary contract | Can carry judgment? | What KDNA does not replace |
|---|---|---:|---|
| Model | Learned inference and generation | Yes | Model capability or weights |
| Prompt | Invocation instructions and context | Yes | Prompt engineering and evaluation |
| Skill | Reusable capability, references, and tool procedure | Yes | Skill installation or execution contract |
| Knowledge base / Wiki | Content organization and access | Yes | Document authority and collaboration |
| RAG / Search | Query-time retrieval | Yes | Retrieval, citation, or current-fact lookup |
| Memory | Persistence and continuity | Yes | User history and application state |
| Policy | Governance rules, principles, discretion, and authority | Yes | Enforcement authority or permissions |
| Workflow | Sequencing, state, approvals, and retries | Yes | Process execution |
| MCP / Tools | Server, resource, prompt, and tool interaction | Yes | Capability access or action authority |
| Evaluation | Measurement under a named method or rubric | Yes | Content ranking or outcome proof |
| KDNA | Judgment asset identity and compatible loading | Yes — first-class payload responsibility | Any of the systems above |

“Primary” does not mean “exclusive.” A Skill may classify situations; a Policy
may contain discretionary judgment; RAG may retrieve a rubric; a Prompt may be
structured and regression-tested. Conversely, a `.kdna` payload may include
factual premises, examples, method descriptions, or references needed to
express its judgment. Core does not turn those premises into ground truth or
those methods into executable authority.

## KDNA and Prompt

Prompts can be structured, versioned, tested, composed, and inspected. When a
prompt system already provides the required identity, deployment, and control,
there may be no reason to add KDNA.

KDNA becomes useful when the judgment needs an identity and lifecycle
independent from one prompt implementation, or when compatible runtimes must
verify exact bytes, authorization, projection, replacement, or rollback.

## KDNA and Skill

A Skill can package instructions, references, scripts, and tool workflows, and
it can contain substantial judgment. A `.kdna` asset is not a competing claim
that the Skill is “only execution.” Its primary contract is the distribution
and loading of judgment as an asset.

A Skill may load KDNA, embed equivalent judgment directly, or use both. A
separate asset adds value when the judgment should be updated, authorized, or
reused independently from the Skill.

## KDNA and knowledge, RAG, and Memory

Knowledge systems and Memory can store facts, interpretations, preferences,
rules, and judgment. RAG can retrieve any of those contents. Their primary
contracts are storage, continuity, and retrieval.

KDNA does not replace them and is not a world-fact authority. Its contract can
prove that one named judgment asset version was inspected, authorized, and
projected. Retrieval can supply current evidence and source material that a
judgment asset should not duplicate.

## KDNA and Policy, Workflow, MCP, and tools

Policy and workflows often contain judgment. Tool selection and code execution
also require judgment about safety, evidence, stopping conditions, and
authorization.

Loading KDNA never grants action authority. Permissions come from the user,
Host, Policy, identity, and external systems. KDNA can provide a judgment input
to those systems; it cannot enforce a rule, approve a deployment, or call a tool
by format validity alone.

## KDNA and evaluation

KDNA Core validates the format and loading contract. Evaluators may test the
asset's content or observed behavior under named methods. Those conclusions
belong to the evaluator and must not be converted into intrinsic Core quality,
risk, trust, or recommendation fields.

The same content in a Prompt and a `.kdna` may produce the same result. That
does not make the test meaningless: it shows that behavior came from the
judgment content, while KDNA's separate claim concerns asset identity and
delivery.

## When KDNA adds value

Use KDNA when several of these are required:

- the judgment needs an identity separate from one application or model;
- exact version and byte integrity matter;
- authorization or task-scoped projection must be checked;
- the same asset must move across compatible Agents or runtimes;
- replacement, revocation, rollback, or consumption evidence matters.

Use the simpler Prompt, Skill, document, Policy, Memory, or retrieval system
when its existing contract is enough. Not every judgment needs a `.kdna` file.

## Example: one task, overlapping carriers

An article-publishing system may use:

| Component | Example contribution |
|---|---|
| Prompt | “Revise this draft for publication.” |
| Knowledge / RAG | Brand notes, audience research, and cited sources |
| Memory | The user's current preferences and prior decisions |
| Skill | Analyze structure, edit sections, and prepare the CMS payload |
| Policy / Workflow | Approval, legal review, and publish permissions |
| KDNA | A named writing-judgment asset shared across multiple editors |
| Evaluation | A method-specific review of the draft or final outcome |

Judgment may appear in every row. The architecture remains clear because each
system keeps its own authority and contract.

## Final principle

> KDNA is an open format and loading protocol for judgment assets. It does not
> own judgment; it makes a selected judgment system portable under an explicit
> technical contract.
