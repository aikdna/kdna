# Open Ecosystem Readiness

> Status: readiness criteria, not a completion claim.

KDNA is a 17-repository pre-release ecosystem. Repository or package existence
does not prove that every coordinate works together, and adapter presence does
not prove a usable Host experience.

## Protocol and toolchain bar

- One exact `.kdna` file can be created, exported, inspected, validated,
  planned, authorized, and loaded at pinned package coordinates.
- Shared schemas and conformance fixtures establish the same technical meaning
  across maintained implementations.
- Encryption and authorization fail closed and do not grant Agent action
  permissions.
- Public documentation distinguishes released coordinates from unpublished
  corrective candidates.

## Host and user-experience bar

- A Host begins with an explicit file or exact user-approved attachment.
- Saving, discovery, attachment, authorization, applicability, and loading are
  distinct.
- Active identity, version or digest, scope, and reason remain visible.
- The user can disable, switch, and roll back an attachment.
- Skill and MCP integrations remain thin adapters and do not select authority
  for themselves.

## Integration bar

Each Web, React, Swift, editor, Agent, activation, or remote integration must be
judged at its own exact version and dependency coordinates. A test in one
repository cannot promote the rest of the ecosystem.

The `kdna-loader` Skill is currently Unassessed. The presence of an MCP adapter
or installation guide is not evidence that an Agent integration satisfies the
current Host contract.

## Stronger public claims require

1. an exact bill of materials;
2. clean-source and packaged-artifact verification at those coordinates;
3. end-to-end technical evidence for each claimed integration;
4. a real user acceptance flow that checks attachment, scope, visibility,
   authorization, disable/switch/rollback, and semantic preservation;
5. owner approval of the exact release artifacts.

Behavioral outcome claims, if anyone chooses to make them, require separately
named evaluation evidence. They are not protocol readiness criteria.
