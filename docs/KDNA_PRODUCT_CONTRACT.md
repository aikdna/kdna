# KDNA Product Contract

All KDNA products share one protocol boundary:

1. Studio-compatible tools create projects and export `.kdna` assets.
2. The KDNA Asset Container is the canonical portable and distributed object.
3. KDNA Core validates the container and returns the LoadPlan.
4. Only `can_load_now: true` permits loading.
5. Core performs optional in-memory decryption and returns a Runtime Capsule.
6. Agents and applications consume the Capsule, not ZIP entries or raw CBOR.

No installation step or global library is required. File storage, Host
attachment, authorization, task applicability, and load are separate. A Host
may remember an exact user-approved attachment, but it must expose the active
asset, version or digest, scope, and reason, with disable/switch/rollback
controls.

Products MUST NOT redefine the manifest, access states, payload schema,
authorization logic, signature facts, or Capsule shape.

Normative sources:

- [Core narrative and boundaries](./core-narrative-and-boundaries.md)
- [KDNA specification](../SPEC.md)
- [Asset container](../specs/container.md)
- [Authorization contract](../specs/kdna-authorization-contract.md)
- [Runtime Capsule](../specs/runtime-capsule.md)
- [Studio export contract](./STUDIO_EXPORT_CONTRACT.md)

KDNA Core is content-neutral. It validates technical contracts; it does not
decide whether an author's judgment, taste, values, standards, or personality
are true, good, recommended, or worthy of publication.
