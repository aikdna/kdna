# KDNA Conformance — Quick Reference

Conformance claims are bounded by the executable profile and evidence named in
the report. Passing one profile does not create a global quality or trust
level.

## What Conformance Means

KDNA conformance proves your loader, validator, adapter, or registry implements the asset-first KDNA contract: `.kdna` is the canonical asset, validation is reproducible, and runtime loading doesn't require users to unpack or edit internal entries.

## Quick Run

```bash
npm run conformance
# or
node conformance/run.mjs --profile loader
```

## Profiles

| Command | Claim |
|---------|-------|
| `--profile asset` | Can open and inspect `.kdna` files |
| `--profile loader` | Can validate, load, render, and digest-check |
| `--profile runtime` | Follows asset-first loading behavior |
| `--profile registry` | Preserves declared metadata and digest evidence without adding endorsement |
| `--profile asset-loader` | Combined asset + loader compatibility |

## Public Claim Format

> This implementation has passed KDNA Loader compatibility tests.

With this you must publish:

1. The conformance command used
2. Implementation version
3. KDNA spec version
4. `kdna-conformance-last-run.json` summary
5. Known deviations (if any)

See [conformance-report-example.md](./docs/conformance-report-example.md) for a full template.

## What Fails Conformance

An implementation is NOT KDNA-compatible if it:

- Requires users to unpack `.kdna` as the normal path
- Treats dev source directories as canonical portable assets
- Ignores required digest evidence, or misreports a performed signature check
- Writes decrypted licensed entries to persistent disk
- Silently blends multiple domains without attribution
- Emits asset-level quality, risk, trust, recommendation, certification, or
  production-readiness fields as Core conformance facts

## Fixtures Tested

| Category | Count | Examples |
|----------|-------|----------|
| Valid (minimal + full) | 2 | Correct structure, optional entries |
| Structure errors | 3 | Missing core, missing patterns, missing mimetype |
| Lint errors | 1 | Duplicate axiom IDs |
| Cross-file errors | 1 | Domain name mismatch |
| Manifest errors | 2 | `kdna_spec`, singular `language` |
| Authoring lint warnings | 1 | Non-yes/no self-check |

## After Passing

1. Save `kdna-conformance-last-run.json`
2. Publish your conformance report (see template)
3. If another catalog or product consumes the report, keep that caller's
   adoption policy and any external evaluation separate from Core conformance
