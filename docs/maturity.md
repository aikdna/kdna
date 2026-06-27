# KDNA Maturity Disclosure

> **Current status: Beta** — last updated 2026-06-27.
> The README top-line maturity badge links here. Update both together.

## What "Beta" means for KDNA

KDNA is an open file format for packaging scoped judgment. The project has reached a point where the **core format and runtime contract are stable** and the **official toolchain is published to npm and tested end-to-end**, but v1.x features are still landing. Specifically:

### Stable today (you can rely on these)

- **`.kdna` v1 file format** — container layout, mimetype, required entries,
  payload profile schema. Backed by `schema/manifest.schema.json` and
  `schema/payload-profile-v1.schema.json` in this repo.
- **Runtime loading contract** — `kdna plan-load` + `kdna load`, with
  `index` / `compact` / `scenario` / `full` profiles. Apps MUST NOT infer
  load permission from raw manifest fields.
- **Encryption envelope** — `kdna-password-protected-v1-scrypt` (B2 scrypt)
  is the canonical password-protected envelope as of `kdna-core@0.15.0`
  (2026-06-27). The legacy Argon2id profile (`kdna-password-protected-v1`)
  is deprecated but still loadable.
- **Official toolchain on npm** — `@aikdna/kdna-cli`, `@aikdna/kdna-core`,
  `@aikdna/kdna-studio-cli`, `@aikdna/kdna-studio-core`. Each is published
  with CHANGELOG entry, npm provenance, and CI gate.
- **Conformance suite** — `conformance/canonical-conformance.mjs` is the
  authoritative test for the v1 format and contract.

### Pre-1.0 features (expect breaking changes before v1.0 GA)

- **Signature envelope** — `signature.kdsig` is **OPTIONAL until 2027-Q1**
  (SPEC §3.2). The hard cutover for REQUIRED is end of March 2027. Until
  then, assets distributed without `signature.kdsig` remain conformant.
- **Registry / signed publication** — the canonical registry schema is v2.0
  but a hosted registry is not part of the public baseline yet. The
  KDNA Studio `publish --check` quality gate exists; a hosted registry
  is post-v1.0.
- **Remote runtime** — there is no hosted load endpoint in v1.0. All
  loading is local (`kdna load <file.kdna>`).
- **Paid authorization** — `kdna-licensed-entry-v1` KDF profile is
  defined and tested, but the commercial license-generation / delivery
  flow is not part of the public baseline.
- **Card v2 / Product Runtime / Cluster / WorkPack** — these are RFCs
  accepted in 2026-Q2; runtime support is landing but the
  interop surface is not yet "one year of no breaking changes".
- **Cross-language parity** — `@aikdna/kdna-core` (JS) is the public
  first-run path. `kdna-core-swift` and `kdna-studio-swift` are
  beta until parity is proven against fixed Core v1 conformance
  fixtures (see `PRIVATE/STATUS/open/kdna-core-swift.md`).

### Not part of the public baseline

- Internal test infrastructure (`aikdna/kdna-lab`) is referenced by
  some RFCs as audit anchors but is a private repo.
- Any path under `PRIVATE/` is internal-only. Do not publish to GitHub.

## Release cadence

- `kdna-core` follows a **feature-versioned** 1.x line (Card v2, Product
  Runtime, B2 scrypt) within the same major. Confirm with maintainers
  before publishing breaking changes within 1.x.
- `kdna-cli` follows a **0.x daily-release** line. 0.28.8 was the first
  release in 2026-Q2; expect 0.29.x, 0.30.x, ... until CLI surface
  stabilizes.
- `kdna-studio-cli` and `kdna-studio-core` are 0.x and 1.x respectively
  for the same reason.
- Each release is gated by CHANGELOG entry, npm provenance, and
  CI pass. Past that gate, anything that touches the runtime contract
  is a v1.0 candidate.

## How to use this disclosure

If you are integrating KDNA into a production agent system:

- **Public assets from `aikdna/kdna-assets`** — safe today.
- **Custom assets authored by your team** — safe today, but pin the
  toolchain version (`@aikdna/kdna-cli@<pinned>`,
  `@aikdna/kdna-studio-cli@<pinned>`) and read the CHANGELOG before
  bumping.
- **Self-published assets to others** — wait for v1.0 GA. The signature
  envelope is OPTIONAL today; if you want attestable provenance now,
  layer it on top of KDNA's existing encryption envelope (see RFC-0009).

## How to report issues

- **Format, schema, or contract ambiguity** — open an issue on
  [aikdna/kdna](https://github.com/aikdna/kdna/issues).
- **CLI / Studio / Core bugs** — open on the corresponding repo.
- **Security** — see `SECURITY.md` for the private disclosure channel.

## Update policy

This document is updated whenever the maturity badge in the README
changes. If you see a discrepancy between the two, the badge is
authoritative and this file is out of date — open an issue.
