# Withdrawn CLI License and Identity Skeleton

Status: **Withdrawn design draft**

This file previously proposed a broad command surface for creator identity,
asset signing, signature verification, licensing, publishing, backup, rotation,
and registry-backed distribution. It is not a current KDNA CLI contract.

The draft was withdrawn because it combined several independent
responsibilities and described commands that were never implemented, were
implemented differently, or are being removed from the Preview candidate. In
particular, it cannot choose among the earlier incompatible asset-signature
representations.

## Current boundary

- Exact released behavior belongs to the help and documentation shipped with
  that exact CLI version.
- The corrective Preview candidate keeps only the identity operations shown by
  its own help and rejects legacy identity backup/import operations.
- Asset-level signing, signature verification, and signed asset revocation are
  outside the current Preview candidate.
- Grant, entitlement, receipt, and optional Human Lock signatures are separate
  contracts. They do not create an asset-level signature or content
  endorsement.
- License and entitlement operations must accept secrets through protected
  input channels, never ordinary command-line values.

No command, compatibility promise, publishing workflow, or migration duty may
be inferred from this withdrawn file. Git history preserves the original draft
for provenance.
