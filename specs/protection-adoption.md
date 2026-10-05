# Protection profile adoption boundary

Status: **Candidate adoption contract and current capability statement**.
This document separates existing protection contracts, retained implementations,
and current R2 explicit Node integration. The original calibration added no wire field.
The separately reviewed B0 [protection admission definition](protection-admission.md)
introduced optional Manifest.entitlement and independent /1 module definitions.
The B1 candidate implements explicit Node protection APIs; runtime acceptance,
service adoption and product rebinding are separate. It adds no profile alias or
judgment change. RFC and feature lifecycle states
remain as declared by their source documents; no deprecation is issued here.

## 1. Current capability and evidence

The current unpublished local package line is Core `0.36.0` and Read
`0.11.0`. Local package identity is recorded in
[public-semantic-source.json](public-semantic-source.json) (`engineering.package_versions`)
and the [Core](../packages/kdna-core/package.json) / [Read](../packages/kdna-read/package.json)
package metadata. [SPEC-INDEX](../SPEC-INDEX.md) records the current contract family.
Fixed historical pages retain their named coordinates and are not current selectors.
These local candidates are not a public release.
Its ordinary public root, Node and browser admission share the rejection in
[`admit.js`](../packages/kdna-core/src/public-contract/admit.js): after container
and Manifest validation, any encrypted payload, `manifest.encryption`,
`signature.kdsig`, or `checksums.json` returns
`READ_CORE_CAPABILITY_UNAVAILABLE`. Earlier malformed container/Manifest
errors retain their normal precedence. This statement does not remove those
features from another contract or grant new support to this candidate.

The table below separates ordinary entry refusal and retained helper evidence.
Explicit Node protection admission/read, integrity verification and issuer/source APIs
are specified by [protection admission](protection-admission.md),
[issuer](external-grant-issuer.md) and [protected source](protected-source-r2.md).
They do not establish production accounts or native credential storage.

| Surface | What exists | What it establishes for ordinary admission or retained helper evidence |
|---|---|---|
| Ordinary plaintext admission and Read | Current public Core/Read implementations | Only their explicitly supported tuple, input set and accepted scope |
| Licensed-entry, password, password.scrypt | Retained `crypto-profile.js` helpers | Reusable compatibility implementation; no protected public admission |
| Canonical `kdna.envelope.aead` | RFC-0018 Draft, schema, known-answer vectors and local algorithm runner | Candidate algorithm/schema evidence; the runner is not Core profile dispatch |
| Account/org external grant | RFC-0019 Draft, schemas and `external-key-grant.js` | Helper-level grant verification and memory decryption; no ordinary public admission or proof of a deployed issuer |
| `kdsig.ed25519` asset signature | RFC-0021 M1 candidate and retained signing/verification helper | Content-integrity/provenance mechanism; no ordinary signed-container admission |
| `checksums.json` | Existing document schemas, digest contracts and retained consumers | No ordinary checksums-document admission; calculating digests is not validating a supplied document |

Retained helpers can be included in package files without being exposed as new
public entry points. Passing helper tests or schema vectors does not establish
installed-consumer behavior. No cross-language, native-platform, remote service
or production availability follows from this table.

## 2. Profile identity and compatibility

The [profile inventory](kdna-crypto-profiles.md) keeps these coordinates distinct:
`kdna.encryption.licensed-entry`, `kdna.encryption.password`,
`kdna.encryption.password.scrypt`, `kdna.envelope.aead`,
`kdna.envelope.external-grant`, `kdna.grant.external-key`, and `kdsig.ed25519`.
A profile version or contract version is interpreted only inside its own
profile. Shared algorithms or the text `0.1.0` do not imply wire compatibility.

The retained predecessor helper uses five AAD lines; superseded
RFC-0008/0009 bodies use four. The exact historical sequence is `profile`,
`manifest.name`, `manifest.version`, `entryName`, joined with LF and no trailing
LF. The retained `encryptedEntryAad` sequence is `profile`, `profileVersion`
(default `0.1.0`), `manifest.asset_id || ''`, `manifest.version || ''`,
`entryName`, likewise joined with LF and no trailing LF. Its profile default is
`kdna.encryption.licensed-entry`; password helpers pass their own distinct IDs.
These defaults are observed helper behavior, not permission to omit identity
required by a supported container contract. A future adoption of the retained
helper must pin that actual five-line consumer and document its accepted inputs.
Historical four-line artifacts remain preserved evidence;
they are not silently retried, relabeled or converted. Supporting a different
historical binding requires a separately identified compatibility contract and
receipt. This requirement does not revoke any existing support commitment.

RFC-0018 draft revisions correct the conflicting same-wrapped-bytes wording to
one CEK separately wrapped per slot, separate mandatory scrypt from optional
Argon2id conformance, and align the candidate's parameter/slot acceptance rules.
These changes affect draft interpretation and can affect a consumer that followed
the earlier text or broader schema. They are not a proof of all-consumer
compatibility, nor evidence that an old production encryption implementation
was defective. Preserve old vectors and failing observations, compare the
particular consumer, and bind adoption to the reviewed revision. A later change
to a stable, promised meaning requires the applicable coordinate/lifecycle
process; Draft status is not permission to silently replace published artifacts.

