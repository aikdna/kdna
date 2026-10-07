# Protection admission /1 — R2 binding 7 candidate

The protection base contract remains `kdna.protection-admission/1`, version `1.0.0`.
Its current Schema is `urn:kdna:schema:protection-admission:1.0.0:binding:r2:7`,
[protection-admission-r2-binding-7.schema.json](protection-admission-r2-binding-7.schema.json).
The unique source is `public-semantic-source.json#protection_admission`; its explicit
`schema_binding` fixes the complete [R2 tuple](public-version-policy.md), Core
`0.37.0` and Read `0.11.1`. The binding participates in the existing
canonical definition digest. Base id/version alone cannot identify this combination.
Changing a bound package constant or reachable shape requires a new binding coordinate.

The cryptographic algorithms, grant/revocation rules, prepared delivery ownership,
one-use tokens, and outcome-unknown rules below retain their base meaning. Decrypted
Payloads now pass R2 semantic admission. Unknown critical meaning rejects all Read modes.
The original grammar.3 tuple and CS1 statements apply only to the preserved
[pre-R2 document](history/pre-r2/protection-admission.md) and
[old Schema](protection-admission.schema.json), whose bytes are retained.
This candidate makes no live deployment, independent acceptance or native account claim.

## 1. Manifest declaration and entry coverage

`Manifest.entitlement` is optional and references closed `ProtectionEntitlement`:
`{profile: 'password'|'account'|'org', offline?: boolean, revocable?: boolean}`.
The two flags have no defaults. No field is added to EncryptionDescriptor and no
extra-property escape is permitted. Existing required lists, enums, bounds and
additionalProperties settings remain unchanged.

| Authored combination | /1 declaration meaning and protected entry disposition |
|---|---|
| No entitlement; plaintext; no encryption | Prior legal source retains meaning, including licensed or omitted access. No credential, grant, lease, offline or revocable obligation is inferred. |
| Same plaintext, checksums and/or signature present | Explicit integrity-only admission, no credential. Verify every present document; absence is distinct from malformed. Ordinary entrypoints retain capability refusal. |
| entitlement.password; access licensed; encrypted true; encryption exactly `{profile:'kdna.envelope.aead',profile_version:'0.1.0',encrypted_entries:['payload.kdnab']}` | Canonical selected password slot; no fallback to predecessor profiles. |
| entitlement.account or org; access licensed; encrypted true; encryption exactly `{profile:'kdna.envelope.external-grant',profile_version:'0.1.0',encrypted_entries:['payload.kdnab']}` | External device grant and trusted expectations required. Envelope itself uses RFC19 `contract_version:'0.1.0'`, not a renamed `profile_version` field. |
| Entitlement present with plaintext, absent encryption, access omitted/public/remote, mismatched profile/version, or extra encrypted entry | Invalid declared combination. No inferred access/profile, no plaintext disclosure. |
| Canonical/external envelope marker without entitlement | /1 rejects missing explicit binding. Ordinary entrypoint still reaches its prior protection-capability rejection after Manifest validation. |
| Any predecessor or unknown encrypted profile | Unsupported in /1. No retry, alias, changed AAD or conversion. Its original normative coordinate remains intact. |
| Entitlement null, missing profile, unknown profile or extra property | New closed type rejects. No license/filename/title inference. |

This is a complete conditional matrix: every new presence must match exactly one
of the two encrypted rows; every absence uses the existing manifest/protection
meaning, with the explicit new entry permitted to verify integrity-only inputs.
All combinations outside those encrypted rows fail declaration validation under
/1. Existing malformed Container/Manifest rejection precedes this classification.

Rules apply to root `admitBytes`, Node/browser byte admission, `openSourceBytes`,
`packSourceBytes` input AND final output, new protected admission and protected
producer final output. The ordinary route keeps protection-marker capability
precedence. A newly shaped plaintext+entitlement input with no prior protection
marker becomes READ_CORE_INVALID before Payload admission; it must not slip
through merely because the old encryption trigger is false. The shared ordinary admission enforces this requirement; B1 evidence must compare
all ordinary and source entrypoints against the exact old package graph.

