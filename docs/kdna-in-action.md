# KDNA in Action

> These are illustrative examples, not benchmark evidence. They show how a
> judgment asset may participate in a task and what the KDNA contract adds.

## Content changes behavior; the carrier changes the contract

Suppose a sales system uses this judgment:

> Before treating “too expensive” as a request for a discount, distinguish a
> real budget limit from uncertainty about value, risk, or approval.

That judgment could be written directly in a Prompt, embedded in a sales Skill,
stored in a Policy or playbook, retrieved from a knowledge base, learned by a
model, or packaged in a `.kdna` asset. If the same model receives equivalent
content, the Prompt and KDNA paths may produce the same answer. That is normal:
the behavioral influence comes from the judgment content.

KDNA adds a different claim. A compatible runtime can identify which asset
version and bytes were inspected, whether loading was authorized, what was
projected, and what Runtime Capsule was delivered. It does not prove that the
sales judgment is correct or better than another judgment.

## Example: meeting decision state

**Input:** A meeting transcript says the team agrees that a module should be
rewritten, but it names no owner, deadline, or acceptance condition.

One judgment system may classify that state as unresolved and recommend that
the team assign ownership before execution. Another may treat the agreement as
sufficient to begin discovery. KDNA does not decide which view is correct. It
can faithfully package either bounded judgment system so that the Host knows
which one it loaded.

A task may combine:

- RAG for the transcript and current project evidence;
- Memory for prior decisions and user preferences;
- a Skill for extracting decision records;
- Policy for who may approve the rewrite;
- KDNA for one named decision-state judgment asset;
- an evaluator for checking the resulting decision record.

Judgment may exist in every component. Their contracts remain distinct.

## Prompt and KDNA can contain the same judgment

| Concern | Prompt system | KDNA asset |
|---|---|---|
| Can express structured judgment | Yes | Yes |
| Can be versioned and tested | Yes, under the owning application | Yes, under the KDNA asset contract |
| Identity and digest | Application-defined | Standard KDNA manifest and integrity contract |
| Authorization and projection | Application-defined | LoadPlan and Runtime Capsule contract |
| Tool permission | Not granted by prompt text alone | Not granted by asset validity or loading |
| Content quality | Requires external evaluation | Requires external evaluation |

KDNA is useful when the judgment must travel independently from one Prompt,
Skill, model, or application. If no such requirement exists, the simpler
carrier may be the right choice.

## What a valid example can establish

A technical example can establish that:

1. a `.kdna` asset conforms to the current format;
2. its identity and bytes pass integrity checks;
3. a compatible Runtime produced a LoadPlan and Runtime Capsule;
4. the Host received the recorded projection.

It cannot establish, without separate evidence, that:

- the encoded judgment is true, expert, authentic, or desirable;
- KDNA caused a better answer than an equivalent Prompt or Skill;
- a model followed every projected judgment;
- the Agent had permission to take an external action.

This separation is intentional: KDNA standardizes judgment-asset delivery,
while authors, Hosts, evaluators, and users remain responsible for content and
outcomes.
