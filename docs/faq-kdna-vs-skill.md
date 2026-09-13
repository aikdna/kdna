# FAQ: KDNA with Skills, Prompts, and the AI Ecosystem

## What is KDNA?

KDNA is a **judgment asset format and loading protocol**. A `.kdna` file gives a
selected, bounded judgment system its own identity, version, integrity,
authorization, projection, and lifecycle contract.

Judgment may also exist in a Prompt, Skill, Policy, workflow, knowledge base,
Memory, model, or ordinary document. KDNA does not claim exclusive ownership of
judgment; it standardizes one way to distribute and consume it as an asset.

---

## Is a `.kdna` asset the same artifact as a Skill?

No. Their contents may overlap, but their primary contracts differ.

| | Skill | `.kdna` asset |
|---|-------|---------------|
| Primary contract | Reusable capability, instructions, references, or tool procedure | Judgment asset identity, integrity, loading, and projection |
| May carry judgment | Yes | Yes — as the first-class payload responsibility |
| May describe methods | Yes | Yes, when needed to express the judgment system |
| Grants tool authority | No; authority still comes from the Host/user | No |
| Portability | Defined by the relevant Agent/Skill system | Defined by the KDNA protocol |

---

## Can KDNA and Skill be used together?

Yes. This is the recommended pattern:

1. A **Skill** supplies the task capability, instructions, or references.
2. A **KDNA Runtime** loads a named judgment asset under its LoadPlan and
   authorization contract.
3. The Host decides how both inputs participate in the task and retains all
   execution authority.

The same code-review judgment may already be present in the Skill. A separate
`.kdna` becomes useful when that judgment needs independent versioning,
authorization, distribution, projection, or replacement across multiple hosts.

---

## Can a `.kdna` file contain Skill-like material?

It can contain method descriptions, examples, references, or relationships that
are necessary to express a judgment system. It is not a Skill installation
package, workflow engine, or executable-code authority. A KDNA Runtime never
turns attached or described material into permission to execute tools.

---

## What is a Work Pack?

A Work Pack is a **future concept** (design phase). It would define a multi-step
agent task with role bindings, review gates, and KDNA domain dependencies.

**Is Work Pack available now?** Treat Work Pack as an evolving application-layer concept, not part of KDNA format validity.
Do not use it in production. See [tool-status-matrix.md](tool-status-matrix.md).

---

## What is a Cluster?

A Cluster is the **explicit advanced multi-asset path**. It coordinates
multiple scoped KDNA assets under roles, routing, conflict, budget, and trace
controls.

**Is Cluster available now?** The CLI Cluster runtime is pre-release. Use a
single asset by default; choose Cluster only when the task truly needs multiple
assets and verify the exact CLI/Core pair.

---

## When should I write a Skill?

Write a Skill when:
- You need the agent to follow a specific procedure
- The task has clear steps (validate → review → report)
- The relevant Agent/Skill system already provides the identity, distribution,
  update, and trust contract you need
- Keeping the judgment inside that Skill is sufficient

---

## When should I write a KDNA?

Write a KDNA when:
- A selected judgment system needs an identity and lifecycle independent from
  one Prompt, Skill, model, or application
- Consumers must verify exact asset bytes, version, authorization, and projection
- The same asset needs to move across compatible Agents or runtimes
- Replacement, revocation, rollback, or consumption evidence matters

Do not create a `.kdna` merely because a task contains judgment. Use the simpler
carrier when it already meets the requirement.

---

## Can one Skill use multiple KDNA assets?

Yes. A Skill can load multiple KDNA assets if the task spans multiple judgment domains.
For example, a "publish blog post" Skill might load:
- `writing.kdna` (primary — judge the content)
- `brand-voice.kdna` (constraint — enforce brand boundaries)

---

## Can one KDNA guide multiple Skills?

Yes. A single KDNA asset is domain-specific, not task-specific. A `code-review.kdna`
asset can guide any Skill that does code review, regardless of the specific tool
or workflow.

---

## KDNA vs Prompt — what's the difference?

| | Prompt | KDNA |
|---|--------|------|
| Primary contract | Instructions and context for a model invocation | Judgment asset distribution and loading |
| Structure | Free text or any application-defined structure | Public KDNA Schema and container contract |
| Testing/versioning | Fully possible in the owning prompt system | Standardized asset validation, version, digest, and lineage |
| Reuse | Application-defined | Portable across compatible KDNA runtimes |
| Authorization/projection | Application-defined | LoadPlan and Runtime Capsule contract |

The same judgment can be represented in both. KDNA does not make it deeper or
better merely by changing the carrier.

---

## Why not just keep one Markdown file?

For a small, short-lived, single-person judgment, keep the Markdown file. That
is not a compromise — it is the right carrier when one person reads one file in
one tool, and it usually costs less to write and maintain than an asset.

A structured contract starts to pay for itself when the judgment has to outlive
the document:

| Requirement | One Markdown file | A `.kdna` asset |
|---|---|---|
| Exact revision of the judgment | Whatever your repository or drive keeps | Asset identity, version, and content digest |
| Who authorized what, and for which scope | Described in prose | LoadPlan, attachment scope, and authorization facts |
| Consistent reading across tools and Hosts | Each tool re-reads the text | One loading and projection contract |
| Replacing or rolling back a judgment | Edit the file | Versioned replacement with an explicit rollback |
| Proving which bytes a consumer read | Not usually retained | Consumption receipt and delivery digest |
| Authoring and maintenance cost | Low | Higher — schema, review, and export are real work |

Two honest costs: a `.kdna` asset is more work to author than a Markdown file,
and it will not make a weak judgment stronger. If neither the identity nor the
lifecycle requirement is real yet, the Markdown file is the better answer.

These capabilities are not unique to KDNA. Any system can implement identity,
authorization, revision, and consistent interpretation. KDNA's opportunity is
to make the shared conventions and the reading experience good, not to claim
that a particular file extension is irreplaceable.

---

## KDNA vs Memory or RAG — what's the difference?

Memory and RAG can store or retrieve facts, rules, preferences, examples, and
judgment. Their primary contract is persistence or retrieval. KDNA's primary
contract is the identity and compatible consumption of a bounded judgment asset.

Retrieving a passage that contains judgment does not prove that one exact asset
version was authorized, projected, and delivered. Conversely, loading a KDNA
asset does not make it a current-fact source or replace retrieval.

---

## KDNA vs MCP — what's the difference?

MCP standardizes server, resource, prompt, and tool interaction. KDNA standardizes
a judgment asset and its loading contract. An MCP server may expose KDNA assets,
and MCP prompts/resources may themselves carry judgment. Neither protocol grants
permission to act merely because content was delivered.

---

## Current shipped capabilities

`Released` means the command is shipped; the overall protocol and toolchain
remain pre-release. The exact per-command list lives in one place:
[tool-status-matrix.md](tool-status-matrix.md). It is not repeated here, because
a second copy is what drifted out of date last time.

Two rules that do not change: run `kdna plan-load` before `kdna load`, and keep
source directories as authoring inputs — runtime loading takes a packaged
`.kdna` file. Any command that the published CLI does not list exits 2 with
`command is not in the approved allowlist`.

---

## Where should I start?

1. `npm install -g @aikdna/kdna-cli`
2. `kdna demo minimal /tmp/hello`
3. `kdna pack /tmp/hello /tmp/hello.kdna`
4. `kdna validate /tmp/hello.kdna`
5. `kdna plan-load /tmp/hello.kdna`
6. `kdna load /tmp/hello.kdna --profile=compact --as=prompt`

For creating your own: see [first-domain-walkthrough.md](first-domain-walkthrough.md).
