# When Judgment Needs Its Own Asset

Judgment can already live in prompts, policies, skills, tools, retrieval
systems, workflows, model behavior, team documents, and people. KDNA does not
claim that those carriers lack judgment, nor that moving the same content into
a `.kdna` file makes a model more intelligent.

KDNA is useful when selected judgment needs an independent delivery contract:

- a stable identity and version;
- an explicit scope and boundary;
- byte integrity and provenance;
- encryption or authorization;
- deterministic inspection and load planning;
- a Runtime projection that does not silently discard declared judgment;
- lifecycle operations such as replacement, revocation, and rollback.

## What becomes portable

A judgment asset can express choices such as:

- which distinctions matter inside a declared domain;
- which considerations take priority when they conflict;
- where a principle applies and where it does not;
- which failure modes and counterexamples constrain a decision;
- which questions should be checked before acting.

The author may be a person, team, institution, AI system, Agent, or mixed
process. If an asset claims to represent a particular person or institution,
the relevant creation workflow must record that subject's confirmation. Core
does not turn an unconfirmed inference into human authorship.

## Relationship to other carriers

Prompt, Skill, MCP, RAG, Memory, Workflow, Policy, and KDNA overlap. Any of them
may carry judgment. Their primary contracts differ:

| Carrier | Primary contract |
|---|---|
| Prompt | Invocation instructions and context |
| Skill | Reusable instructions, references, and tools |
| MCP / tools | Server, resource, prompt, and tool interaction |
| RAG / memory | Retrieval and continuity |
| Workflow / policy | Sequencing, governance, and enforcement |
| KDNA | Judgment-asset identity and compatible loading |

A well-engineered prompt or application-specific policy may be sufficient.
KDNA becomes relevant when the judgment must cross tools or hosts while
retaining an explicit identity, version, authorization state, and projection
contract.

## What loading proves

Successful loading can prove that a compatible Runtime recognized a specific
asset, verified the required technical contracts, satisfied its authorization
conditions, and produced a declared projection. It does not by itself prove
that:

- the judgment is true or universally appropriate;
- the model followed it;
- the output is better than an alternative;
- the asset grants tool permission or overrides current facts, user
  instructions, or safety policy.

Those questions require their own evidence. They are not format-validity or
project-existence gates.

KDNA's proposal is deliberately narrow: when judgment needs to be carried as
an asset, give that asset an honest, inspectable, versioned loading contract.
