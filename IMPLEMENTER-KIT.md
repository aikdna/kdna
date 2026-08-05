# KDNA Implementer Kit

A one-page starting point for implementing a KDNA runtime, verifier, or
consumer. Everything here is reachable in one hop from this file.

## 1. Read the contract

- [SPEC-INDEX.md](./SPEC-INDEX.md) — every normative specification (asset
  format, runtime loading contract, envelope profile, authorization, fidelity).
- [RFC index](./rfcs/README.md) — accepted and proposed protocol changes,
  feature lifecycle, and deprecation policy.

## 2. Validate your implementation

- **Conformance runner**: `@aikdna/kdna-conformance` runs a fixed battery
  against any KDNA core implementation via `runConformance({ core })`. It
  checks validate, planLoad, load capsule, and fail-closed behavior on a
  corrupted container. Install with `npm i @aikdna/kdna-conformance`.
- **Interactive inspector**: <https://aikdna.github.io/kdna/inspector/> — drag
  a `.kdna` file to inspect its container, manifest, and load profiles
  entirely in the browser. Nothing is uploaded.

## 3. Reference fixtures

- `fixtures/` — conformance test fixtures used by the toolchain.
- `conformance/canonical-conformance.mjs` — the stable container conformance
  surface (`npm run conformance:canonical`).

## 4. Environment

- A `.kdna` asset is a ZIP container with a stored (uncompressed) `mimetype`,
  `kdna.json` manifest, and `payload.kdnab` (CBOR), plus `checksums.json`.
- Container structure proves integrity, not judgment quality. Verifiers must
  fail closed on any structural or schema deviation.
- Protocol changes require an RFC and a 12-month deprecation window before
  removal (see the RFC index).
