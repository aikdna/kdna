# Historical Registry Publishing Example

> **Status: Historical.** This document preserves the superseded registry-PR
> workflow. Registry distribution and install-time registry trust are not KDNA
> Core surfaces. Current assets are distributed as `.kdna` files and validated
> with the current Core and conformance commands.

## 1. Export A Trusted Asset

Use a Studio-compatible compiler. The output must be a `.kdna` asset, not only a dev source directory.

```bash
kdna-studio export ./my-domain --out dist/my-domain-0.1.0.kdna --sign
```

Required export evidence:

- `dist/my-domain-0.1.0.kdna`
- asset digest, usually `sha256:<hex>`
- author public key
- signature
- Human Lock receipt for judgment-class fields
- provenance/build receipt

## 2. Verify Locally

```bash
kdna verify dist/my-domain-0.1.0.kdna --json
node conformance/run.mjs --profile asset
```

The asset must pass structure checks. A public example release also needs a
release card with SHA256, usage commands, before/after evidence, boundaries,
known limitations, and provenance metadata.

## 3. Prepare Release Card

Prepare public release metadata for the packaged `.kdna` file:

```json
{
  "name": "@example/my_domain",
  "version": "0.1.0",
  "status": "experimental",
  "description": "Scoped judgment for a specific domain.",
  "media_type": "application/vnd.kdna.asset",
  "asset_url": "https://github.com/example/kdna-my-domain/releases/download/0.1.0/my-domain-0.1.0.kdna",
  "asset_digest": "sha256:...",
  "signature": "ed25519:...",
  "quality_badge": "untested",
  "risk_level": "R0",
  "review_status": "community",
  "languages": ["en"],
  "default_language": "en"
}
```

Do not publish registry entries that point to raw dev directories.

## 4. Run Trust Gates

```bash
npm run conformance
npm test
```

An external registry implementation owns its own end-to-end tests and should
fail closed for:

- digest mismatch
- yanked asset
- revoked signature/key
- expired snapshot
- missing trust anchor for a scoped registry
- invalid media type

## 5. Open PR

This section applies only to an independently operated registry. It is not a
KDNA Core release step.

Include:

- The registry entry.
- Release asset URL.
- Digest and signature evidence.
- Quality evidence for the claimed `quality_badge`.
- Known limitations.
- Result of local verification commands.

For `quality_badge: "validated"`, include at least 30 eval cases, automated scoring, raw outputs, rubric, benchmark report, and limitations.
