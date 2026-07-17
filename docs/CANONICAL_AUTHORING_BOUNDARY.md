# Canonical Authoring Boundary

KDNA assets are not ordinary JSON packages.

A `.kdna` asset is a validated container, not an arbitrary JSON dump. The
recommended authoring path uses a KDNA-compatible pipeline that can perform
validation, canonicalization, identity generation, digest computation, optional
Human Lock, optional signing, optional encryption, and provenance recording.

A conforming `.kdna` asset MAY NOT be created by directly packaging arbitrary
source directories and presenting the result as carrying provenance, signature,
external-evaluation, or endorsement claims. A `.kdna` asset is format-valid when
it passes `kdna validate`; optional provenance, identity binding, Human Lock,
signatures, and external evaluations remain separate, issuer-scoped claims.

Dev source directories are non-canonical workspaces for authoring tools, Git
review, diagnostics, and debugging. They MUST NOT be treated as public runtime
assets unless they have been exported to a validated `.kdna` container. They
must also be accompanied by the required evidence for any provenance, identity,
signature, external-evaluation, or endorsement claim being made.

## Ecosystem Roles

Studio creates, reviews, compiles, and exports `.kdna` files.

CLI inspects, validates, plan-loads, packs/unpacks, and loads local `.kdna` files.

Hosted discovery surfaces, if present, are optional distribution surfaces and
not KDNA format-validity or trust authorities.

Agents load and use KDNA.

## Release-Evidence Creation Flow

One path for a `.kdna` asset with release evidence is:

1. Import materials.
2. Extract judgment candidates.
3. Generate judgment cards.
4. Optional human review and confirmation.
5. Optional Human Lock when human confirmation is claimed.
6. Studio-compatible compiler output.
7. `.kdna` asset export with identity, canonicalization, digests, signing,
   optional encryption, and authoring provenance.
8. CLI validation and LoadPlan.
9. Optional signature and optional distribution.
10. Agent loading and post-validation.

AI agents, humans, tools, and hybrid workflows may create KDNA. Human review
must confirm the content only when the asset claims human confirmation or a
trust level that requires it. The CLI must verify before load. Hosted discovery
or distribution surfaces may list release-reviewed assets with auditable
provenance, but listing is not a format-validity requirement.

## Authoring Provenance

`kdna.json` SHOULD include an `authoring` object. Assets that claim `tested` or
higher quality MUST include authoring provenance and conformance evidence:

```json
{
  "authoring": {
    "created_by": "kdna-studio",
    "authoring_tool": "KDNA Studio Compatible",
    "authoring_tool_version": "0.3.0",
    "compiler": "@aikdna/kdna-studio-core",
    "compiler_version": "0.3.0",
    "project_uid": "018f8f1c-...",
    "asset_uid": "018f8f2d-...",
    "build_id": "build_...",
    "domain_id": "writing",
    "asset_name": "writing-editor",
    "content_digest": "sha256:...",
    "studio_project_digest": "sha256-...",
    "human_lock_required": false,
    "human_lock_policy": "optional_provenance",
    "human_lock_count": 8,
    "ai_assisted": true,
    "human_confirmed": true,
    "compiled_at": "2026-05-29T00:00:00Z"
  }
}
```

`created_by` is provenance metadata, not an allowlist. Compatibility is
established by validation and conformance evidence, for example
`authoring.conformance.passed: true`. Manual or experimental sources may exist.
Any external evaluation or release claim must identify its issuer, exact
subject, rubric, method, scope, time, and evidence. Schema validation proves
structure only; it does not prove judgment quality or establish adoption policy.

## Release Evidence Binding

Release evidence binds a named publisher's exact artifact and technical
materials. Human review, automated evaluation, expert review, and deployment
results may be published as separate issuer-scoped assessments. They are not a
universal ladder and do not create Core quality, trust, risk, recommendation,
certification, or production-readiness fields.
