# KDNA Implementer Kit

A one-page starting point for implementing or integrating a KDNA Container `0.6.0`
verifier, reader, or consumer. Everything here is reachable in one hop from this file.

## 1. Read the contract

- [SPEC.md](./SPEC.md) & [specs/README.md](./specs/README.md) — active Container `0.6.0` contract overview and index (`sections`, `retained`, `creation06`, `migration06`, Canonical IR, integrity digests `A`/`C`/`E`/`ir_digest`, selective `exact_selection` closure, and local AEAD protection `RFC-0018`).
- [SPEC-INDEX.md](./SPEC-INDEX.md) — byte-pinned R2 base (`0.5.0` / `kdna.read/0.6.4`) normative schema index bound to `specs/public-semantic-source.json`.
- [RFC index](./rfcs/README.md) — accepted and proposed protocol changes, feature lifecycle, and deprecation policy.

## 2. Reference SDKs, CLI & Conformance Verification

- **Reference SDKs (Container `0.6.0`):** Install `@aikdna/kdna-core@0.37.11` (container admission, canonical IR, integrity digests, packing, and offline AEAD protection) and `@aikdna/kdna-read@0.13.5` (selective `catalog` and `exact_selection` reading with mandatory context closure).
- **Official CLI (`>=22` Node.js):** Use `npx -y @aikdna/kdna-cli@0.46.0 validate <asset.kdna> --system` and `npx -y @aikdna/kdna-cli@0.46.0 inspect <asset.kdna>` to cross-verify your container outputs offline.
- **Layered Conformance Suites (keep the three layers distinct):**
  1. **Container `0.6.0` suite (current distribution container):** Run `npm run conformance:container-0.6` (executes the Container `0.6.0` native-sections, `ProtectedManifest06Candidate` browser/Node parity, `0.5.0` → `0.6.0` source migration, native binding, and retained-section model-view test suites across `@aikdna/kdna-core` and `@aikdna/kdna-read`), plus `npm run conformance:envelope-aead` for RFC-0018 local AEAD protection.
  2. **Public semantic contract suite (`kdna.core/0.8.2` · `kdna.payload.judgment/0.5.1` · base Container `0.5.0` / `kdna.read/0.6.4`):** Run `npm run conformance:public-obligations` (`scripts/public-contract/run-obligations.mjs`, verifying 46 runtime obligations and 4 package-surface checks across from-zero containers, typed asset-declaration retention, static `exact_selection` closure, Host/budget bounds, and fail-closed error paths) and `node scripts/public-contract/run-vectors.mjs "$(pwd)" /tmp/kdna-public-contract-report.json` (running the 94 positive and fail-closed negative decision vectors in `conformance/public-contract/vectors.generated.json`).
  3. **Frozen historical `0.1.0` (`planLoad` / Runtime Capsule / CLI `0.36.1`) suites:** `npm run conformance`, `npm run conformance:canonical`, `npm run conformance:runtime-contract`, and `@aikdna/kdna-conformance@0.2.0` target the retired `0.1.0` `planLoad` container line and are **not** used for Container `0.6.0` (see [`CONFORMANCE.md`](./CONFORMANCE.md)).

## 3. Reference fixtures

- `packages/kdna-core/test/` & `packages/kdna-read/test/` (via `npm run conformance:container-0.6`) — Container `0.6.0` native-sections, `ProtectedManifest06Candidate`, and `0.5.0` → `0.6.0` source migration tests.
- `conformance/public-contract/` — Public semantic contract (`kdna.core/0.8.2` · `kdna.payload.judgment/0.5.1` · base Container `0.5.0` / `kdna.read/0.6.4`) positive and fail-closed negative conformance suite (`vectors.generated.json`, `protection-definition-cases.json`, `protection-runtime-cases.json`, `ir-retention-vectors.generated.json`, and `test/runtime-obligations.cjs`).
- `examples/native-team-update/` — minimal synthetic `0.6.0` `1.0.0` / `1.1.0` `.kdna` fixture pair for testing selective read (`catalog`, `exact_selection`) and `kdna diff`.
- `conformance/run.mjs`, `conformance/canonical-conformance.mjs`, & `fixtures/` — frozen historical `0.1.0`/`0.36.1` `planLoad` container vectors retained only for legacy regression checks.

## 4. Environment & Fail-Closed Rules

- A `0.6.0` `.kdna` asset is a Stored ZIP container carrying `mimetype`, `kdna.json` manifest, `sections/*` strict CBOR frames (or an offline AEAD-encrypted `payload.kdnab` envelope), and an optional `checksums.json` entry manifest.
- Container verification proves structural validity and digest integrity, not the real-world truth of a judgment. Verifiers must fail closed on any structural, digest, or schema deviation.
- Protocol changes require an RFC and follow the compatibility rules in [COMPATIBILITY.md](./COMPATIBILITY.md).