`offline=false` forbids an external-grant offline operation. `offline=true` is an
authored request that the protected integration can support a verified signed
grace window; it requires provider offline capability and a valid nonempty grant
window. It creates neither permission nor a duration. Absence is unprovided: the
explicit operation mode and actual signed grant control the decision. Password
possession is inherently locally usable: offline false conflicts with canonical
password use in this local Node module; true is compatible but confers no expiry
or service. `revocable=true` requires external-grant integration with issuer
status/refresh/revocation capability; password possession alone conflicts.
`revocable=false` expresses no requested revocation feature; it never disables
actual issuer revocation, refresh or expiry. Absent revocable means unprovided.
Incompatible declarations fail PROTECTION_DECLARATION_CONFLICT, not ignored flags.

## 2. Envelope location, encoding and cryptographic boundary

The encrypted payload entry itself, `payload.kdnab`, carries the entire envelope
metadata and ciphertext. No envelope side entry is added. Container still permits
its five fixed names and permitted attachments. Only payload.kdnab is encrypted;
attachments remain original members subject to existing resource/closure rules.

RFC18 canonical.envelope is deterministic CBOR with length-first encoded-map-key
ordering followed by bytewise ordering. The existing normative envelope schema
is mirrored byte-for-byte into Core. JSON is only the vector presentation; reject
JSON masquerading as payload envelope, duplicate CBOR keys, trailing bytes,
indefinite lengths, nonminimal integer/length encoding and noncanonical map order
before KDF. Compare deterministic re-encoding with input using a decoder that
retains duplicate/noncanonical evidence; ordinary object insertion order is not a
canonical encoder. RFC19 envelope also occupies deterministic CBOR under its own
schema and distinct unpadded base64url representation. Do not substitute RFC18
base64 or eight-line AAD for RFC19's eleven-line AAD.

Existing Container 25 MiB, entry 8 MiB, total inflated 12 MiB, entries128 and
compression ratio100 limits remain. Envelope/text/array/depth limits remain the
existing raw-admission limits. Decode/schema/length/resource/KDF-parameter checks
precede expensive derivation. RFC18 scrypt N32768/r8/p1/salt16/output32 is base;
Argon2id t3/m65536KiB/p4/salt16/output32 is optional and an actually selected but
unavailable capability produces PROTECTION_KDF_UNAVAILABLE. The profile-level
KDNA_KDF_UNSUPPORTED remains the underlying cause, not an old Core error enum.
Primary slot is the explicit RFC18 default; caller can select another declared
slot. Never retry other slots, KDFs, credentials, profiles or AAD after failure.
Each slot independently wraps the same CEK. Verify unwrap then GCM authentication
before any plaintext decode. Wrong credential/tag returns a generic named failure
without echoing credential, envelope, plaintext or exception text.

## 3. Exact byte domains and producer order

A = SHA256 of the complete ORIGINAL container bytes. C and E are calculated from
the original parsed entries, including the ciphertext envelope bytes. They are
never recomputed from a decrypted replacement ZIP. The single existing Core
Payload decode → schema → asset cross-binding → assertPayload → buildIR route
receives only authenticated plaintext from Core-owned protection dispatch. Caller
supplied plaintext, substitute Manifest, decrypt callback or `verification:true`
is not authority. The resource entries passed to IR construction remain original.
A legal AEAD can carry an illegal Payload; that attempt remains a real Core
semantic rejection and cannot issue an accepted snapshot or catalog shortcut.

C0.2 preimage is `UTF8('KDNA-CONTENT-TREE\0'+'0.2.0\0') || u32BE(count)`, followed
by each UTF8-sorted entry: `u32BE(name length)||name||kind byte||u64BE(content
length)||content`. Exclude only checksums.json and signature.kdsig from admitted
entries. Kind0 is the current **case-sensitive .json** canonical JSON path, kind1
raw bytes. In kdna.json remove only root content_digest and authoring.content_digest.
These are the existing C rules; no expanded recursive deletion is introduced.

E0.2 preimage is `UTF8('KDNA-RUNTIME-ENTRY-SET\0'+'0.2.0\0')||u32BE(count)||Σ
[u32BE(name length)||name||u64BE(raw length)||raw bytes]`. The names are exactly
runtimeEntryNames: kdna.json, payload.kdnab and declared mandatory entries,
deduplicated and unsigned UTF8 sorted. checksums.json, signature.kdsig and mimetype
cannot be mandatory additions. E excludes its own document and signature.

