---
name: kdna-loader
description: Validate and load one explicit KDNA .kdna file when the user asks to use that file or the Host supplies an exact user-approved attachment. Do not discover, install, auto-select, or silently apply assets.
---

# KDNA Loader

This adapter consumes one explicit KDNA judgment asset through the official
KDNA CLI/Core boundary. It does not define the KDNA protocol or decide which
judgment has authority.

## Activation boundary

Use this Skill only when either:

- the user explicitly asks to use a specific local `.kdna` file; or
- the Host supplies an exact attachment already approved by the user, including
  file identity or path, version or digest, and attachment scope.

Do not scan directories or a global asset store, call discovery or matching
commands to choose an asset, infer consent from file presence, or activate from
broad task keywords. If no exact approved asset is available, continue without
KDNA or ask the user to choose one.

## Validate and plan

```bash
kdna validate <file.kdna>
kdna plan-load <file.kdna> --json
```

Do not parse the ZIP, decode the payload, or infer authorization from manifest
fields. Continue only when Core reports `can_load_now: true`.

## Load

```bash
kdna load <file.kdna> --profile=compact --as=json
```

Use only the toolchain-produced Runtime Capsule. Never expose credentials,
encrypted payloads, protected source content, or raw container internals.

## Visible Host state

Current facts, explicit user intent, law, safety rules, system and developer
instructions, and Host permissions take precedence over the selected judgment.
The Host must show active identity, exact version or digest, attachment scope,
and load reason, with disable, switch, and rollback controls.

Do not hide whether KDNA was used. Do not claim that an asset is true, expert,
officially approved, or guaranteed to improve the result.

## Failure handling

| Situation | Action |
|---|---|
| No explicit file or approved attachment | Do not use KDNA. |
| Ambiguous choice | Ask the user; do not choose autonomously. |
| `can_load_now` is not `true` | Follow Core or block. |
| Outside declared scope | Skip the asset. |
| User disables or replaces it | Stop using it immediately. |
