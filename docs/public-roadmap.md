# KDNA Public Roadmap

## One definition

KDNA is a judgment-asset container and protocol. It makes implicit, scattered,
or latent judgment explicit so that it can have independent identity, version,
integrity, provenance, encryption, authorization, loading, and governance.
Compatible tools and hosts can create, carry, inspect, authorize, and consume
that judgment without silently rewriting it.

KDNA does not claim to add model intelligence or guarantee better output. Its
core value is making selected judgment portable, verifiable, manageable, and
usable across tools and ecosystems.

## One ecosystem, different responsibilities

The public repositories form an end-to-end ecosystem whose components have
different responsibilities, maturity, and release schedules:

| Responsibility | Repositories | Mission |
|---|---|---|
| Protocol and Core | `kdna` | Container, schema, identity, integrity, encryption, authorization, and loading contracts |
| Runtime tooling | `kdna-cli` | Inspect, validate, plan, manage, load, and consume KDNA assets |
| Authoring | `kdna-studio-core`, `kdna-studio-cli` | Make implicit judgment explicit, review it, and export versioned assets |
| Reference assets | `kdna-assets` | Interoperability fixtures and reference judgment assets |
| Apple ecosystem | `kdna-core-swift`, `kdna-app-shared`, `kdna-studio-swift` | Swift runtime, shared application contracts, and native authoring integration |
| Agent and editor integration | `kdna-skills`, `kdna-vscode` | Agent, Skill, MCP, and editor workflows for KDNA creation and consumption |
| Web ecosystem | `kdna-web-client`, `kdna-web-server`, `kdna-react`, `create-kdna-web-app`, `kdna-demo-web-viewer` | Browser, server, React, scaffolding, and demonstrable end-to-end integration |
| Authorization and remote use | `kdna-activation-server`, `kdna-remote-server` | Optional entitlement, revocation, and remote consumption deployments |

The website is the public entry point for explaining this ecosystem. A
component can be experimental, pre-release, inactive, or awaiting evidence
without losing its mission or being removed from the ecosystem by default.

## What is being corrected

Current work separates four questions that were previously mixed together:

1. Is the protocol contract internally correct?
2. Does a particular tool or integration implement its declared contract?
3. What maturity and compatibility does an exact version promise?
4. Does a real user need a particular workflow?

Repository existence, test volume, package publication, and one coordinated
release wave do not answer all four questions. Maturity must be stated per
component, and integration value must not be inferred from whether it is in the
next release set.

## Claim boundary

KDNA does not claim to increase intelligence, improve output by a percentage,
or make one carrier intrinsically superior to another. Those are not protocol
claims or project-level release gates. An asset owner may assess a specific
asset for a specific use, but that assessment does not decide whether the
container, toolchain, authorization model, or ecosystem integrations should
exist.

Protocol and product evidence instead focuses on:

- container identity, version, and byte integrity;
- faithful preservation of declared judgment and boundaries;
- encryption, authorization, revocation, and rollback;
- deterministic validation and accurate load planning;
- interoperable creation and consumption across supported hosts;
- explicit, versioned failure when a contract is unsupported.

## Current priorities

1. Reconcile public claims with exact released versions without erasing the
   ecosystem's missions.
2. Fix confirmed protocol, security, schema, projection, and version-integrity
   defects.
3. Verify the minimal create-to-consume path and preserve judgment fidelity.
4. Establish the file-first, user-authorized Host experience: explicit file or
   attachment, visible active state, and disable/switch/rollback control.
5. Give every integration an explicit maturity statement and reproducible
   compatibility evidence.
6. Publish future Development Preview coordinates component by component when
   their own gates are satisfied.

No new version may overwrite an existing coordinate. No repository is promoted
to stable merely because tests pass, and no repository is retired merely
because it is outside one Preview wave.

## Contribution boundary

New work should explain how it contributes to creating, carrying, verifying,
authorizing, governing, or consuming judgment assets. Intelligence-enhancement
and generalized superiority claims are out of scope.
Changes to a repository's mission or lifecycle require an explicit owner
decision; they cannot be inferred from cleanup, release scoping, or an Agent
audit.
