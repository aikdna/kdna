# Current Truth (live)

## Versions

| Component | npm | source |
|---|---:|
| @aikdna/kdna-cli | 0.28.1 | kdna-cli (main) |
| @aikdna/kdna-studio-cli | 0.7.0 | kdna-studio-cli (main) |
| @aikdna/kdna-core | 0.14.0 | kdna (packages/kdna-core) |
| @aikdna/kdna-studio-core | 1.6.0 | kdna-studio-core (main) |

## P0 fix log

- 2026-06-26: comparator bug + access vocabulary (PR #48, kdna-cli)
- 2026-06-26: real guardrail hashes (PR #49/#28, kdna-cli + kdna-studio-cli)
- 2026-06-26: chore/security-md merged to main (PR #21, kdna-assets)
- 2026-06-26: Swift license verify throws (PR #5, kdna-core-swift)

## P1 fix log

- 2026-06-26: B7 — checkTrust uses core.planLoad instead of raw manifest.access (kdna-cli, direct push)
- 2026-06-26: L7 — kdna-registry refs cleaned from specs/RFC (PR #134, kdna)
- 2026-06-26: L8/L9 — audit doc path scrub (PR #135, kdna)
- 2026-06-26: kdna-registry refs marked out-of-scope (PR #51, kdna-cli)

## Remaining P1

- B5: 旧 run.mjs → canonical-conformance (kdna)
