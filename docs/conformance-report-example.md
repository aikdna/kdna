# KDNA Conformance Report Example

Below is an example of what a third-party implementation's conformance report
should contain when claiming KDNA compatibility.

This is a template. Replace every value with your implementation's actual
results, and delete the rows you did not run. Values that were not produced by
your own run are not evidence and must not be filled in.

**Read this first.** The profile runner in the reference repository
(`conformance/run.mjs`) imports that repository's own Core and takes no flag
that substitutes another implementation. Its output describes the reference
implementation. It does not become a certificate for your code by being run in
your checkout. This template is for reporting the evidence your own
implementation produced with its own executable entry point.

---

# KDNA Conformance Report

**Implementation:** my-kdna-loader  
**Version:** 0.3.1  
**Core / Read coordinates:** `@aikdna/kdna-core@<coordinate>` / `@aikdna/kdna-read@<coordinate>`  
**Date:** 2026-06-01  
**Profile:** loader  
**Command:** `node conformance/run.mjs --profile loader`

## Summary

```
KDNA conformance suite passed (loader)
Certification level: KDNA Loader Compatible
```

`certification_level` is the fixed string the reference runner emits for this
profile. Repeating it in a report only claims that this command exited 0 with
this profile; it is not an independent assessment.

## Environment

| Item | Value |
|------|-------|
| Runtime | Node.js 22.3.0 |
| OS | macOS 15 |
| Architecture | arm64 |
| kdna-core dependency | @aikdna/kdna-core@0.7.2 |

## Assertion Results

Report only the assertions your run actually made. The current reference runner
asserts the five groups below, each against an asset it builds in a temporary
directory rather than against a checked-in fixture:

| # | Assertion | Expected | Actual | Status |
|---|-----------|----------|--------|--------|
| 1 | `inspect` identity | `asset_id` and `format_version` match | | |
| 2 | `validate` overall | `overall_valid: true`, no problems | | |
| 3 | `planLoad` readiness | `access: public`, `state: ready`, `can_load_now: true` | | |
| 4 | `loadAuthorized` capsule | `kdna.runtime-capsule`, contract `0.1.0` | | |
| 5 | Negative cases | JSON payload rejected; unknown `format_version` fails schema; forbidden top-level entry throws | | |

**Result: __/__ passed, __ failures.**

If your implementation has its own fixture corpus, list it separately and say
what each case is for. Do not copy this table's expectations onto fixtures that
your run did not read.

## Known Deviations

| Category | Description | Impact |
|----------|-------------|--------|
| Signature verification | Ed25519 signature parsing relies on an external library; we do not reimplement the algorithm in pure logic. | Low — verified against test vectors. |
| Composition conflict detection | Multi-domain composition is implemented but has not been tested with more than 3 domains simultaneously. | Medium — on our roadmap for 0.4. |

## Conformance Output

The reference runner writes this file to the operating system's default
temporary directory (`os.tmpdir()`), not to the repository. Paste the file your
own run produced:

```json
{
  "ok": true,
  "profile": "loader",
  "certification_level": "KDNA Loader Compatible",
  "contract": "single-format-cbor-loadplan-capsule"
}
```

## Self-Certification Statement

> This implementation passed the KDNA `loader` conformance profile on
> `<date>`. No official certification has been granted. This report is a
> bounded self-attestation for the commands and evidence above, and it does not
> cover any capability outside that profile.

---

**Signed:** Your Name, Your Organization  
**Contact:** your-email@example.com