The separately named plaintext_digest is SHA256 of authenticated entry bytes.
RFC19 additionally compares its declared plaintext_digest. RFC18 records the
observed digest after authentication but gains no new wire member. The receipt
binds original A/C/E, entry, exact encryption identity, authenticated plaintext
digest and the same private operation. Neither plaintext_digest nor the signature
legacy digest substitutes for C, E or A. IR metadata can change with wrapping;
judgment meaning equivalence does not promise equal whole-IR digests.

Protected producer options are explicit output choices, separate from source:
`protectSourceBytes(legalPlaintextBytes, outputOptions, producerSecrets)`. outputOptions selects `password` with entitlement+selected authored
slots, `external-grant` with entitlement+issuer asset key/key_ref, or `integrity`
without entitlement. It may request checksums.document/1 and an Ed25519 signature.
Credentials/private keys are trusted in-memory inputs, not serialized source or
receipt fields. Reject unknown options or illicit plaintext/source substitutions.
First use ordinary source admission on the original legal, unwrapped plaintext;
then construct final protection Manifest from explicit options. Do not require a
plaintext input already carrying the forbidden plaintext+entitlement combination.

Producer order is strict: (1) admit source; (2) build final access/entitlement and
exact profile declaration; (3) encrypt payload using the final identity/AAD;
(4) compute original-member C and refresh BOTH well-formed existing root
content_digest and authoring.content_digest, preserving all authoring evidence
and all absent fields; (5) fix kdna.json bytes; (6) compute E and checksums;
(7) sign the frozen legacy preimage; (8) fix container and A; (9) issue any device
grant outside the container bound to that final A. Do not insert grant/A into its
own AEAD domain. Re-admit the saved final bytes with the intended actual consumer
credential; issuer-side encryption/self-check does not prove device consumption.
Studio actual preview/select/confirm and final creation evidence are a later B3.

## 4. Independent checksums and frozen old signature domains

`kdna.checksums.document/1` version1.0.0 is new. The old schema and E0.1 remain
unchanged. `checksums.json` uses the new closed shape in
[checksums-document-1.schema.json](checksums-document-1.schema.json): profile,
profile_version, algorithm sha256, digest_profile runtime-entry-set,
digest_profile_version0.2.0, covered_entries, entries, entry_set_digest.
Entries is an ordered array of closed `{name,bytes,digest}` rows; digest always
`sha256:` plus 64 lowercase hex, bytes is original raw length. This differs
explicitly from the old arbitrary-name object representation.

Document ≤1048576 UTF8 bytes; 2..128 rows; names ≤4096 UTF8 bytes; each original
member ≤8388608 bytes. Existing whole-container limits also apply. Reject raw
JSON duplicate keys before parsing, repeated row names, repeated covered names,
non-UTF8 order, extra/missing names, mismatched byte lengths/hashes or any E
mismatch. Both lists must exactly equal runtimeEntryNames in the same order.
Do not store A, checksums itself, signature, or a plaintext hash as a substitute.
An old0.1 document is unsupported, never relabeled/recomputed as a warning.

kdsig.ed25519/0.1.0 keeps the frozen helper preimage:
`UTF8('kdsig.ed25519:0.1.0:'+signature_content_digest)` where that digest is
`'sha256:'+SHA256(UTF8(lines.join('\n')))`. Each line is `entryName:lowercaseHex`
of SHA256 over that entry's old canonical content; **no trailing LF**. Sort paths
by unsigned UTF8 bytes. Exclude exactly `.DS_Store`, `build-receipt.json`,
`signature.kdsig`, and `reports/` prefix (strict new Container may reject these
before signing). Include checksums.json. Old JSON extension recognition is
**case-insensitive /\.json$/i**; JSON keys sort by JS UTF16 code units, arrays keep
order, JSON.stringify scalar/number representation remains unchanged. Only exact
kdna.json receives shallow removal of root asset_digest, container_sha256,
content_digest, _source, plus authoring.content_digest; do not recursively strip
same-named nested fields. New strict input rejects duplicate/malformed JSON even
if a permissive old helper could sign it. Crypto byte compatibility does not
broaden new whole-container admission.

