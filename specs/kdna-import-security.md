# KDNA Import Security Checklist

Status: Draft  
Normative: Yes for consumers that import `.kdna` files

## 1. Scope

This checklist defines the minimum import and runtime safety gates for KDNA
Core, CLI, Swift Core, Chat, Studio import, and agent adapters.

## 2. Container Checks

A conforming importer MUST:

- verify that the input is a parseable `.kdna` archive;
- verify `mimetype` exists where required by the active container profile;
- verify `mimetype` matches the canonical media type;
- reject path traversal entries using absolute paths or `..`;
- reject symlinks and executable surprises unless an explicit future extension
  allows them;
- reject duplicate archive entries;
- enforce compressed and uncompressed size limits;
- reject zip bombs and excessive entry counts;
- reject unsupported compression methods.

## 3. Runtime Entry Checks

The authoritative current entry classification is the Required/Optional table
in [`container.md`](./container.md). Importers MUST NOT maintain a second entry
list with different requiredness.

The required Runtime entries are exactly:

- `mimetype`
- `kdna.json`
- `payload.kdnab`

`checksums.json` is optional at the protocol layer and official writers emit
it. When it is present, importers MUST validate it and reject a declared digest
mismatch. Its absence is not by itself a format error.

Future Phase S security profiles may add signature and encryption entries. They
MUST NOT silently redefine the current baseline.

Top-level source-tree entries such as `KDNA_Core.json` and
`KDNA_Patterns.json` MUST NOT be treated as conforming runtime distribution
entries. They MAY be supported only through explicit legacy import or migration.

## 4. Payload Checks

Consumers MUST:

- parse JSON/CBOR with bounded depth and bounded collection sizes;
- reject malformed payloads;
- reject unknown access modes unless mapped through documented legacy aliases;
- reject unknown entitlement profiles;
- reject unknown crypto profiles;
- reject downgrade attempts;
- verify checksums when present;
- verify signatures when required by the active profile.

## 5. Persistence Rules

Consumers MAY read the original `.kdna` file directly or preserve an
implementation-defined immutable copy. If they persist state, they MUST NOT
persist decrypted source JSON as the canonical asset.

Derived caches, if introduced later, MUST be encrypted at rest, rebuildable,
marked non-canonical, and bound to local runtime policy.

## 6. Legacy Import

Legacy source-tree import MUST be explicit. A consumer MUST NOT silently treat a
directory of top-level source JSON files as a portable runtime asset.

Legacy import SHOULD return a LoadPlan issue such as
`KDNA_FORMAT_LEGACY_SOURCE_TREE` or an equivalent transitional code.
