# KDNA Asset Container — R2 combination

Status: unpublished implementation candidate. Container framing is 0.5.0. A `.kdna` file is a ZIP containing exactly identified typed entries; public Core is responsible for admission and canonical semantics. A ZIP tool revealing bytes does not replace Core, public Read or Host permissions.

The required entries remain `mimetype` (exact ASCII `application/vnd.kdna.asset`), `kdna.json` (strict UTF-8 JSON Manifest) and `payload.kdnab` (CBOR payload or its explicitly declared protected envelope). Checksums, signatures and declared resources retain their existing contracts. No duplicate entry, alternate judgment payload, legacy authoring-source tree or undeclared execution capability is accepted. Resource declarations do not authorize download or execution. Signature/grant identities, content-digest domains and encryption identities remain distinct.

## Manifest selection

Framing `format_version` alone is insufficient to select semantic Manifest obligations. The existing three fields select the contract:

```json
{"format_version":"0.5.0","compatibility":{"min_loader_version":"0.36.0","profile":"kdna.payload.judgment","profile_version":"0.5.0"}}
```

This fragment only illustrates the selector and is not a complete Manifest. `min_loader_version` is not a selector. The new combination uses [manifest-container-0.5.0-judgment-0.5.0.schema.json](../schema/manifest-container-0.5.0-judgment-0.5.0.schema.json), ID `urn:kdna:schema:manifest:container:0.5.0:profile:kdna.payload.judgment:0.5.0`. Complete assets include the required identity/version/times/title/summary/languages/history, compatibility, payload metadata and actual semantic declarations. This is not permission to place judgment body in metadata.

Historical `manifest-0.2.schema.json` retains its original 0.5.0 framing/old profile meaning, fields and bytes. New history/summary/language obligations do not alter that old contract. The active loader explicitly rejects unsupported or mixed combinations rather than trying both schemas. No caller-supplied URI is fetched or used as an authority.

The R2 payload uses [payload-profile-0.5.schema.json](../schema/payload-profile-0.5.schema.json). Core verifies identity and content bindings before issuing an immutable IR snapshot. Public Read supplies authorized mode-complete content; runtime Capsules supply the exact required judgment closure for separately authorized consumption. The protocol does not evaluate truth, infer missing classifications or claim that a rule has run.

See [version policy](public-version-policy.md), [Read contract](read-contract.md), [execution 0.3](execution-contract-0.3.md) and [R2 definitions](r2/README.md). The obsolete 0.1 examples and sole-selector text are retained solely in [pre-R2 container history](history/pre-r2/container.md); they are not current authoring instructions.
