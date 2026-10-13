# Exact stable Core and Read release

Core `0.37.4` and Read `0.12.1` are new stable distribution candidates for the
npm `latest` tag. This document describes preparation and publication gates; it
records the source and artifact evidence that publication then performed. The [channel history](current-release-support.md#published-channel-history)
retains the earlier previews and observed `latest` values. A stable npm version
is a distribution coordinate, not a claim that the entire ecosystem is GA.

The base browser/Node tuple and native section tuple remain separate. Core does
not decrypt in the browser; retained protected browser reading requires an
independently trusted Host. A distribution change does not authenticate humans,
activate a Host, authorize actions or expand platform support. The [current
contract guide](core-read-current-status.md) states those limits.

## Prepare retained candidate bytes

Work from a clean, DCO-signed commit descended from the release baseline declared
in `scripts/stable-release-authority.js`. Use audited npm `11.17.0`, provisioned
and authenticated by `core-release-authority.js`; no global npm change is needed.
Set `KDNA_TRUSTED_NPM_TARBALL` to a new canonical file outside the repository,
and `OUTPUT` to a new absolute output directory outside the repository. Existing
output files are refused.

```sh
node scripts/core-release-authority.js provision-npm --artifact "$KDNA_TRUSTED_NPM_TARBALL"
node scripts/core-release-authority.js verify-npm
node scripts/stable-release-authority.js candidate --unit core \
  --evidence "$OUTPUT/core.json" \
  --artifact "$OUTPUT/aikdna-kdna-core-0.37.4.tgz"
node scripts/stable-release-authority.js candidate --unit read \
  --evidence "$OUTPUT/read.json" \
  --artifact "$OUTPUT/aikdna-kdna-read-0.12.1.tgz"
node scripts/stable-release-authority.js candidate-smoke --unit core \
  --evidence "$OUTPUT/core.json" \
  --artifact "$OUTPUT/aikdna-kdna-core-0.37.4.tgz"
```

The authority exports tracked Git blobs twice, runs source pack-content,
public-surface and naming gates, packs without lifecycle scripts and compares
the archives byte for byte. It verifies every member's source bytes and mode.
Evidence records source commit/tree, DCO range, runtime and npm identity, SHA256,
SHA1, SRI and full member inventory. The local-candidate authorization marker
cannot pass publication. Core's local candidate smoke uses its retained archive
and an isolated installed consumer. Read's release smoke requires an approved,
already-public exact Core companion and a genuine release approval; local Read
candidate evidence has no such authority. Before publication, the complete
CLI/native source delivery separately cold-installs and exercises the candidate
pair. Actual public acquisition is checked after the release.

Review the final source, exact retained bytes, change notes, dependency graph
and public target before integration and publication. A machine approval block
binds those facts but cannot itself establish human authorization. Any change
to a packed member requires fresh artifacts and review; an older preview's
hash cannot be attached to a new stable coordinate.

## Real stable release event

After the reviewed source is integrated on `origin/main`, select that same
accepted commit for both tags. Publish Core tag `0.37.4` first, then Read tag
`read/0.12.1` after the exact Core artifact is available from the registry.
Both GitHub releases must be published, nondraft **stable releases**. A local
command, prerelease event, branch ref or fabricated event cannot substitute.

Use the exact corresponding section from [stable change notes](release-stable-notes.md),
followed by one final `kdna-stable-release` fenced JSON block. The Core shape is:

```json
{
  "schema": "kdna.stable-release-approval/1",
  "unit": "core",
  "repository": "aikdna/kdna",
  "source_commit": "FULL_REVIEWED_COMMIT",
  "source_tree": "FULL_REVIEWED_TREE",
  "base_commit": "d9c036661459b0588dba715a800997f1790e14f1",
  "version": "0.37.4",
  "dist_tag": "latest",
  "artifact_sha256": "EXACT_REVIEWED_ARCHIVE_SHA256",
  "notes_sha256": "SHA256_OF_TRIMMED_EXACT_NOTES_UTF8",
  "companion": null
}
```

These placeholders are a schema example, not runnable approval metadata.
For Read, change `unit` to `read` and `version` to `0.12.1`; `companion` contains
exactly `name`, `version`, `sha256`, `integrity`, `shasum` and `gitHead` for the
approved Core `0.37.4` artifact. Its `gitHead` must equal the same reviewed source
commit. Public notes and attachments contain only public release facts.

The [publish workflow](../.github/workflows/publish.yml) invokes
`stable-release-authority.js` with `check`, `prepare`, `smoke`, `guard`, `publish`
and `verify-public`, using `--unit core` or `--unit read`. Except for `check`,
each command requires both `--evidence` and `--artifact`. These release commands
read the genuine GitHub event and rebind repository, exact tag/ref, source SHA
and tree, clean checkout, main ancestry, DCO, source notes and approved bytes.
`prepare` builds twice again. Read obtains its already-public exact Core
companion; publication uploads only the approved retained archive.

A matching existing version is an idempotent verification only when its package
identity, source `gitHead`, SRI, SHA1 and selected dist-tag agree. Different bytes,
ambiguous registry errors, missing companions or altered tags fail closed.
The complete prior dist-tag map is retained. Only the selected package's
`latest` may transition to the approved new version; other tags remain fixed.
These commands do not silently repair a conflicting registry state.

## Public acquisition and dependency closure

After both official versions are observed, use an empty cache and new directory,
empty user config and the exact package pair:

```sh
npm install --save-exact --ignore-scripts --omit=optional --no-audit --no-fund \
  --registry=https://registry.npmjs.org \
  @aikdna/kdna-core@0.37.4 @aikdna/kdna-read@0.12.1
```

Verify downloaded archive SHA256/SRI and `gitHead` against the approved evidence,
then all installed members and the exact peer graph. The workflow checks public
acquisition and installed exports. The complete create/save/read/meaningful
revision/reopen/reuse journey, protected route and real named Host continuation
need their own execution records; an export smoke does not establish them.

The companion candidate order is Core → Read, then native CLI `0.40.0` and
Studio Core `4.0.0`, then Studio CLI `0.13.0`, following their actual exact
dependencies and their own repository release gates. Complete MCP/Creator and
protected Host source deliveries bind those new archives separately; this wave
adds no MCP npm package. Historical Python, Conformance, Eval, compatibility and
asset channels retain their independently declared scope.

If publication fails, preserve the exact evidence and observed registry state.
Do not overwrite a version, force-update a tag or unpublish an artifact. Any
channel rollback or advisory is a separately reviewed action against a named
prior state; pinned users keep their chosen version until they explicitly
migrate. A replacement artifact requires a new version and release event.
