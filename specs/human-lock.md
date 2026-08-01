# Human Judgment Lock Boundary

Status: **Optional authoring-governance concept; not a Core file requirement**

Human Judgment Lock is a name for provenance used by a workflow that explicitly
claims a human reviewed or confirmed a judgment change. It is not required for
an ordinary `.kdna`, Agent-authored asset, interpretive asset, or tool-authored
asset to be format-valid.

## 1. What the Claim Means

A workflow may make a Human-Lock claim only when it can bind:

- the exact content or decision that was reviewed;
- the exact reviewer identity appropriate to that workflow;
- the review decision and time;
- the content version or digest to which the decision applies;
- any declared scope, expiry, or revocation rule.

Changing the bound content invalidates the old claim unless the separately
defined governance contract says otherwise. A lock proves only that the named
review occurred. It does not prove that the judgment is true, useful, safe,
high-quality, official, or endorsed by KDNA.

## 2. Current Protocol Boundary

The current public Runtime manifest and payload schemas do not define a
universal `human_lock`, `human_locks`, `KDNA_Evolution.json`, proposal ledger,
emergency-override process, signature slot, or quality badge.

Therefore:

- Core validation does not require or infer Human Lock;
- `kdna pack` does not create human confirmation;
- Studio or another authoring product may keep review evidence in its private
  project state or in a separately versioned public receipt contract;
- an exporter must not insert undeclared Human-Lock fields or files into the
  strict Runtime container;
- a Host must not display “human reviewed” unless it has verified evidence
  defined by the workflow that makes that claim.

The earlier universal three-point gate and source-tree record formats are
retained only in
[`human-lock-gate-design.md`](./human-lock-gate-design.md) as withdrawn
history.

## 3. When Human Participation Is Required

Human participation is required only for authority claims that belong to a
human or organization—for example, “this asset represents this named person's
judgment” or “this organization approved this policy.”

It is not required merely because:

- an Agent created or interpreted material;
- an asset contains one or many judgments;
- the file is encrypted;
- a technical application test ran;
- a benchmark wants another label.

An autonomous Agent may create a valid asset under honest Agent/interpretive
provenance. It must not impersonate a person, organization, or human review.

## 4. Product Guidance

A product that adopts Human Lock should keep the user interaction proportional
to the claim and risk. It should not force a correction when the extracted
judgment is already correct, require a fixed number of reviewers or fields, or
turn a review count into a quality score.

The product should expose:

- what is being confirmed;
- whose authority is being claimed;
- what changed since the prior confirmation;
- whether the confirmation is current;
- how to withdraw or supersede it.

The exact receipt schema, signature system, UI, retention period, and
organizational approval policy require their own versioned contract. Until
such a contract is promoted, Human Lock remains optional workflow provenance
and not a KDNA wire-format promise.