Pins in machine-source `protection_admission.legacy_inputs` freeze the original
asset-reader/signature helpers, canonicalization document, old checksum schema
and profile schemas/RFCs. Those fixed sources and retained signature vectors are
independent B1 oracles; the new helper must not generate its own expected old
bytes. The B1 verifier uses those independent fixed expectations; primitive KATs remain
distinct from current R2 whole-container interoperability. Wrong/missing required signature, malformed signature or pin
mismatch rejects. Without a trusted pin, a mathematically valid self-carried key
only proves integrity under that key; receipt says verified_self_key. Pinned
verification says verified_pinned_key, not identity, judgment truth or access.

## 5. Result unions, stages and conservative old mappings

The generated [definition types](protection-admission.d.ts) freeze non-callable
unions. All branch records are closed; any field not listed is forbidden.
`ProtectionOperation` and `ProtectionPreparedDelivery` have private same-instance
brands. The generated [schema](protection-admission-r2-binding-7.schema.json) describes
observations and includes all result definitions; opaque authorities deliberately
compile to false, so JSON can never validate as an accepted branded result.
Admission observations replace a snapshot/operation with only its coordinate and
receipt; validating those observations creates no authority or successful run.

| Union branch | Required payload | Forbidden implications |
|---|---|---|
| ProtectedAdmissionResult accepted | snapshot, operation, receipt | Only after actual one-pass semantic acceptance and current protection; full IR has been disclosed to trusted Core caller. |
| core_rejected | stage(container/manifest/payload/interpretation), core (unchanged actual CoreAdmissionRejected) | No receipt, operation, snapshot, catalog or new protection diagnostic in old enum. |
| protection_failed | diagnostic(code+stage, generated closed stage map) | No fake Core state, receipt, body, exception text or issuer-secret data. |
| ProtectedReadResult request_failed | result (unchanged actual ReadCallResult from request admission) | Must be nonready and body-free, before Core work; no protection or Core state is fabricated. |
| admission_failed | actual core_rejected or protection_failed admission arm | No Read result or prepared body; no partial successful phase promotion. |
| read_result | actual unchanged ReadCallResult, receipt, disclosure | Includes a genuine current Read result or existing Read refusal. Catalog mode remains supported; unknown critical semantics never yield a catalog_only result. No new protection code is inserted into the Read result. |
| protection_failed | diagnostic, disclosure, body:null, body_bytes:0 | No prepared result or handle, even if trusted Host already saw an earlier body. |
| delivery_failed | reason(host_callback_failed/transport_commit_failed), disclosure, body:null, body_bytes:0 | No ready/delivered result; preserve actual earlier disclosure observation. |
| ProtectedTransportCommitResult committed | operation_id, committed_at_ms, disclosure (confirmed with non-null time) | Trusted transport synchronously acknowledged its configured handoff boundary under current checks; no claim of remote receipt. |
| commit protection_failed/delivery_failed | same body-free failure branches and accumulated external attempt/confirmation | Never erase earlier Host or external delivery facts. |

Integrity receipt checksums/signature observations are coupled: absent signature
has null signature_content_digest; verified signature has the exact legacy digest.
Receipt contract id/version/definition_digest must match the installed /1 descriptor.
Receipt encryption null means plaintext_digest null and authorization none;
canonical password uses password_possession; external profile uses external_grant.
These are non-schema semantic bindings, not assertions a caller can set true.
Read request_failed is restricted to actual admission_rejection/no_body_control/
transport_failure before content preparation. Existing Read content/state branches
retain their original semantics; status read_result alone does not claim ready.
No Core/Read success state is synthesized for a stage never executed.

Protected order: API host/byte shape → bounded Container → strict Manifest schema
→ declaration matrix → original C/E/self-bindings and present checksums/signature
→ exact bounded envelope/schema → credential/grant verification and current
trusted state → unwrap/KDF/AEAD → one existing Payload/IR path → current check
immediately before returning trusted accepted/catalog result. Recheck authorization
at the later Read boundaries below. New module codes are only those in the
machine-source diagnostic_stages map. Provider exceptions are sanitized to
PROTECTION_PROVIDER_FAILED; output carries no exception or source text.

