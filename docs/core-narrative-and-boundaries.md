# KDNA Core Narrative and Boundaries

**Status:** current public product definition. Read exact wire behavior from
[SPEC.md](../SPEC.md), adopted specifications, schemas, fixtures, and the release
artifacts for the version you use.

## Definition

> KDNA is an open judgment-asset format and runtime protocol. It gives a
> bounded judgment system an independent file, identity, version, integrity,
> access, projection, and lifecycle contract.

People, organizations, Agents, tools, and mixed workflows may create KDNA
assets. KDNA Core validates technical claims; it does not decide whether the
judgment is true, good, expert, representative, or appropriate for a task.

## What the asset contains

A judgment system may express priorities, taste, standards, boundaries,
trade-offs, risk models, preferences, stances, exceptions, and methods of
choosing. It may include facts, examples, references, or methods needed to
explain those judgments, but KDNA is not thereby a general document store,
knowledge base, Policy engine, workflow, or executable package.

The same judgment may also live in a Prompt, Skill, Policy, Memory, knowledge
base, workflow, model, or ordinary document. Those carriers can be versioned,
tested, and reused in their own systems. KDNA adds value when the selected
judgment needs an independent asset and a shared loading contract; it does not
claim exclusive ownership of judgment or automatic behavioral superiority.

## Content neutrality

KDNA Core may verify:

- container and schema conformance;
- identity, version, digest, and compatibility coordinates;
- declared provenance and optional signature facts;
- encryption and authorization states;
- LoadPlan and Runtime Capsule structure;
- whether a compatible implementation preserved required semantics.

KDNA Core does not verify:

- factual or moral correctness of the asset;
- author expertise, sincerity, or real-world identity;
- universal content quality or recommendation;
- task applicability chosen by a Host;
- tool permission or authority to act;
- guaranteed improvement in an answer or outcome.

“Correct” is not a universal label for every judgment. A factual premise can
be verified, a constraint can be satisfied, an asset can match its creator's
declared intent, and an evaluator can prefer an outcome under a named rubric.
Taste, style, risk tolerance, and value ordering usually require that authority
and scope to be named.

## The `.kdna` file

The canonical distributed asset is one `.kdna` file. Authoring workspaces,
expanded JSON, catalog pages, receipts, and evaluation reports are related
objects, not substitutes for the distributed asset.

A compatible Agent consumption path is:

```text
explicit file or authorized attachment
→ inspect
→ LoadPlan
→ authorization / integrity / compatibility
→ load and project
→ Runtime Capsule
→ Host delivery
→ Agent use
```

Agents and applications consume the Runtime Capsule. Generic ZIP extraction or
raw payload decoding is a developer/audit action, not a compatible Agent
runtime.

## Local use and user authority

KDNA does not require a global asset library or an installation step. A user
may inspect and load a `.kdna` file directly. A product may preserve an
immutable local snapshot, receipt, credential, or cache for repeated use, but
storage never grants task authority.

These are separate facts:

1. the file exists or was discovered;
2. a copy was saved;
3. an exact version and digest were attached to a workspace, application, or
   session;
4. the user or Host authorized that relationship;
5. the asset applies to the current task;
6. the Runtime actually loaded and delivered it.

An Agent adapter may help execute an explicit selection or a Host-authorized
attachment. It must not scan arbitrary machine assets, choose one from a broad
task description, and hide that decision. The Host must make the active asset,
version, scope, and reason inspectable and must support disable, switch, and
rollback.

`~/.kdna`, a project `.kdna/` directory, a Registry, Store, Skill, or MCP server
is an implementation choice, not a source of content authority and not a
format-validity requirement.

## Authority order during use

The asset supplies scoped judgment; it does not take over the task. Current
user intent, verifiable facts, law, safety policy, Host permissions, and
environment constraints remain authoritative. They may make an otherwise valid
asset inapplicable or unloadable.

Loading an asset does not turn the Agent into the author, copy a personality,
or make the asset true. A Host can faithfully deliver a judgment that a named
evaluator dislikes or that conflicts with current facts. Delivery, adoption,
and external outcome are different claims.

## Access and provenance

The public protocol defines version-specific access and authorization
contracts. An access declaration describes how content may be obtained; it is
not a content ranking. Encryption protects content according to its exact
profile. A signature binds specified bytes or a digest to a key; identity,
expertise, endorsement, and content correctness remain separate claims.

Human review, organizational approval, AI generation, Agent generation, and
mixed creation are provenance facts when declared. They are not universal
format-validity requirements. An asset that claims to represent a person or
organization needs evidence for that representation; an ordinary asset does
not need to make such a claim.

## Single and multi-asset use

One asset is the atomic and default path:

```text
select one .kdna → plan-load → load → use
```

Multi-asset composition is an explicit advanced product capability. It must
not be activated implicitly, embedded as hidden policy in a single asset, or
used to bypass the authorization and loadability of each component.

## Evidence and product maturity

Technical conformance, provenance, Host delivery, observed adoption, and
external outcome are separate evidence classes. Passing one does not prove the
next. Optional evaluators may publish scoped assessments, but those assessments
do not decide whether a technically valid asset may exist or load.

The public ecosystem is pre-release. A repository mission, a published 0.x
package, a green test suite, a local corrective candidate, and a compatibility
promise are distinct facts. Use the exact version's release notes and public
contracts; do not infer whole-ecosystem maturity from one component.

## Durable limits

KDNA does not store a complete mind, complete personality, all knowledge, or
general intelligence. It does not grant tool access, network access, payment,
deployment, or representation authority. If a Prompt, Skill, document, Policy,
Memory, or knowledge system already provides the needed contract, use the
simpler mechanism.
