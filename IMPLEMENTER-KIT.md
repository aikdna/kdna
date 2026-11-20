# KDNA Implementer Kit

A one-page starting point for implementing or integrating a KDNA Container `0.6.0`
verifier, reader, or consumer. Everything here is reachable in one hop from this file.

## 1. Read the contract

- [SPEC.md](./SPEC.md) — overview of Container `0.6.0`, Canonical IR, integrity digests (`A`, `C`, `E`, `ir_digest`), selective `exact_selection` closure, and local AEAD protection (`RFC-0018`).
- [SPEC-INDEX.md](./SPEC-INDEX.md) — every normative specification and JSON Schema.
- [RFC index](./rfcs/README.md) — accepted and proposed protocol changes, feature lifecycle, and deprecation policy.

## 2. Reference SDKs, CLI & Conformance Verification

- **Reference SDKs (Container `0.6.0`):** Install `@aikdna/kdna-core@0.37.11` (container admission, canonical IR, integrity digests, packing, and offline AEAD protection) and `@aikdna/kdna-read@0.13.5` (selective `catalog` and `exact_selection` reading with mandatory context closure).
- **Official CLI (`>=22` Node.js):** Use `npx -y @aikdna/kdna-cli@0.45.2 validate <asset.kdna> --system` and `npx -y @aikdna/kdna-cli@0.45.2 inspect <asset.kdna>` to cross-verify your container outputs offline.
- **Container `0.6.0` conformance suites:** Run `npm run conformance:public-obligations` (`scripts/public-contract/run-obligations.mjs`, verifying 46 runtime obligations and 4 package-surface checks across from-zero `0.6.0` containers, typed asset-declaration retention, static `exact_selection` closure, Host/budget bounds, and fail-closed error paths) and `node scripts/public-contract/run-vectors.mjs "$(pwd)" /tmp/kdna-public-contract-report.json` (running the 94 positive and fail-closed negative `0.6.0` decision vectors in `conformance/public-contract/vectors.generated.json`). *(Note: both `@aikdna/kdna-conformance@0.2.0` and `conformance/canonical-conformance.mjs` target the frozen historical `0.1.0`/`0.36.1` `planLoad` container line and are not used for Container `0.6.0`.)*

## 3. Reference fixtures

- `conformance/public-contract/` — Container `0.6.0` (`kdna.core/0.8.2` · `kdna.read/0.7.0-candidate`) positive and fail-closed negative conformance suite (`vectors.generated.json`, `protection-definition-cases.json`, `protection-runtime-cases.json`, `ir-retention-vectors.generated.json`, and `test/runtime-obligations.cjs`).
- `examples/native-team-update/` — minimal synthetic `0.6.0` `1.0.0` / `1.1.0` `.kdna` fixture pair for testing selective read (`catalog`, `exact_selection`) and `kdna diff`.
- `conformance/canonical-conformance.mjs` & `fixtures/` — frozen historical `0.1.0`/`0.36.1` container vectors retained only for legacy regression checks.

## 4. Environment & Fail-Closed Rules

- A `0.6.0` `.kdna` asset is a Stored ZIP container carrying `mimetype`, `kdna.json` manifest, `sections/*` strict CBOR frames (or an offline AEAD-encrypted `payload.kdnab` envelope), and an optional `checksums.json` entry manifest.
- Container verification proves structural validity and digest integrity, not the real-world truth of a judgment. Verifiers must fail closed on any structural, digest, or schema deviation.
- Protocol changes require an RFC and follow the compatibility rules in [COMPATIBILITY.md](./COMPATIBILITY.md).
