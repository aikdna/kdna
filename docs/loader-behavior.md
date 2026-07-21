# Agent Adapter Behavior

> Current contract direction. The checked-in `kdna-loader` adapter remains
> unassessed for release until its implementation and installation flow are
> verified against this boundary.

## The adapter is not the authority

An Agent adapter may load only:

1. a `.kdna` path explicitly supplied by the user for the current task; or
2. an exact asset version and digest that a Host records as approved for the
   current workspace, application, or session.

It must not scan a global asset store, infer authorization from a task category,
or select an arbitrary installed asset. Discovery is not consent.

## Required sequence

```text
explicit selection or Host-approved attachment
→ inspect
→ plan-load
→ load only when can_load_now=true
→ consume the Runtime Capsule
→ expose active identity and scope through Host status
```

The adapter never unpacks the file, reads raw payload entries, bypasses a
failed LoadPlan, or treats a signature as content endorsement.

## Task applicability

Applicability is evaluated only after the eligible asset set is established.
An exclusion boundary disqualifies the asset. Competing assets with materially
different judgment require the user to choose. No clear fit means skip.

## Visibility

Do not paste protected internals into the user's answer. Also do not hide the
loading fact. The Host should make the asset identity, version, scope, profile,
and reason available and provide disable, switch, and rollback controls.

## Authority and failure

Current facts, user intent, law, safety policy, and tool permissions override
asset judgment. Validation, checksum, signature, authorization, compatibility,
or decryption failure blocks that asset. A skipped or blocked asset must never
be represented as loaded.
