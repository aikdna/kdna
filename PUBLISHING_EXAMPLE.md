# Historical Registry Publishing Example — Withdrawn

> **Status:** Historical and non-operational. The former registry-PR workflow,
> signature commands, quality badges, trust gates, and example registry records
> are not current KDNA Core or Preview contracts.

The original example mixed asset creation, asset signing, registry policy,
evaluation claims, trust decisions, and distribution into one workflow. Several
commands and fields no longer exist in the corrective Preview candidate, and
the asset-signature representations were mutually incompatible.

Current local verification of an exported asset is deliberately narrower:

```bash
kdna validate ./dist/my-domain.kdna
kdna plan-load ./dist/my-domain.kdna
kdna load ./dist/my-domain.kdna --profile=compact --as=json
```

Distribution channels may publish exact asset bytes, a version, a digest,
boundaries, and known limitations. Any provenance or evaluation assertion must
name its own issuer, subject, scope, method, and evidence; it does not become a
Core quality or trust property.

Git history preserves the superseded registry example. No command, registry
responsibility, signature contract, benchmark gate, or compatibility promise
may be inferred from it.
