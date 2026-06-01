# KDNA Conformance — Quick Reference

For detailed certification levels, see [KDNA-Compatible Certification](./kdna-compatible-certification.md).

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
| `--profile registry` | Preserves required metadata and trust checks |
| `--profile asset-loader` | Combined asset + loader compatibility |

## Public Claim Format

> This implementation has passed KDNA Loader compatibility tests.

With this you must publish:

1. The conformance command used
2. Implementation version
3. KDNA spec version
4. `kdna-conformance-last-run.json` summary
5. Known deviations (if any)

See [conformance-report-example.md](./conformance-report-example.md) for a full template.

## What Fails Conformance

An implementation is NOT KDNA-compatible if it:

- Requires users to unpack `.kdna` as the normal path
- Treats dev source directories as canonical installed assets
- Ignores `asset_digest` or signature metadata
- Writes decrypted licensed entries to persistent disk
- Silently blends multiple domains without attribution
- Uses legacy quality badge names (`basic`, `expert-reviewed`, `production-ready`)

## Fixtures Tested

| Category | Count | Examples |
|----------|-------|----------|
| Valid (minimal + full) | 2 | Correct structure, optional entries |
| Structure errors | 3 | Missing core, missing patterns, missing mimetype |
| Lint errors | 1 | Duplicate axiom IDs |
| Cross-file errors | 1 | Domain name mismatch |
| Manifest errors | 2 | `kdna_spec`, singular `language` |
| Quality warnings | 1 | Non-yes/no self-check |

## After Passing

1. Save `kdna-conformance-last-run.json`
2. Publish your conformance report (see template)
3. Register on the [KDNA-compatible implementations list](https://github.com/aikdna/kdna) (optional)
4. For official certification, complete registry governance review
