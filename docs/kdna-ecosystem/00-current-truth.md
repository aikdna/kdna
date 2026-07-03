# Current Truth (live)

> Last updated: 2026-07-03. This file records the public ecosystem truth that
> should constrain README, roadmap, website, and package claims.

## Versions

| Component | npm latest | source version | public state |
|---|---:|---:|---|
| `@aikdna/kdna-core` | 0.15.10 | 0.15.10 | Beta runtime baseline for local public `.kdna` assets |
| `@aikdna/kdna-cli` | 0.28.34 | 0.28.34 | Beta CLI baseline for validate / inspect / plan-load / load |
| `@aikdna/kdna-studio-core` | 1.7.9 | 1.7.8 | Beta authoring SDK; npm is ahead of local source checkout |
| `@aikdna/kdna-studio-cli` | 0.8.11 | 0.8.10 | Beta authoring CLI; npm is ahead of local source checkout |
| `@aikdna/kdna-mcp-server` | 0.2.4 | 0.2.4 | Experimental MCP bridge |
| `@aikdna/kdna-activation-server` | 0.1.0 | 0.1.0 | Experimental self-hosted licensed-mode support |
| `@aikdna/kdna-remote-server` | 0.1.0 | 0.1.0 | Experimental self-hosted remote projection support |
| `@aikdna/kdna-web-server` | not published | 0.1.0 | Experimental public repo; MVP implementation in PR #1 |
| `@aikdna/kdna-web-client` | not published | 0.1.0 | Experimental public repo; MVP implementation in PR #1 |
| `@aikdna/kdna-react` | not published | 0.1.0 | Experimental public repo; MVP implementation in PR #1 |
| `create-kdna-web-app` | not published | 0.1.0 | Experimental public repo; MVP implementation in PR #1 |

## Stable Baseline

- KDNA Core v1 local public `.kdna` assets are the current public baseline.
- `kdna validate`, `kdna inspect`, `kdna plan-load`, and `kdna load
  --profile=compact --as=prompt` are the recommended first-run path.
- KDNA Core remains content-neutral: format validity does not imply content
  endorsement, ranking, or quality certification.

## Experimental / Not Yet Stable Baseline

- Web packages are public repositories but are not published to npm as of
  2026-07-03. Treat their README promises as implementation targets until PR #1
  in each web repository is merged and packages are published. The current
  server MVP covers upload/inspect/plan-load/load and activation proxying only;
  server-side Studio export, remote forwarding, CORS policy helpers, and durable
  Cloudflare/R2 storage are not shipped web-package capabilities yet.
- Remote runtime and activation server are self-hostable support surfaces, not
  an AIKDNA-hosted loading or licensing service.
- Swift runtime and Studio Swift are beta/support surfaces until parity is
  proven against fixed Core v1 conformance fixtures.
- Hosted registry, marketplace, content ranking, and paid distribution remain
  out of scope for KDNA Core v1.

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
- Web package release path: merge PR #1 in `kdna-web-server`,
  `kdna-web-client`, `kdna-react`, and `create-kdna-web-app`, publish packages,
  then run a generated-app smoke test against published versions. Keep the
  central `npm run validate:web-packages` gate green before publishing.
- Public truth drift: keep this file, `docs/public-roadmap.md`,
  `ecosystem-manifest.json`, website copy, and package READMEs aligned whenever
  versions or maturity claims change.