## 3. Required boundary for explicit protected admission

The following requirements must be met by an explicit integration before it
claims protected R2 support. They do not authorize a tool to synthesize
a Core snapshot or add a second payload parser.

1. **Keep the immutable input identity.** Compute A from the exact original
   encrypted container bytes. Preserve those bytes and their profile/version,
   Manifest, entry names and authenticated metadata through the operation.
   A repacked plaintext container has its own A and cannot replace the original
   encrypted asset's identity or its grant binding.
2. **Verify the declared protection contract.** Dispatch on the exact profile
   and version; reject unsupported profiles/algorithms/capabilities explicitly.
   Use only the selected declared slot and matching credential under RFC-0018.
   Verify unwrap integrity and the AEAD tag/AAD before parsing plaintext. Do not
   retry alternate profiles, AADs, KDFs or entries after failure.
3. **Bind external authorization to the original object.** For RFC-0019,
   validate the grant schema and pinned issuer signature, active status,
   refresh/expiry/offline window, monotonic status and trusted-time evidence.
   Match the expected account, both device public keys/device ID, entitlement,
   asset UID/ID/version, original A, exact entry path, ciphertext digest,
   `key_ref`, and issuer asset key ID. The authorized subject and expected A
   come from the trusted integration, not an untrusted object's self-assertion.
   A final package digest is bound after packaging, not inserted into its own
   AEAD input. An `active` string or old LoadPlan is not authorization evidence.
4. **Keep digest domains separate.** A is the complete original container;
   C is the line's defined content-tree digest; E is its defined runtime-entry
   set digest; RFC-0019 `plaintext_digest` hashes that entry's plaintext.
   None substitutes for another. State the exact profile, version, byte domain
   and comparison source for every value. Do not rename a plaintext hash to C
   or replace encrypted-entry bytes in C/E behind the existing coordinates.
   Any additional plaintext-to-original binding required by admission must be
   explicitly specified and verified before consumer adoption. The unchanged
   [A/C/E/P definitions](public-version-policy.md) continue to apply.
5. **Admit the authenticated plaintext once.** Validate its supported Payload
   tuple, asset identity against the original Manifest, full judgment structure,
   references, component/static-policy rules and Canonical IR using the same
   Core semantics as ordinary assets. Retain a verified association between
   that admission, the original container and the protection/authorization
   evidence. Only Core may issue its trusted snapshot; a helper's plaintext,
   serialized receipt or retained legacy session cannot substitute for it.
6. **Retain distinct authority.** A valid signature establishes the stated
   integrity/provenance binding; it does not establish key entitlement,
   judgment correctness, Read permission or action authorization. A checksum
   comparison is not signature authentication. Read disclosure and native
   execution keep their own Host policy and current permission checks.
7. **Keep secrets and policy state in their proper owners.** Plaintext and
   CEKs remain in memory within the allowed operation and are not logged,
   cached as canonical assets or exposed through diagnostics. RFC-0019 clients
   persist highest verified status/time in their SecretStore, and services
   implement transaction-bound challenge consumption and issuer/revocation
   policy. The helper's caller-supplied clock/minimum-status arguments do not
   prove those duties. Permission loss cannot recall plaintext already
   legitimately disclosed; offline use is bounded by the signed window.

The explicit Node implementation described below still requires its own bounded
artifact acceptance. Ordinary root/browser capability rejection remains in force.

## 4. Evidence required before claiming adoption

A consumer receipt must pin the contract revision, source and actual package
bytes, environment/dependencies, advertised KDF/profile capabilities, commands
and observed results. Keep the following results distinct:

- Base canonical algorithm conformance; optional Argon2id capability and its
  actual decrypt results; named unsupported-capability results. A skip proves
  none of these by itself.
- Normal and independently wrapped multi-slot decryption, selected-slot
  rejection, wrong credential, modified ciphertext/tag/AAD/identity and
  unsupported profile/version/parameters.
- Actual protected-container public admission and plaintext semantic validation,
  including rejection of invalid plaintext after valid decryption and rejection
  when original A, entry, grant or asset identity is substituted.
- Signature/checksums verification, account/device mismatch, expiry, revocation,
  sync/offline limits, persisted-state rollback and unsupported platform cases
  for each capability actually claimed.
- Ordinary versus protected copies with the same authored judgments: demonstrate
  preserved judgment meaning and distinct original-container identities. Do not
  assume C, E, IR digest or runtime IDs are equal without their precise domains.

Local runner, schema, helper, installed Core consumer, native platform and
online service evidence must each name its own scope. Toolchain rebinding,
production accounts, formal asset rebuilding and
Reader implementation are outside this contract-calibration change.

## 5. B1 implementation candidate

The exact protected admission/read unions, plaintext conflict matrix, original
ciphertext A/C/E association, frozen kdsig0.1 preimage, new checksums.document/1,
trusted full-IR caller and Host/transport disclosure points are defined in
[protection-admission.md](protection-admission.md). Optional shape is not a
compatibility receipt. The Node protection module now implements presence enforcement, current
authorization, catalog provenance, exact crypto and explicit production. Its
actual package behavior requires independent B1 review; account services,
protected storage, Studio export and product adoption remain separate work.
