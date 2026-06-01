# Studio Export Contract

Studio Export is the asset build step that turns a Human-Locked Studio project
into an immutable `.kdna` asset. It is not a JSON save operation.

A `.kdna` asset is not created by writing JSON files. It is compiled by a
Studio-compatible authoring pipeline that performs human confirmation,
validation, canonicalization, identity generation, digest computation, signing,
optional encryption, and provenance recording.

**Hard boundary:** Optional encryption, when supported, MUST be represented as
protected entries inside the `.kdna` container (RFC-0008). App-private encrypted
envelopes, transfer wrappers, or any format that cannot be opened by KDNA Core
are NOT conforming KDNA runtime assets and MUST NOT be treated as canonical
exports.

## External Output

A conforming Studio exporter SHOULD write:

```text
dist/
  my_domain.kdna
  build-receipt.json
  provenance-report.json
  quality-gate-report.json
  human-lock-report.json
  eval-report.json
```

`build-receipt.json` is the local receipt for the build event. It records the
asset path, `asset_uid`, `project_uid`, `build_id`, `domain_id`,
`registry_name`, `content_digest`, `asset_digest`, compiler metadata, signature
status, encryption profile, and build time.

## Required Container Entries

The `.kdna` container MUST include:

```text
mimetype
kdna.json
KDNA_Core.json
KDNA_Patterns.json
```

It SHOULD include:

```text
KDNA_CARD.json
README.md
LICENSE
evals/
reports/build-report.json
reports/provenance-report.json
reports/quality-gate-report.json
reports/human-lock-report.json
reports/eval-report.json
signature.json
```

Optional judgment entries include `KDNA_Scenarios.json`, `KDNA_Cases.json`,
`KDNA_Reasoning.json`, and `KDNA_Evolution.json`.

App-specific optional entries include `KDNA_Runtime_Report.json` (Studio/registry
runtime report) and any additional evaluation artifacts placed under `evals/` or
`reports/` that conforming runtimes may ignore.

## Export Gates

Studio Export MUST check:

1. Studio project state is valid.
2. Judgment-class cards are Human Locked.
3. Risk classification is present.
4. Schema validation passes.
5. Cross-file references resolve.
6. IDs are unique.
7. Languages and localized overlays are consistent.
8. `version` and `judgment_version` are present.
9. `mimetype` is exact.
10. `content_digest` is computed from canonical content.
11. Signature requirements are satisfied for trusted publication.
12. Encrypted entries follow RFC-0008 when `access` is `licensed`.

## Quality Evidence Binding

| Badge | Studio build evidence |
| --- | --- |
| `untested` | Schema pass, build report, provenance report. |
| `tested` | Human Lock report plus eval report with manual verification. |
| `validated` | Automated scoring report, raw outputs or authorized review evidence. |
| `expert_reviewed` | Validated evidence plus reviewer signature or review report. |
| `production_ready` | Expert review plus deployment evidence and regression report. |

Registry promotion MUST NOT rely on `quality_badge` alone. It must be backed by
the report set emitted by Studio Export or an equivalent Studio-compatible CI
pipeline.
