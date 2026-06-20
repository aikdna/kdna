# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in KDNA tooling (`kdna-cli`,
`kdna-core`, `kdna-studio-cli`, `kdna-studio-core`, `kdna-website`,
`kdna-skills`, MCP integrations, or related developer tools), please report it
privately.

**Do not open a public issue.**

Email: security@aikdna.com

Response time: within 72 hours.

## Scope

This policy covers the KDNA tooling and infrastructure. Domain judgment content
inside `.kdna` files is a content and deployment responsibility; structural
validity does not imply content fitness for every use.

## Supported Versions

| Tool | Version | Support |
|------|---------|:-------:|
| @aikdna/kdna-cli | >=0.26.8 | Active |
| @aikdna/kdna-core | >=0.11.1 | Active |
| @aikdna/kdna-studio-cli | >=0.5.7 | Active |
| @aikdna/kdna-studio-core | >=1.5.6 | Active |

## Responsible Disclosure

1. Report the vulnerability privately
2. Allow 90 days for a fix before public disclosure
3. We will acknowledge receipt within 72 hours
4. We will provide a timeline for the fix
5. Credit will be given in the release notes (unless you prefer anonymity)

## Out of Scope

- Domain content quality, professional endorsement, or fitness for a specific
  use case
- Third-party `.kdna` files or source projects not maintained by the KDNA
  project
- Social engineering attacks
- Physical security issues

## Supply Chain: cbor-extract Prebuilt Binaries

Some legacy KDNA packages depended on `cbor-x`, which optionally uses
`cbor-extract` — a Node.js native addon with prebuilt binaries for darwin-arm64,
darwin-x64, linux-arm, linux-arm64, linux-x64, and win32-x64. These binaries
may be fetched at install time from npm when legacy paths are used.

**Mitigations:**
- `cbor-x` falls back to pure JavaScript decode when `cbor-extract` is unavailable
- CI verifies both paths (with and without native addon)
- Package lockfile pins exact versions with integrity hashes
- Future: evaluate pure-JS CBOR implementation to eliminate native binary dependency entirely

**Monitoring:** Check `npm audit` output for cbor-extract advisories on each release.
