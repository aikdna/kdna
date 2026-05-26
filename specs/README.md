# KDNA Specifications

Supplementary specification documents for the KDNA protocol.

## Reading Order

| # | Document | What it covers |
|---|----------|---------------|
| 1 | `kdna-file-format.md` | The `.kdna` single-file domain format |
| 2 | `kdna-package-format.md` | The `.kdnapack` package bundling format |
| 3 | `kdna-registry.md` | Registry index format (`domains.json`) and API |
| 4 | `kdna-access-modes.md` | Access control: open / licensed / runtime |
| 5 | `kdna-license.md` | KDNA Commercial License (KCL) terms |
| 6 | `judgment-trace-schema.json` | Schema for recording what KDNA triggered during a judgment |
| 7 | `judgment-report-schema.json` | Schema for human-readable reports generated from a judgment trace |
| 8 | `outcome-record-schema.json` | Schema for recording whether a judgment was correct in hindsight |
| 9 | `kdna-crypto-protocol.md` | Cryptographic infrastructure for .kdna encryption, signing, licensing, and revocation |
| 10 | `kdna-identity-key.md` | Identity key generation, backup, rotation, and license binding |

The core protocol specification is in `SPEC.md` at the repository root.

For app and runtime integration, read `docs/app-runtime-contract.md` after `docs/runtime-routing.md`.

Runtime contract examples live in `examples/app-runtime-contract/` and can be checked with:

```bash
npm run validate:runtime-contract
```
