# KDNA Conformance Report Example

Below is an example of what a third-party implementation's conformance report should contain when claiming KDNA compatibility.

This is a template — replace the values with your implementation's actual results.

---

# KDNA Conformance Report

**Implementation:** my-kdna-loader  
**Version:** 0.3.1  
**KDNA Spec Version:** 1.0-rc  
**Date:** 2026-06-01  
**Profile:** loader

## Summary

```
KDNA conformance suite passed (loader)
Certification Level: KDNA Loader Compatible
```

## Environment

| Item | Value |
|------|-------|
| Runtime | Node.js 22.3.0 |
| OS | macOS 15 |
| Architecture | arm64 |
| kdna-core dependency | @aikdna/kdna-core@0.7.2 |

## Fixture Results

| Fixture | Expected | Actual | Status |
|---------|----------|--------|--------|
| `valid-minimal-domain.kdna` | loads, validates, renders | loads, validates, renders | PASS |
| `valid-full-domain.kdna` | loads optional entries | loads KDNA_Scenarios.json | PASS |
| `invalid-missing-core.kdna` | fails validation | 2 errors: KDNA_Core.json missing | PASS |
| `invalid-missing-patterns.kdna` | fails validation | 3 errors: KDNA_Patterns.json missing | PASS |
| `invalid-duplicate-id.kdna` | fails lint | 1 error: duplicate axiom ID | PASS |
| `invalid-bad-meta.kdna` | fails cross-file | 1 error: domain mismatch | PASS |
| `invalid-missing-mimetype.kdna` | fails media check | 1 error: root mimetype missing | PASS |
| `invalid-disallowed-kdna-spec.kdna` | fails manifest | 1 error: kdna_spec is invalid | PASS |
| `invalid-disallowed-language.kdna` | fails manifest | 1 error: singular language invalid | PASS |
| `invalid-non-yes-no-self-check.kdna` | warns | 1 warning: self-check should be yes/no | PASS |

**Result: 10/10 passed, 0 failures.**

## Render Verification

The `renderForAgent` output for the minimal fixture was compared against the expected prompt output in `conformance/fixtures/expected/minimal-prompt-output.txt`. All expected lines are present in the rendered output.

## Known Deviations

| Category | Description | Impact |
|----------|-------------|--------|
| Signature verification | Ed25519 signature parsing relies on an external library; we do not reimplement the algorithm in pure logic. | Low — verified against test vectors. |
| Composition conflict detection | Multi-domain composition is implemented but has not been tested with more than 3 domains simultaneously. | Medium — on our roadmap for 0.4. |

## Conformance Output

Generated at `$TMPDIR/kdna-conformance-last-run.json`:

```json
{
  "ok": true,
  "profile": "loader",
  "certification_level": "KDNA Loader Compatible",
  "generated": "/path/to/conformance/fixtures/generated",
  "fixtures": [
    "minimal",
    "full",
    "missingCore",
    "missingPatterns",
    "duplicateId",
    "badMeta",
    "missingMimetype",
    "disallowedKdnaSpec",
    "disallowedLanguage",
    "badSelfCheck"
  ]
}
```

## Self-Certification Statement

> This implementation has passed KDNA Loader compatibility tests.
> No official certification has been granted.
> This report is a bounded self-attestation for the commands and evidence above.

---

**Signed:** Your Name, Your Organization  
**Contact:** your-email@example.com
