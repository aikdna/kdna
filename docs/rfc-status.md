# KDNA RFC Status

This index lists the public status of RFCs that are relevant to the maintained
KDNA Core surface.

| RFC | Title | Status | Public guidance |
|---|---|---|---|
| RFC-0009 | Artifact Contract | Historical / outside Core runtime path | Consult its versioned schemas before adopting it. |
| RFC-0010 | Fidelity Protocol | Historical / outside Core runtime path | Consult its versioned schema and evaluation guidance. |
| RFC-0011 | Product Runtime | Accepted proposal | It does not change the canonical `.kdna` container. |
| RFC-0012 | Artifact Envelope | Draft | Not a current Core requirement. |
| RFC-0013 | Judgment Asset Lifecycle | Withdrawn | Archived; no Core fields or behavior were adopted. |
| RFC-0014 | KDNA Asset Authorization, Entitlement, and LoadPlan | Proposed | Proposed authorization/entitlement/LoadPlan contract; not yet accepted as a binding compatibility promise. |
| RFC-0015 | Runtime Trace extension | Withdrawn | Archived; use the maintained trace schema and documentation. |
| RFC-0021 | KDNA Signature Track | Draft — M1 bound (pre-release candidate) | M1 asset signatures (`kdsig.ed25519`) are implemented in the JavaScript and Python Cores and bound as a pre-release candidate; M2–M6 are not yet implemented and remain non-binding. |

The canonical protocol is [SPEC.md](../SPEC.md). Runtime behavior is described
by released package documentation. A draft RFC never establishes a compatibility
promise until the specification and a versioned implementation explicitly adopt it.