Ordinary entrypoints do not learn new error enums: invalid byte argument remains
READ_INPUT_INVALID; malformed Container/Manifest/digest remains READ_CORE_INVALID;
existing encryption/signature/checksums triggers remain
READ_CORE_CAPABILITY_UNAVAILABLE after Container/Manifest; new incompatible
entitlement-only plaintext is READ_CORE_INVALID; copied/untrusted snapshots use
existing untrusted/input failure. Genuine protected snapshots passed to ordinary
async Read conservatively report READ_CORE_CAPABILITY_UNAVAILABLE. Disposed
inspection returns null, and pure projection/execution validation follows its
existing invalid-input branch. The retained base error order and state tables are not widened; the R2 Schema binding fixes its new tuple explicitly.

## 6. Trusted caller, operation lifecycle and every path

Core returning a normal public CanonicalReadSnapshot exposes full `.ir` at that
moment. Only a trusted caller already entitled to receive full IR may invoke this
protected Core path. The final Agent is not that caller unless explicitly granted
full IR; normally it receives only Host-authorized Read output. Opaque operations
control future actions, not recall of copied text, JSON, projections or capsules.
Synchronous private disposed/generation checks are distinct from a trusted clock,
verified status high-water, refresh and a remote revocation observation.

| Path | Input / already disclosed | Pure vs new controlled operation; current authority point | Failure / disclosure boundary |
|---|---|---|---|
| inspectSnapshot | same branded snapshot, full IR already returned | Pure lookup; no clock/store/network. Check private same-instance association/disposed flag. | null if untrusted/disposed; copied old IR still exists. |
| Read root project | admitted request + snapshot | Pure transform, existing brand checks; no online freshness proof. | Existing projection failure on invalid/disposed; output itself confers no new external permission. |
| ordinary readBrowser(snapshot) | genuine protected snapshot | New async Read must use explicit protected path. | Existing READ_CORE_CAPABILITY_UNAVAILABLE before Host/body/new handle. |
| ordinary bytes root/Node/browser/Read | original protected bytes | Existing conservative capability refusal, not decrypt. | Original precedence; no plaintext. |
| openSourceBytes/packSourceBytes | input and final source bytes | Same ordinary gate; invalid presence cannot bypass it. | Original Core rejection, never producer exemption. |
| create/admit/inspect ConsumptionPlan | prior snapshot/Plan | Pure static supply; no current execution authorization. Private protected association for subsequent controlled use. | Existing invalid input for disposed/untrusted source; retained plain Plan cannot be recalled. |
| create/admit/inspect RuntimeCapsule | prior snapshot/Plan/Capsule | Same pure/no-I/O rule. Plain capsule bytes are not a grant. | Old structure semantics unchanged; later use needs new protection and execution permission. |
| AgentHost request, execution | protected-derived Plan/Capsule | Pure request validators do not authorize action. Trusted Host must recheck operation at actual execution/action boundary plus its own action policy. | Old active text or capsule cannot replace current grant; failed current check prevents new controlled action. |
| readProtectedNode | same-instance live operation + matching snapshot or genuine carrier | Fresh trusted check before projection, after each awaited Host observation, before callback, before successful return/handle registration. | New body-free protection failure; retained view cannot skip final check. |
| expand handle | registered handle plus original live operation | Repeat current protection and both Host scope checks; same A/C/snapshot/Host, bounded expiry. | No JSON/hash reconstruction of registry; no stale expansion body. |
| Historical protected catalog | Pre-R2 carrier + private operation, no snapshot | Retained historical shape only; R2 unknown critical semantics reject all modes. | It is not an R2 disclosure fallback; wrong credential/technical error is never catalog. |
| trusted Host callback | authorized prepared result | Final check then immediate callback invocation is a disclosure to trusted Host. | Later callback failure/expiry does not erase that fact. |
| external transport commit | same operation + one-use private prepared delivery | Recheck protection/scope; reserve before provider callbacks, atomically consume and record attempt before side-effect callback. | No ready/body/handles on failure; preserve unknown/confirmed physical handoff observations; never retry this token. |

