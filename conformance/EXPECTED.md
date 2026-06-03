# Conformance Expected Behavior

Status: v1.0-rc fixture contract

The conformance runner generates `.kdna` assets under `conformance/fixtures/generated/` and validates their behavior through `@aikdna/kdna-core`. Generated files are not the source of truth. This document and `conformance/run.mjs` are the fixture contract.

Run:

```bash
npm run conformance
node conformance/run.mjs --profile asset
node conformance/run.mjs --profile loader
node conformance/run.mjs --profile runtime
node conformance/run.mjs --profile registry
```

The last successful run writes:

```text
$TMPDIR/kdna-conformance-last-run.json
```

## Current Golden Corpus

| Fixture key | Generated file | Expected behavior | v1.0-rc rule |
| --- | --- | --- | --- |
| `minimal` | `valid-minimal-domain.kdna` | Inspect, validate, load, render, and digest-check pass. | Minimal asset has `kdna.json`, `KDNA_Core.json`, `KDNA_Patterns.json`, and root mimetype. |
| `full` | `valid-full-domain.kdna` | Optional entries load under full profile. | Optional files may be present without changing required-file rules. |
| `licensedValid` | `valid-licensed-domain.kdna` | Passes with correct licensed decrypt hook. | Licensed entries decrypt in memory only. |
| `protectedValid` | `valid-protected-domain.kdna` | Passes with correct password decrypt hook. | Protected entries decrypt in memory only. |
| `missingCore` | `invalid-missing-core.kdna` | Validation fails. | `KDNA_Core.json` is required. |
| `missingPatterns` | `invalid-missing-patterns.kdna` | Validation fails. | `KDNA_Patterns.json` is required. |
| `duplicateId` | `invalid-duplicate-id.kdna` | Validation fails. | IDs must be unique within the loaded asset. |
| `badMeta` | `invalid-bad-meta.kdna` | Validation fails. | Cross-file `meta.domain` must be consistent. |
| `missingMimetype` | `invalid-missing-mimetype.kdna` | Validation fails. | Root `mimetype` is required. |
| `disallowedKdnaSpec` | `invalid-disallowed-kdna-spec.kdna` | Validation fails. | `kdna_spec` is outside v1.0-rc and must be rejected. |
| `disallowedLanguage` | `invalid-disallowed-language.kdna` | Validation fails. | Singular `language` is rejected; use `languages` and `default_language`. |
| `badSelfCheck` | `invalid-non-yes-no-self-check.kdna` | Validation passes with warning. | Weak self-checks are quality warnings, not structure failures. |
| `licensedValid` without hook | `valid-licensed-domain.kdna` | Validation fails when decryption is required. | Encrypted entries require an explicit decrypt hook. |
| `licensedValid` wrong key | `valid-licensed-domain.kdna` | Validation fails. | Wrong license keys fail closed. |
| `licensedTampered` | `invalid-licensed-tampered-ciphertext.kdna` | Validation fails. | Tampered ciphertext fails integrity check. |
| `protectedValid` without hook | `valid-protected-domain.kdna` | Validation fails when decryption is required. | Protected entries require an explicit decrypt hook. |
| `protectedValid` wrong password | `valid-protected-domain.kdna` | Validation fails. | Wrong passwords fail closed. |
| `protectedTampered` | `invalid-protected-tampered-ciphertext.kdna` | Validation fails. | Tampered protected ciphertext fails integrity check. |
| `appPrivateEnvelope` | `invalid-app-private-envelope.kdnasealed` | Inspection rejects the file. | App-private envelopes are not canonical `.kdna` assets. |

## Public Claim Format

Third-party implementations may claim compatibility only with the profile they ran:

```json
{
  "implementation": "example-runtime",
  "implementation_version": "0.1.0",
  "kdna_spec": "1.0-rc",
  "profile": "asset-loader",
  "conformance_run": "2026-06-03T00:00:00Z",
  "result": "pass",
  "fixtures": ["minimal", "full", "missingCore"]
}
```

## Expansion Backlog

These fixtures are required before the final v1.0 public confidence release:

- Signed valid `.kdna`.
- Unsigned local untrusted `.kdna`.
- Registry digest mismatch.
- Invalid registry media type.
- Extra KDNA file beyond the canonical six content files.
- Missing required manifest fields.
- Broken cross-file reference.
- Unknown manifest field rejection where schema disallows it.
- Invalid signature.
- Revoked key.
- Expired registry timestamp.
- Yanked asset.
- Licensed asset without license.
- Cluster conflict attribution.
- I18N overlay semantic drift.

