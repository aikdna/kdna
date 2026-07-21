# Host Adoption Policy for KDNA

> [中文版](./meta-cognition.zh.md)
>
> This is product guidance for Hosts. It is not a KDNA format rule and does not
> authorize an Agent to discover or select arbitrary assets on a machine.

## Start from authority, not task keywords

A Host may consider a KDNA asset only when the user explicitly selected the
file or previously approved an exact asset version and digest for the current
workspace, application, or session.

The order is:

```text
user selection or approved attachment
→ eligible asset set
→ task applicability
→ LoadPlan and authorization
→ load / ask / skip / block
```

Task classification narrows an already-authorized set. It never grants an
asset permission to influence a task.

## Four decisions

| Decision | Meaning |
|---|---|
| `load` | One exact authorized asset clearly applies and LoadPlan permits loading |
| `ask` | More than one eligible asset or an ambiguous scope requires user choice |
| `skip` | No eligible asset clearly applies, or a simpler mechanism is sufficient |
| `block` | Validation, integrity, authorization, compatibility, or policy fails |

No asset is a valid default merely because it is newer, globally stored,
keyword-matched, or marked with a content-maturity label.

## Conflict order

During use, the Host preserves this authority order:

1. system, safety, law, and tool permissions;
2. current user intent and explicit task constraints;
3. verifiable current facts and evidence;
4. the selected asset's declared scope, boundaries, and judgment;
5. Host presentation and convenience preferences.

If two authorized assets encode materially different judgment, surface the
choice. Do not average them or silently select the one the Agent prefers.

## Visibility and control

The Host should make the following inspectable without dumping protected
content into every response:

- active asset identity, version, and digest;
- attachment scope: workspace, application, session, or one task;
- why the asset was loaded or skipped;
- LoadPlan and authorization state;
- controls to disable, switch, and roll back.

The ordinary answer need not quote asset internals. That is different from
hiding the fact that an asset affected the task.

## When to skip KDNA

Use a Prompt, Skill, Policy, document, Memory, or knowledge system when its
existing contract is enough. Skip KDNA when the task is outside the selected
asset's scope, when current facts contradict a premise, when the user rejects
the asset's frame, or when the Host cannot preserve its boundaries.

KDNA adds an independent asset and loading contract. It is not a requirement
for every judgment task.
