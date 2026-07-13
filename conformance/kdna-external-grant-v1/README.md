# Account/device external grant fixtures

`golden.json` is a deterministic RFC-0019 vector. Every secret and private key
inside it is public, test-only material and MUST NOT be reused outside tests.

`negative/` covers signature tampering, revocation, asset version and digest
mismatch, and device mismatch. Regenerate the vectors with:

```sh
node scripts/generate-external-grant-fixtures.js
```