No ordinary pure function silently acquires I/O. B1 adds private association and
synchronous disposal guards while preserving ordinary unprotected behavior. A
protected snapshot's pure availability does not authorize a new controlled Read,
remote transmission or action. Serialized/cross-instance operations are untrusted;
receipt operation_id, fresh-looking timestamps, carrier digest and copied handles
cannot reconstitute the private relation. Dispose zeroes retained credential
material to the implementation's feasible memory limit, marks associations closed
and prevents new operations. Ephemeral CEKs and intermediate unauthenticated
plaintext are cleared at the decrypt/production boundary. This does not erase
JavaScript copies or past output.

The B1 candidate exports these callable signatures; independent runtime acceptance is pending:
`admitProtectedNode(bytesOrPath, options, trustedProvider) -> Promise<ProtectedAdmissionResult>`;
`readProtectedNode(operation, request, controlProvider, host) -> Promise<ProtectedReadResult>`;
`commitProtectedTransport(operation, preparedDelivery, trustedTransport) -> Promise<ProtectedTransportCommitResult>`;
`disposeProtectionOperation(operation) -> void`. Read uses the captured original
operation, not caller-supplied plaintext, verification flags or a replacement IR.
Admission options select none/password/external-grant, the exact slot (if any),
signature requirement and trusted signer pin, explicit online/offline mode, and
trusted external expectation. Secret credentials stay in memory and outside JSON
receipts/logs. Host callback receives the prepared Read result and an opaque
one-use preparedDelivery for commit; it must not treat callback return true as
permission to send later. `trustedTransport.observeScope` re-observes permission
for the exact request, A/C/snapshot and full required closure;
`trustedTransport.commit` performs the actual synchronous handoff. Promise-returning
or deferred commit callbacks are invalid, but this does not establish that no
side effect occurred. The same prepared token can never be retried. Delayed I/O
requires a distinct prepared delivery with a new current authorization/scope check
at its actual handoff; no automatic retry is permitted. Final local clock/private
generation check occurs after all awaited observations and immediately before the
atomic consume-and-record transition and synchronous handoff.


### 6.1 External delivery history and one-use transition (r2)

`ProtectionDisclosure` separates Host disclosure from external commit facts. Its
`none` arm requires `external_commit:{state:'not_invoked'}`. Its `trusted_host`
arm keeps `at_ms` and requires one closed external_commit arm:

- `not_invoked`: this prepared token has not invoked this API transport callback.
- `outcome_unknown`: `attempt_id` and `attempted_at_ms` are required. The callback
  was entered and may have sent part or all of the body; failure cannot prove
  nondisclosure.
- `confirmed`: the same attempt fields plus `confirmed_at_ms` record the trusted
  transport's literal synchronous true acknowledgement of its configured handoff
  boundary. This is not confirmation of receipt by a remote recipient.

Commit entry takes a private in-flight reservation before any external provider
or clock callback. Concurrent/reentrant entry on that token cannot begin another
observation or attempt. After awaited checks, recheck reservation, operation and
scope. The final synchronous private state transition consumes the token AND
installs outcome_unknown with a unique attempt id and the final trusted check
clock sample, before invoking any external side-effect callback. No external code
runs inside this transition. A pre-invocation failure closes the token with
not_invoked. Every terminal or consumed token stays closed; repeat/reentrant calls
return existing history without a second callback, new attempt or automatic retry.

Literal true promotes outcome_unknown to confirmed. False, throw, Promise,
thenable or other invalid return keeps outcome_unknown; never await or call a
thenable to manufacture later success. If true is acknowledged but the following
trusted clock throws/rolls back, the body-free failure still records confirmed,
with confirmed_at_ms:null. A committed success instead requires non-null time and
committed_at_ms exactly equal to it. When known, Host at_ms <= attempted_at_ms <=
confirmed_at_ms. Never invent a timestamp or downgrade a known one to null.

