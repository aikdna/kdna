# KDNA Runtime Evidence Trace

The authoritative execution evidence object is `JudgmentTrace`, defined by
[`specs/judgment-trace.schema.json`](../specs/judgment-trace.schema.json) and
validated by the runtime-contract conformance suite.

Its purpose is not to record a persuasive story. It records bounded facts about
one execution chain:

- which packaged asset and Runtime Capsule were selected;
- whether budget enforcement allowed Host invocation;
- whether the Capsule was delivered and whether the Host returned;
- what request and receipt digests matched;
- whether semantic consumption was observed, not observed, or unproven;
- whether behavioral conformity was separately evaluated.

The trace MUST NOT infer model identity, token use, semantic understanding, or
judgment fidelity from process completion. Unknown and unobserved facts remain
explicitly unknown or unobserved.

Product reports may render a trace for people, but the report does not replace
the signed or digested protocol evidence. Historical application-specific
traces are not accepted as stable Agent Host execution evidence.

Run the authoritative vectors with:

```bash
npm run conformance:runtime-contract
```
