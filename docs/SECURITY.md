# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in KDNA tooling (kdna-cli, kdna-core, kdna-studio-cli, kdna-studio-core, kdna-registry, kdna-website, or kdna-vscode), please report it privately.

**Do not open a public issue.**

Email: security@aikdna.com

Response time: within 72 hours.

## Scope

This policy covers the KDNA tooling and infrastructure. Domain judgment content (.kdna files) is governed by the [KDNA Safety Framework](./SAFETY.md) and [Risk Policy](./RISK_POLICY.md).

## Supported Versions

| Tool | Version | Support |
|------|---------|:-------:|
| @aikdna/kdna-cli | >=0.16.0 | Active |
| @aikdna/kdna-core | >=0.3.0 | Active |
| @aikdna/kdna-studio-core | >=1.0.0 | Active |

## Responsible Disclosure

1. Report the vulnerability privately
2. Allow 90 days for a fix before public disclosure
3. We will acknowledge receipt within 72 hours
4. We will provide a timeline for the fix
5. Credit will be given in the release notes (unless you prefer anonymity)

## Out of Scope

- Domain content quality (handled by Governance and Quality Gates)
- Third-party domains not distributed through the official registry
- Social engineering attacks
- Physical security issues

## Supply Chain: cbor-extract Prebuilt Binaries

KDNA v2 depends on `cbor-x` which optionally uses `cbor-extract` — a Node.js native addon with prebuilt binaries for darwin-arm64, darwin-x64, linux-arm, linux-arm64, linux-x64, and win32-x64. These binaries are fetched at install time from npm.

**Mitigations:**
- `cbor-x` falls back to pure JavaScript decode when `cbor-extract` is unavailable
- CI verifies both paths (with and without native addon)
- Package lockfile pins exact versions with integrity hashes
- Future: evaluate pure-JS CBOR implementation to eliminate native binary dependency entirely

**Monitoring:** Check `npm audit` output for cbor-extract advisories on each release.
