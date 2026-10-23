# RFC-0022: Source Attribution Labels for Captured Judgment

Status: draft — not implemented. This RFC does not change the container `0.6`
contract, any published package, or any existing schema.

## Summary

Add an explicit source label to captured judgment so a reader can separate what the
author stated, what an Agent inferred, and what an Agent merely suggested. Labels are
additive; unconfirmed suggestions never enter the effective set.

## Motivation

A KDNA asset can carry judgment that a person stated, judgment an Agent derived from
material, and judgment an Agent merely proposed. Today the container records the
judgment without a declared provenance class, so a reader cannot tell which entries
belong to the author's own thinking. That distinction decides whether an asset can
honestly be described as "one person's thinking" at all, which makes it a format-layer
question rather than a guidance question.

## Normative rules

### Labels

| Label | Meaning | Required companion material |
| --- | --- | --- |
| `author_stated` | The named author asserted this. | A locator plus the original snippet the judgment was taken from. |
| `agent_inferred` | An Agent derived this from material. | The rationale, the producer identity, and the inputs it was derived from. |
| `agent_suggested` | An Agent proposed this and no author has confirmed it. | The proposal and its producer identity; it is **not** part of the effective set. |

`agent_inferred` and `agent_suggested` are deliberately separate: an inference can be
inspected against its inputs, while a suggestion is a candidate that still needs a
person to accept it. Collapsing them lets unconfirmed proposals read as findings.

### Effective set

1. The effective set is `author_stated` entries plus `agent_inferred` entries that
   carry their rationale.
2. `agent_suggested` entries stay outside the effective set until an author
   confirmation record exists for that entry.
3. An Agent must never relabel `agent_suggested` as `author_stated` or
   `agent_inferred`. Promotion happens only through an author confirmation record or
   a new asset version authored that way.
4. A withdrawal is recorded the same way as an addition: the entry keeps its history
   and gains a confirmation record that removes it from the effective set.

### Confirmation record (sketch, non-binding)

```
{
  "entry_digest": "<digest of the entry being confirmed>",
  "from_label": "agent_suggested",
  "to_label": "author_stated",
  "confirmed_by": "<author identity as declared by the asset or host>",
  "confirmed_at": "<timestamp>",
  "method": "author_review" | "author_edit" | "author_rejection"
}
```

Sketch only: field names, digests and placement are settled by the implementation RFC
that follows this one, not here.
RFC-0023 keeps this sketch non-binding and makes rejection/withdrawal outcomes
explicit: a confirmation record must be able to remove an entry from the stance
set without coercing an Agent proposal into `author_stated`.

## Non-goals

* No change to container `0.6` schemas in this RFC, and no silent tolerance that would
  make an unlabelled entry look labelled.
* No authorship authentication. A label states what the producer claims and what the
  confirmation record shows; proving who a person is stays with the signature track
  ([RFC-0021](./RFC-0021-signature-track.md)) and the account work.
* No automatic promotion path for `agent_suggested`, however strong a model's
  confidence is.

## Compatibility impact

The labels are additive. An implementation that does not understand them must treat an
asset carrying them as at least as strict as today: it may refuse to present entries it
cannot classify, and it must not present `agent_suggested` entries as author material.
No existing asset acquires a label by default, and no unlabelled entry may be presented
as if it were labelled.

## Conformance requirements

1. A conformance run must show that an `agent_suggested` entry is absent from the
   effective set until a confirmation record exists, and present afterwards.
2. It must show that an implemented reader never promotes a label on its own, including
   when the suggestion text is byte-identical to an author statement.
3. It must show that an asset carrying only unconfirmed suggestions produces an explicit
   empty-effective-set result with a reason, not a silently empty view.
4. It must show that an unknown label is refused rather than read as author material.

## Security considerations

A label is a claim by a producer, not authentication: it must never be treated as proof
that the named person authored, reviewed or adopted anything. Only a confirmation record
plus, where required, the signature track evidences that a specific person acted. The
label also must not become a covert channel for extra material: the companion snippet or
rationale is bounded like any other captured content.

## Open questions

1. Whether the confirmation record lives inside the asset or in a host-side record
   that the asset references.
2. Whether short author snippets are stored byte-exact or normalized with a locator.
3. How the labels interact with the judgment lifecycle contract
   ([`judgment.lifecycle`](../specs/public-semantic-source.json)) when a judgment is
   revised. (The former link to the withdrawn `specs/RFC-0013` is corrected by
   RFC-0023.)
4. Which of these rules are enforced at container admission versus at presentation,
   and whether an unknown label is a hard rejection or a bounded warning.
