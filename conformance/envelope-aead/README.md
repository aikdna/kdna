# Envelope draft vector evidence (2026-09-20)

These are local algorithm fixtures for RFC-0018. They are not complete `.kdna`
containers, Core consumer acceptance, release compatibility, or platform evidence.

Vectors 01–03 and `scripts/generate-envelope-aead-vectors.js` retain their prior
bytes. Their historical entry names and vector 03's fallback wording remain as
historical fixture metadata, not current slot-selection instructions. RFC-0018
R3/R6/R9 now control the expected outcome: an unsupported selected Argon2id slot
rejects; another slot requires an explicit separate selection. Vector 02's reused
CEK/IV pair is an isolated AAD experiment and violates production nonce uniqueness.

Vectors 04 and 05 use one fixed CEK each, two different credentials/salts/KEKs,
and two independently wrapped CEKs. Both successful paths must yield the
explicit `inputs.cek` and exact UTF-8 `inputs.plaintext`. Copying the primary
wrapped key to recovery must fail KW integrity under the recovery KEK. Wrapping
a different CEK can pass KW integrity but must fail payload GCM authentication.
For vector 05 a build without Argon2id must reject slot 0; explicitly selecting
slot 1 succeeds. Existence of slot 1 must not cause an automatic retry.

Reproduce or verify **only the new vectors** with existing dependencies:

```sh
node conformance/envelope-aead/generate-multislot.mjs
node conformance/envelope-aead/generate-multislot.mjs --check
```

The generator derives KEKs with Node scrypt / installed `@noble/hashes`
Argon2id, wraps via Node's native OpenSSL `id-aes256-wrap`, and encrypts via
AES-256-GCM. The runner separately unwraps using the RFC3394 AES-ECB round
algorithm; it does not import the generator. Native AES-KW generation versus
local AES-ECB unwrap and independently declared CEK/plaintext are separate
expected-output checks, not independent cryptographic-provider certification.
All fixture keys, salts and IVs are public deterministic test data and must
never be used to protect real assets. Generation requires Argon2id; it must
fail rather than replace its expected bytes when the dependency is unavailable.

Run the local consumer and regression checks:

```sh
node conformance/envelope-aead.mjs --argon2id=auto
node conformance/envelope-aead.mjs --argon2id=disabled
node conformance/envelope-aead.mjs --argon2id=required
node --test conformance/envelope-aead.test.mjs
```

Decryption, expected rejection, schema validation, and unexecuted algorithm
work are reported separately. `auto` without the optional dependency must
execute the unsupported rejection path, while `required` must fail. No skip
can establish decryption support. These checks do not establish random CEK
quality, global nonce tracking, CBOR parsing, memory erasure, native Swift or
browser parity, production entitlement service, or grammar.3 protected admission.
