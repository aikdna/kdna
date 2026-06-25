# KDNA v1.0-rc Standard Kit

> Historical release-candidate kit. Current Core v1 public beta guidance lives
> in `README.md`, `SPEC.md`, `docs/status.md`, and `docs/try-kdna.md`.

KDNA v1.0-rc is the asset-first release candidate for the open judgment asset
layer. The goal of this kit is to give implementers one canonical entry point
instead of forcing them to infer the standard from scattered repository files.

## Canonical Documents

| Area | Document |
| --- | --- |
| Protocol overview | [`SPEC.md`](../SPEC.md) |
| Asset format | [`rfcs/RFC-0001-kdna-asset-format.md`](../rfcs/RFC-0001-kdna-asset-format.md) |
| Registry trust model | [`rfcs/RFC-0002-registry-trust-model.md`](../rfcs/RFC-0002-registry-trust-model.md) |
| Public registry trust operations | [`kdna-registry/TRUST_MODEL.md`](https://github.com/aikdna/<historical>/blob/main/TRUST_MODEL.md) |
| Quality badges | [`rfcs/RFC-0003-domain-quality-badges.md`](../rfcs/RFC-0003-domain-quality-badges.md), [`docs/domain-quality-baseline.md`](./domain-quality-baseline.md) |
| Runtime loading contract | [`rfcs/RFC-0004-runtime-loading-contract.md`](../rfcs/RFC-0004-runtime-loading-contract.md), [`docs/app-runtime-contract.md`](./app-runtime-contract.md) |
| Composition policy | [`rfcs/RFC-0005-composition-policy.md`](../rfcs/RFC-0005-composition-policy.md) |
| Media type | [`docs/MEDIA_TYPE.md`](./MEDIA_TYPE.md) |
| Canonicalization | [`docs/CANONICALIZATION.md`](./CANONICALIZATION.md) |
| Canonical authoring boundary | [`docs/CANONICAL_AUTHORING_BOUNDARY.md`](./CANONICAL_AUTHORING_BOUNDARY.md) |
| Trust boundary | [`docs/KDNA_TRUST_BOUNDARY.md`](./KDNA_TRUST_BOUNDARY.md) |
| Personal KDNA | [`docs/PERSONAL_KDNA.md`](./PERSONAL_KDNA.md) |
| Provenance roadmap | [`rfcs/RFC-0006-provenance-signing-transparency.md`](../rfcs/RFC-0006-provenance-signing-transparency.md) |
| Canonical asset build pipeline | [`rfcs/RFC-0007-canonical-authoring-build-pipeline.md`](../rfcs/RFC-0007-canonical-authoring-build-pipeline.md), [`docs/STUDIO_EXPORT_CONTRACT.md`](./STUDIO_EXPORT_CONTRACT.md) |
| Licensed encrypted assets | [`rfcs/RFC-0008-encrypted-licensed-kdna-assets.md`](../rfcs/RFC-0008-encrypted-licensed-kdna-assets.md), [`docs/kdna-encryption-authorization.md`](./kdna-encryption-authorization.md) |
| Asset identity | [`docs/ASSET_IDENTITY_MODEL.md`](./ASSET_IDENTITY_MODEL.md) |
| Conformance | [`conformance/README.md`](../conformance/README.md) |
| Compatibility policy | [`COMPATIBILITY.md`](../COMPATIBILITY.md) |
| Trademark and naming | [`TRADEMARK.md`](../TRADEMARK.md) |
| Certification levels | [`docs/kdna-compatible-certification.md`](./kdna-compatible-certification.md) |
| Governance | [`docs/GOVERNANCE.md`](./GOVERNANCE.md) |
| Release gate | [`docs/V1RC_RELEASE_GATE.md`](./V1RC_RELEASE_GATE.md) |

## Normative Implementation Rules

1. `.kdna` is the canonical user-facing cognition asset.
2. Source directories are dev-only authoring workspaces.
3. Trusted `.kdna` assets must be compiled by a Studio-compatible authoring
   pipeline with Human Lock evidence, validation, canonicalization, identity
   generation, digest computation, signing, optional encryption, provenance, and
   asset digest.
4. `manual-dev-source` assets may be schema-valid but cannot receive trusted
   registry quality badges.
5. Installed assets are stored as immutable packages, not persistent unpacked
   domain directories.
6. Loaders must read `.kdna` directly or use hidden, rebuildable caches.
7. Installers must enforce `asset_digest`, yanked state, and revocation state.
8. Trust-aware runtimes must verify signatures against registry scope keys.
9. Licensed encrypted entries must be decrypted in memory.
10. Composition must preserve attribution and surface conflicts.
11. Quality badges must follow the official badge names, evidence thresholds,
    and authoring provenance gates.
12. KDNA-compatible claims must pass the relevant conformance profile.
13. v1.0 assets must include root `mimetype` with
    `application/vnd.aikdna.kdna+zip`.
14. v1.0 manifests use `spec_version`; `kdna_spec` is not part of the protocol.

## Implementer Path

1. Build an asset reader that opens `.kdna` without persistent extraction.
2. Implement inspect, validate, load, render, digest verification, and optional
   signature verification.
3. Run `npm run certify:asset-loader` or the matching profile command.
4. Publish a compatibility report and known deviations.
5. Request certification through the governance process if official marks are
   needed.

## Current Release-Candidate Boundary

This kit defines the open protocol and compatibility surface. It does not claim
that every public example `.kdna` file is validated or production-ready. Content quality is
governed separately by the registry badge evidence gates.