Exactly one prepared token belongs to each protected Read attempt. A deferred
new delivery requires a new protected Read with fresh authorization/scope checks;
it cannot replace the token or history of the earlier Read. All post-preparation
Read success/failure arms and commit results report this private accumulated
history for the same prepared token. Once a commit attempt failed or its outcome
is unknown, a later Host callback true cannot turn that owning Read into ready;
its outer result is body-free and retains that history. A Host-only successful
Read may retain not_invoked and makes no external-delivery claim. Later Host throw,
expiry, revocation, provider failure, disposal or repeated API invocation cannot
reset confirmed to unknown/not_invoked or discard its fields. Disposal closes
future authority and clears secrets, but retains redacted delivery facts while
that token/owning Read is reachable. Returned objects are immutable observations
at their return time; an earlier not_invoked object cannot prove a later absence
of disclosure. A serialization cannot restore authority or replace this history.

Concrete required counterexamples: Host at t10, confirmed commit at t11, then
Host throw or expiry at t12 returns a body-free failure retaining the t11 confirmed
fact; callback sends then throws/returns Promise yields outcome_unknown; callback
reenters with the same token never invokes a second send; a post-ack clock failure
retains confirmed with null time. These are definition examples, not runtime runs.

Failure body:null/body_bytes:0 describes the returned value only. not_invoked
covers only this token's callback: the trusted Host already possesses the body and
could send outside the API. No state claims global physical nondisclosure.

## 7. Time, grant, storage and Host boundaries

A trusted integration installs issuer pins independently of unverified activation
responses, provides a real clock, persisted high-water provider and optional
refresh transport. The Core verifies every grant signature and binding itself;
providers cannot return `verification:true`. Expectations originate in trusted
integration configuration: account_id, exact entitlement_id, account/org entitlement profile, device_id and distinct
X25519 agreement and Ed25519 signing public keys, asset UID/ID/version, captured A,
entry/ciphertext/key_ref/issuer asset-root key ID and issuer signing key ID/pin.
A, E, plaintext hash or a title are never interchangeable grant targets.

Provider operations must atomically compare/advance the verified status_version
and trusted time, return the committed high-water view, and fail closed on errors.
High-water scope is the exact issuer/account_id/entitlement_id tuple shared across devices; device grant
records use distinct device-key identity beneath that scope. Concurrent updates
cannot reset a shared revoked version by installing an older per-device record.
Clock rollback below persisted trusted high-water rejects. At refresh_after,
online mode requires a verified refresh; offline mode requires explicit operation
request, authored allowance and signed grace before expires_at. At expiry no
mode succeeds. Known newer revoked state rejects; disconnected clients cannot
promise instantaneous unseen remote revocation. Actual provider/store/native OS
transaction guarantees remain B1/B2 obligations, not this definition's proof.

Authorization validity does not grant Read scope; Host allow does not rescue an
expired/revoked grant. Preserve both Host observations, final-envelope budget,
mandatory closure and no partial body. A callback may save a previously authorized
body then await past expiry; record that earlier Host disclosure. A subsequent
commit fails and returns no new body or handle. No handle is registered until
successful delivery and a current final check. Callback-return/transport errors
are sanitized; failure responses never include the prepared body.

## 8. Verification limits and evidence

Definition/schema validity never issues opaque authority. B1 runtime and installed
package tests separately exercise the exact paths, original bytes and current
observations. Historical PP definition recipes retain their original NOT_EXECUTED
status; the new runtime case inventory names actual B1 tests without relabeling
old evidence. KAT domains, producer observations, authenticated admission and
trusted Host/transport disclosure are distinct evidence. Classifier nonzero
results and Git inventory facts remain unchanged requirements. Independent review
is still required for this candidate.

### 8.1 Rule ownership (r2)

The original base non_schema_rules and engineering rule_coverage,
runtime_enforcement_claims and runtime_not_implemented retain the original 27-rule meanings and claims. Only exact implementation source
sites that moved into the shared admission seam are updated in B1. Eight PROTECTION-* rules and all three complete registration
tables belong to protection_admission, the independent /1 version1.0.0 module.
Its rules text map must agree exactly with its structured non_schema_rules.
The generator derives coverage with the same strict function for each scope,
checks exact registrations, existing source sites/proof cases, resolved type
references and globally unique rule ids, and rejects missing or cross-scope rows.
It emits separate protection derived_runtime_enforcement in the module descriptor;
base diagnostic obligations retain their original meaning. All eight remain none
and runtime_not_implemented. This ownership repair does not waive the classifier:
the new module still requires its own coordinate, and Manifest presence/absence
still needs independent review. No B1 runtime claim follows.


