# KDNA-Compatible Certification

HISTORICAL / ARCHIVED DOCUMENT.

This document does not represent the current KDNA Core v1 positioning.
KDNA Core v1 is the official KDNA judgment-asset format and runtime loading
contract. KDNA Core v1 does not define a public registry, marketplace,
recommendation system, content ranking, official quality badge, or
certification program. This file is preserved for traceability of the
pre-v1 approach.


KDNA-compatible means an implementation follows the asset-first KDNA contract:
`.kdna` is the canonical cognition asset, validation is reproducible, and
runtime loading does not require users to unpack or edit internal entries.

This document defines the public compatibility levels. It is a technical
compatibility program, not a trademark license by itself. Use of `Certified
KDNA`, `Official KDNA`, or AIKDNA marks is governed by
[`TRADEMARK.md`](../TRADEMARK.md).

## Levels

| Level | Claim | Required checks |
| --- | --- | --- |
| KDNA Asset Compatible | Can open and inspect canonical `.kdna` files. | `node conformance/run.mjs --profile asset` |
| KDNA Loader Compatible | Can validate, load, render, and digest-check `.kdna` files. | `node conformance/run.mjs --profile loader` |
| KDNA Runtime Compatible | Loads `.kdna` as the trust source and treats caches as rebuildable. | Runtime contract report + conformance |
| KDNA Registry Compatible | Publishes asset-first entries with digest, signature, yank, and revocation metadata. | Registry schema + trust gate |
| Authoring environment Compatible | Produces `.kdna` assets through Human Judgment Lock and quality gates. | Studio contract report |
| KDNA Enterprise Compatible | Adds private registry, entitlement, audit, and revocation controls. | Enterprise review |

## Minimum Public Claim

A third-party project may say:

> This implementation has passed KDNA Asset + Loader compatibility tests.

Only if it publishes:

- the conformance command used,
- the implementation version,
- the KDNA spec version,
- the generated `$TMPDIR/kdna-conformance-last-run.json` summary,
- any known deviations.

## Certification Boundary

Passing conformance means the implementation is technically compatible. It does
not mean the project is official, endorsed, production-ready, or allowed to use
protected certification marks.

Official certification requires:

1. Passing the relevant conformance profile.
2. Publishing a compatibility report.
3. Completing registry governance review.
4. Following the KDNA trademark and naming policy.

## Non-Compatible Claims

Do not claim KDNA compatibility if the implementation:

- requires users to unpack `.kdna` assets as the normal path,
- treats dev source directories as canonical installed assets,
- ignores `asset_digest` or signature metadata when trust is required,
- writes decrypted licensed entries to persistent disk,
- silently blends multiple assets without attribution,
- uses legacy quality badge names such as `basic`, `expert-reviewed`, or
  `production-ready`.
