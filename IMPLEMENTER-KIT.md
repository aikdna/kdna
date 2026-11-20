# KDNA Implementer Kit

A one-page starting point for implementing or integrating a KDNA Container `0.6.0`
verifier, reader, or consumer. Everything here is reachable in one hop from this file.

## 1. Read the contract

- [SPEC.md](./SPEC.md) — overview of Container `0.6.0`, Canonical IR, integrity digests (`A`, `C`, `E`, `ir_digest`), selective `exact_selection` closure, and local AEAD protection (`RFC-0018`).
- [SPEC-INDEX.md](./SPEC-INDEX.md) — every normative specification and JSON Schema.
- [RFC index](./rfcs/README.md) — accepted and proposed protocol changes, feature lifecycle, and deprecation policy.

## 2. Reference SDKs, CLI & Conformance Verification

- **Reference SDKs (Container `0.6.0`):** Install `@aikdna/kdna-core@0.37.11` (container admission, canonical IR, integrity digests, packing, and offline AEAD protection) and `@aikdna/kdna-read@0.13.5` (selective `catalog` and `exact_selection` reading with mandatory context closure).
- **Official CLI (`>=22` Node.js):** Use `npx -y @aikdna/kdna-cli@0.45.1 validate <asset.kdna> --system` and `npx -y @aikdna/kdna-cli@0.45.1 inspect <asset.kdna>` to cross-verify your container outputs offline.
- **Canonical conformance suite:** Run `npm run conformance:canonical` (`conformance/canonical-conformance.mjs`) in this repository against positive and fail-closed negative `0.6.0` container vectors. *(Note: the legacy npm package `@aikdna/kdna-conformance@0.2.0` targets the historical `0.1.0`/`0.36.1` `planLoad` line and is not used for Container `0.6.0`.)*

## 3. Reference fixtures

- `conformance/canonical-conformance.mjs` — the current stable container conformance runner (`npm run conformance:canonical`).
- `fixtures/` — versioned positive and fail-closed negative `.kdna` test vectors.
- `examples/native-team-update/` — minimal synthetic `0.6.0` `1.0.0` / `1.1.0` fixture pair for testing selective read and `kdna diff`.

## 4. Environment & Fail-Closed Rules

- A `0.6.0` `.kdna` asset is a Stored ZIP container carrying `mimetype`, `kdna.json` manifest, `sections/*` strict CBOR frames (or an offline AEAD-encrypted `payload.kdnab` envelope), and an optional `checksums.json` entry manifest.
- Container verification proves structural validity and digest integrity, not the real-world truth of a judgment. Verifiers must fail closed on any structural, digest, or schema deviation.
- Protocol changes require an RFC and follow the compatibility rules in [COMPATIBILITY.md](./COMPATIBILITY.md).