## 9. Exact Node API and lifecycle

Core `/protection-node` exports only `getProtectionContract`, `admitProtectedNode`,
`bindProtectionOperation`, `disposeProtectionOperation`, and `protectSourceBytes`.
Core `/read-boundary` adds pure `isProtectedSnapshot`. Read `/protection-node`
exports `createTrustedProtectedHostReadProvider`, `readProtectedNode`, and
`commitProtectedTransport`. Generated declarations are the closed options/provider
and result interface. Read pins its independent descriptor expectation, exact peer
and actual installed Core implementation. JSON and another Core instance cannot
restore operations, checkpoints or delivery tokens.

The Core binding has source/observe/assertCurrent only; public Read obtains it
itself. `observe` performs required grant refresh and atomic high-water provider
transactions; `assertCurrent` repeats disposal/generation checks after the trusted
clock callback returns. Pure snapshots/Plan/Capsule/request lookups add only local
disposal checks, never implicit clock, network or authorization. Trusted execution
Hosts must explicitly perform current authorization at their action boundary.

Each prepared token belongs to one active Host callback. On outer callback settle,
unused authority closes. If commit is still reserved/awaiting provider or scope,
the owning Read fails body-free and registers zero handles. Late promises cannot
invoke send. Reservation precedes external callbacks; consumption and
outcome_unknown history precede the side effect. Confirmed/unknown history cannot
be erased by later callback failure. A synchronous true acknowledges only the
configured transport handoff, never remote receipt. Returned body0 does not undo
actual sink bytes. A new send needs a new protected Read.

Transport rechecks the complete prepared body against fresh Host scope. If the
existing scope filter would alter catalog, declarations, provenance, references,
relationships, omissions or closure, the old prepared delivery rejects rather than
sending its unfiltered original or silently trimming it. New Read can prepare and
budget a newly permitted result.

Passwords are UTF8 bytes (no normalization), at most 1 MiB. Raw grants are strict
JSON at most 1 MiB; device PKCS8 is at most 4096 bytes. Producer password slots are
explicit 1..16 work items, with exact profile parameters and internally generated
CSPRNG salts/nonce/CEK. Consumer wire limits remain the frozen profile/container
limits. Secrets are copied before await and owned copies cleared best effort;
this is not a guarantee of erasure from the JavaScript engine or Host memory.
Real account storage, issuer transactions, Keychain, production credentials and
remote HTTP delivery are separate adoption responsibilities.


### Request version failure

`ProtectedRequestVersionRejected` is a closed new /1 wrapper for the actual
existing `ReadEnvelopeRejected`, only when the original request-version dispatch
returns READ_MIXED_VERSION_TUPLE or READ_UNSUPPORTED_VERSION at stage version.
It preserves original not_evaluated states, null source coordinates, not_delivered
receipt and exact budget. Tiny budget remains the old no_body_control. No Core
bind/Host callback or ProtectionReceipt occurs. Schema-valid arbitrary later-stage
rejections, ready/catalog results, or caller-supplied envelopes cannot select this
path. Historical B0r2 did not represent this actual version-result branch.


### B1 current-invocation clock observations

`ProtectionCurrentFailure` is used only by `ProtectionBinding.observe` and
`assertCurrent`. Its required `checked_at_ms: UInt | null` is the last actual
trusted-clock attempt in this invocation: valid monotonic samples are retained
even when subsequent expiry, revoke, provider failure, or reentrant disposal
refuses authority. Each attempted clock call resets this observation first; a
throw, invalid value or rollback yields null. Failure before any clock call
(including invalid/stale checkpoint) also yields null. An earlier invocation's
receipt or stored high-water time is never reused as a current sample.

After synchronous transport acknowledgement, an authorization failure preserves
a valid observed confirmation time while retaining confirmed history. Public
Read/commit failure results explicitly project only status and diagnostic; this
binding-only field never leaks into those closed public result shapes. Neither
a timestamp nor a confirmed transport handoff grants current authority.
