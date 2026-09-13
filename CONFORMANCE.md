# KDNA Conformance — Quick Reference

Conformance claims are bounded by the executable profile and evidence named in
the report. Passing one profile does not create a global quality or trust
level.

## What Conformance Means

KDNA conformance proves one narrow thing: the executable profile named in the
report completed its assertions against the reference Core in this repository.
It proves that `.kdna` is treated as the canonical asset, that validation and
admission are reproducible, and that loading does not require users to unpack
or edit internal entries.

It does **not** certify your loader, adapter, registry or agent. The runner is
`conformance/run.mjs`; it imports `../packages/kdna-core/src` directly and
accepts no flag that substitutes a third-party implementation. Running it
inside a reference checkout therefore proves the reference implementation's
behavior, not an external one. A third-party implementation is proved by its
own executable evidence, published with the command, version and limits that
report names.

## Quick Run

```bash
npm run conformance
# or
node conformance/run.mjs --profile loader
```

## Profiles

The default profile is `asset-loader`. Any other value is rejected with exit
code 2.

| Command | Accepted input | Claim |
|---------|----------------|-------|
| `--profile asset` | `.kdna` container | Can open and inspect a packaged asset |
| `--profile loader` | `.kdna` container | Admission, validation and LoadPlan hold |
| `--profile runtime` | `.kdna` container | Asset-first loading behavior holds |
| `--profile asset-loader` | `.kdna` container | Combined asset + loader assertions |
| `--profile phase2-protocol` | protocol fixtures | Phase-2 protocol checks |

There is no `registry` profile.

## What The Runner Actually Asserts

`conformance/run.mjs` builds one valid source from scratch in a temporary
directory, packs it, and then asserts:

1. `inspect` reports the expected `asset_id` and `format_version`;
2. `validate` reports `overall_valid: true` with no problems;
3. `planLoad` reports `access: public`, `state: ready`, `can_load_now: true`;
4. `loadAuthorized` returns a `kdna.runtime-capsule` with contract `0.1.0`;
5. a JSON payload is rejected, an unknown `format_version` fails schema
   validation, and packing a source with a forbidden top-level entry throws.

Every asset is generated in that temporary directory and removed on exit. No
checked-in fixture file is read, so the historical fixture tables that earlier
versions of this page carried are not the runner's input and are not reproduced
here.

On success the runner prints `KDNA conformance suite passed (<profile>)` and
writes `kdna-conformance-last-run.json` into the operating system's default
temporary directory (`os.tmpdir()`), not into the repository:

```json
{
  "ok": true,
  "profile": "asset-loader",
  "certification_level": "KDNA Asset + Loader Compatible",
  "contract": "single-format-cbor-loadplan-capsule"
}
```

`certification_level` is a fixed string emitted by the runner for the chosen
profile. It is part of the current output contract; changing or removing it
requires changing the runner, not only this page.

## Public Claim Format

> This implementation passed the KDNA `<profile>` conformance profile on `<date>`.

With this you must publish:

1. The conformance command used
2. Your implementation and version
3. The Core and Read coordinates your implementation actually binds
4. The exact `kdna-conformance-last-run.json` this run produced
5. Known deviations, and which parts you did not exercise

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

This page previously listed ten named fixtures. The current runner does not
read them. The cases it exercises are the five groups listed under
[What The Runner Actually Asserts](#what-the-runner-actually-asserts) above,
all built from the payload shape in `conformance/run.mjs`.

## After Passing

1. Save `kdna-conformance-last-run.json`
2. Publish your conformance report (see template)
3. If another catalog or product consumes the report, keep that caller's
   adoption policy and any external evaluation separate from Core conformance
