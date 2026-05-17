# KDNA Meta-Cognition

> [中文版](./meta-cognition.zh.md) · See also: [Evaluation Framework](./evaluation.md)

How agents should think about using KDNA itself — when to apply it, when to skip it, how to resolve conflicts, and how to compose domains.

This is the judgment layer for the judgment layer.

## 1. The First Question: Should KDNA Be Used At All?

Before loading any KDNA, the agent should ask: **"Would domain cognition change the reasoning trajectory here, or just add overhead?"**

### Use KDNA when

| Condition | Example |
|---|---|
| The task requires diagnosis, not just information retrieval | "Why is this sales page not converting?" |
| The domain has non-obvious judgment patterns | Distinguishing price objection from certainty deficit |
| The user's framing likely contains domain-specific misunderstandings | "The employee won't execute → motivation problem" |
| The output quality depends on terminology precision | Legal, medical, security domains |
| The agent would otherwise give generic, common-sense answers | "Make it more fun" for elder engagement |

### Skip KDNA when

| Condition | Example |
|---|---|
| The task is purely mechanical | Format JSON, extract emails, translate text |
| The domain judgment is obvious to any competent adult | "Is 2+2=4?" |
| KDNA would slow down a time-sensitive operation | Real-time data processing |
| The loaded KDNA does not change the reasoning path | Vague axioms that produce the same output as no KDNA |
| The user explicitly asks for a generic, non-specialized response | "Give me the standard textbook answer" |

### The KDNA Humility Principle

> **KDNA shapes judgment. It does not replace evidence, override user intent, or substitute for missing facts.**

If KDNA axioms conflict with specific evidence the user provides, the evidence takes priority. If the user explicitly rejects a KDNA-shaped framing, respect that. KDNA is a lens, not a dogma.

## 2. Single Domain vs Multi-Domain

### When one domain is enough

Most tasks need only one leading domain. The agent should:
1. Identify the primary domain from the user's goal.
2. Load Core + Patterns for that domain.
3. Use optional files only if the task triggers their load conditions.
4. Answer within that domain's frame.

### When to load multiple domains

Load multiple domains when:

- The user's task spans two distinct judgment areas (e.g., "Review this sales page copy" involves both sales and communication)
- One domain provides the primary lens and another provides constraints
- The domains address different layers of the same problem

### Composition rules

When using multiple domains:

1. **One leader, others as advisors.** Pick one primary domain. Other domains provide constraints, boundaries, or checks — not competing answers.
2. **Surface conflicts, don't blend.** If domain A says "price objections are certainty deficits" and domain B says "price objections are value communication failures," tell the user: "Domain A interprets this as a certainty problem. Domain B sees it as a communication quality problem. Which lens is more useful here?"
3. **Don't average.** Combining two domain stances into a middle-ground answer produces mush. Pick one frame and use the other as a quality check.
4. **Check terminology overlap.** If two domains define the same term differently, choose one definition for the output and note the ambiguity.

## 3. Conflict Arbitration

When two KDNA domains give contradictory guidance:

### Resolution order

1. **User intent overrides domain preference.** If the user explicitly chooses a framing, use it.
2. **Specific domain over general domain.** A domain built for the exact problem beats a tangentially relevant one.
3. **Evidence over axiom.** If the user provides facts that contradict a domain axiom, the facts win.
4. **Stated boundary wins.** If domain A says "this does NOT cover X" and the task is about X, domain A disqualifies itself.

### When to reject KDNA guidance

- The domain's axioms are contradicted by specific, verifiable evidence in the current case.
- The domain's terminology actively confuses the user.
- The domain's self-check items cannot be satisfied for this task.
- The domain is marked `deprecated` or `draft` and the risk of bad judgment is high.

## 4. Domain Selection Heuristics

### By user language

- If the user asks in Chinese about a domain that has a Chinese KDNA version, prefer the Chinese-language domain over the English one.
- If only an English KDNA exists but the user is Chinese, load the English KDNA but translate the reasoning in the output.

### By task type

| Task type | Domain selection priority |
|---|---|
| Diagnosis/review/critique | Load the domain whose axioms define the diagnostic lens |
| Creation/generation | Load the domain whose frameworks define the creative structure |
| Decision/choice | Load the domain whose stances define the evaluation criteria |
| Learning/improvement | Load the domain whose Evolution model defines the growth path |

### By domain maturity

When multiple domains match, prefer:
1. `stable` — production-ready, known quality
2. `experimental` — usable but evolving
3. `draft` — use only if no better option exists, and warn the user
4. `deprecated` — only use if the user explicitly requests it

## 5. KDNA Load Boundaries

### Don't load KDNA for sub-tasks

If the user asks a sales question and the agent needs to look up a definition, the definition lookup does not need KDNA loaded. Only the primary judgment task does.

### Don't pre-load domains "just in case"

Loading unused KDNA wastes context. Wait until the task requires domain judgment, then load the relevant domain.

### Don't load KDNA for internal agent operations

Tool selection, code execution, file I/O — these are mechanical operations. KDNA is for user-facing judgment, not for agent plumbing.

## 6. When KDNA Makes Things Worse

KDNA can degrade output quality when:

- **Overfitting.** The agent forces a domain frame onto a situation it doesn't fit. Example: applying "price objection as certainty deficit" to a customer who genuinely cannot afford the product.
- **Terminology rigidity.** The agent insists on domain terminology that the user doesn't understand.
- **False diagnosis.** The agent detects a "misunderstanding" that isn't there, because the domain's misunderstanding list is too aggressive.
- **Premature closure.** The agent stops thinking once it finds a domain pattern match, missing the unique aspects of the case.

### The meta-check

Before finalizing any KDNA-shaped answer, the agent should ask:

1. "Would this answer still make sense if I removed all domain-specific terminology?"
2. "Am I fitting the situation to the KDNA, or fitting the KDNA to the situation?"
3. "Is there a simpler, correct answer that doesn't need this domain at all?"

If the answer to (3) is yes, prefer the simpler answer.
