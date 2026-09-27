# KDNA public specification index

The R2 implementation candidate uses the exact combination in [public version policy](specs/public-version-policy.md). Implementation, independent acceptance, live landing and release are separately recorded. The unique machine authority is [public semantic source](specs/public-semantic-source.json); generated artifacts are listed by [public generation manifest](specs/public-generation-manifest.json). Historical contracts retain their original bytes and meanings.

| Responsibility | Current reference |
|---|---|
| Container and Manifest selector | [Container](specs/container.md), [new combination schema](schema/manifest-container-0.5.0-judgment-0.5.1.schema.json) |
| Full authored judgment/asset definition | [R2 definition set](specs/r2/README.md), [Payload schema](schema/payload-profile-0.5.1.schema.json) |
| Canonical IR | [IR 0.6 schema](specs/canonical-ir-0.6.1.schema.json) |
| Four-mode Read | [Read contract](specs/read-contract.md), [Read 0.6.3 schema](specs/read-contract-0.6.4.schema.json) |
| Component profile binding | [Component semantics 2](specs/component-semantics-2.md) |
| Static policy carrier | [Static policy 2](specs/static-policy-2.md) |
| Protected source | [R2 binding](specs/protected-source-r2.md) |
| Issuer | [R2 binding](specs/external-grant-issuer.md) |
| PackageSet | [Node 0.2](specs/package-set-node.md) |
| Runtime/plan/host/trace | [Execution 0.3](specs/execution-contract-0.3.md) |
| Remote response admission | [Read transport 0.2 schema](specs/read-transport-admission-0.2.1.schema.json) |
| Cryptographic/authorization contracts | [Protection admission](specs/protection-admission.md), [Protection adoption](specs/protection-adoption.md) |
| Earlier specifications | [Pre-R2 index](specs/history/pre-r2/SPEC-INDEX.md) |

No RFC draft becomes stable merely by appearing in an index. Old 0.1/0.2 schemas, prior typed profiles, crypto and grant identities keep their own support and evidence boundaries; the new consumer does not silently read or migrate old semantic tuples. Formal business assets and Reader work require their own later authorization/acceptance.
