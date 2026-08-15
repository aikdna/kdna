# Security Policy

## Reporting a Vulnerability

Please **do not** report security vulnerabilities through public GitHub issues.

Instead, use one of these private channels:

- **GitHub Private Vulnerability Reporting**: Go to the [Security Advisories](https://github.com/aikdna/kdna/security/advisories/new) page
- **Email**: security@aikdna.com

We aim to respond within 72 hours and provide a timeline for resolution within 1 week.
Please do not disclose the vulnerability publicly until we have had a chance to address it.

## Supported Versions

We actively support the latest release for security updates.

| Component | Supported Versions |
|-----------|-------------------|
| KDNA Protocol | Latest tagged release |
| kdna-cli | Latest minor release |
| kdna-studio-cli | Latest minor release |
| Public examples | Packaged `.kdna` release cards when published |

Older versions may receive critical security patches on a case-by-case basis.

## Official Packages

Install official KDNA software only from these coordinates:

- **npm** — everything official is published under the **`@aikdna`** scope
  (for example `@aikdna/kdna-cli`, `@aikdna/kdna-core`). The bare `kdna`
  package name on npm is an unrelated third-party placeholder; do not install
  it.
- **PyPI** — the official Python distribution is **`aikdna`** (import name
  `kdna`). The `kdna` project name on PyPI is an unrelated third-party
  placeholder; never `pip install kdna`.

If you find a package that impersonates these names or coordinates, please
report it through the private channels above.

## Asset Signatures

`.kdna` assets support the optional `signature.kdsig` bundle
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
