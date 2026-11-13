# Security Policy

## Reporting a Vulnerability

Please **do not** report security vulnerabilities through public GitHub issues.

Instead, use one of these private channels:

- **GitHub Private Vulnerability Reporting**: Go to the [Security Advisories](https://github.com/aikdna/kdna/security/advisories/new) page
- **Email**: **hi@aikdna.com** or **security@aikdna.com**

We aim to respond within 72 hours and provide a timeline for resolution within 1 week.
Please do not disclose the vulnerability publicly until we have had a chance to address it.

## Supported Versions

We actively support the latest release for security updates.

| Component | Supported Versions |
|-----------|-------------------|
| KDNA Protocol & Core (`@aikdna/kdna-core`, `@aikdna/kdna-read`) | Latest tagged release (`0.37.10` / `0.13.4`, Container `0.6.0` & `0.5.0`) |
| Official CLI (`@aikdna/kdna-cli`) | Latest minor release (`0.43.x`, Container `0.6.0`) |
| Legacy Studio CLI / Core (`@aikdna/kdna-studio-cli`, `@aikdna/kdna-studio-core`) | Latest minor release (`0.14.0` / `4.1.0`, Container `0.5.0` session line) |
| Public reference works (`aikdna/kdna-assets`) | *KDNA Whitepaper* `v1.0.1` (`kdna-whitepaper-1.0.1.{en,zh-CN}.kdna`, Container `0.6.0`) |

Older versions may receive critical security patches on a case-by-case basis.

## Official Packages

Install official KDNA software only from these coordinates:

- **npm** — everything official is published under the **`@aikdna`** scope
  (for example `@aikdna/kdna-cli`, `@aikdna/kdna-core`, `@aikdna/kdna-read`).
  The bare `kdna` package name on npm is an unrelated third-party placeholder;
  do not install it.
- **PyPI (`aikdna` — historical `0.1.0` line only)** — the project owns the
  **`aikdna`** coordinate on PyPI (whereas the bare `kdna` name on PyPI is an
  unrelated third-party placeholder; never `pip install kdna`). **Important
  compatibility warning:** the published PyPI package `aikdna==0.6.0` (and the
  in-repo `python-sdk` `0.8.0rc2` source candidate) targets the **retired
  historical Container `0.1.0` / Runtime Capsule line** (`kdna.json` +
  `payload.cbor` + `checksums.sha256`) and **cannot** create, validate, or
  read current **Container `0.6.0`** `.kdna` works (such as *KDNA Whitepaper*
  `v1.0.1`). For all Container `0.6.0` workflows, use the official Node.js
  packages on npm (`@aikdna/kdna-cli`, `@aikdna/kdna-core`, `@aikdna/kdna-read`).

If you find a package that impersonates these names or coordinates, please
report it through the private channels above.

## Current source security boundary

The current [Core](./packages/kdna-core/README.md) and
[Read](./packages/kdna-read/README.md) packages admit captured bytes into a
private snapshot and disclose content only through public Read with independent
trusted control and Host providers. Technical admission does not authenticate
an author, establish content quality or grant action permission.

- **Local password encryption (`Container 0.6.0`):** Offline password-based
  AEAD protection (`kdna.encryption.password` / `kdna.envelope.aead`,
  PBKDF2-HMAC-SHA256 + AES-256-GCM) is supported in `@aikdna/kdna-cli`
  (`kdna protect` and `kdna read --password-file`), Desktop `KDNA Reader`, and
  the explicit Node protection entrypoints (`@aikdna/kdna-core/protection-node`
  and `@aikdna/kdna-read/protection-node`)—permanently without any online
  account.
- **Default root/browser admission boundary:** The unprivileged root/browser
  exports of `@aikdna/kdna-core` and `@aikdna/kdna-read` do not accept secrets
  or perform implicit I/O; encrypted containers, signatures, and
  checksums-document admission are refused on the default root/browser surface
  unless routed through the explicit `/protection-node` contract with an
  independently trusted provider. Unsupported metadata always fails closed, and
  optional static Runtime Capsule/Plan reference helpers live separately under
  `@aikdna/kdna-core/execution`.

## Published Core 0.22.0 asset signatures

The following properties belong to the published `@aikdna/kdna-core@0.22.0`
implementation and its matching assets. Current Core/Read source does not export
these signing APIs or admit signed containers. Historical conformance vectors
remain evidence for their own pinned line.

In the published Core 0.22.0 line, `.kdna` assets support the optional `signature.kdsig` bundle
(`kdsig.ed25519`, RFC-0021 M1). Security properties:

- Verification is offline and fail-closed: a malformed, unsupported, or
  unverifiable bundle rejects validation, LoadPlan, and loading. It never
  downgrades to "unsigned".
- The bundle carries its own Ed25519 public key. A valid signature proves
  integrity and key-bound provenance only; trusting the key is the
  consumer's pinning decision (`expectedPublicKey`). Identity binding,
  rotation, and revocation are future RFC-0021 milestones.
- A signature never proves expertise, truthfulness, safety, or fitness for
  purpose.
- Signing keys are the signer's responsibility; this project does not define
  key custody or escrow. Conformance vectors under `conformance/signature/`
  use a public seed that must never be reused for real signing.

## Security Model

For the KDNA Protocol security architecture, see [GOVERNANCE.md](./docs/GOVERNANCE.md).
