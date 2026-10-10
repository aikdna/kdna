# Exact browser preview release

Core `0.37.1-rc.browser.1` and Read `0.11.2-rc.browser.1` use the separate
`browser-preview` npm tag. Their source, package artifacts and actual publication
are separate facts. The exact release has completed and registry acquisition has
been checked: both coordinates are published on `browser-preview` and are
installable there, while every `latest` coordinate is unchanged. Stable release
workflows and stable version gates are unchanged.

This route covers the retained ordinary and Host-unlocked protected browser SDK
and the preserved Node reference entry points of this exact pair. Core does not
perform browser decryption. Read requires an independently trusted Host, current
scope, matching snapshot/digests, sufficient budget and confirmed delivery.
It does not certify Reader products, authenticated humans, every platform or
production security. The native CLI `0.39.0-rc.native-sections.3` candidate declares this exact
companion pair and its separate native-section tuple. Older CLI versions retain
their own exact dependency graphs and must not receive an unreviewed pair swap.

## Candidate preparation before approval

Use the audited npm `11.17.0` tarball provisioned and authenticated by
`core-release-authority.js`. Set `KDNA_TRUSTED_NPM_TARBALL` to a new canonical
path outside the repository. No global npm installation is needed. Work from a
clean, DCO-signed commit descended from the maintained public baseline. Select a
new outside-repository output directory; existing files are never overwritten.

```sh
node scripts/core-release-authority.js provision-npm --artifact "$KDNA_TRUSTED_NPM_TARBALL"
node scripts/preview-release-authority.js candidate --unit core \
  --evidence "$OUTPUT/core.json" \
  --artifact "$OUTPUT/aikdna-kdna-core-0.37.1-rc.browser.1.tgz"
node scripts/preview-release-authority.js candidate --unit read \
  --evidence "$OUTPUT/read.json" \
  --artifact "$OUTPUT/aikdna-kdna-read-0.11.2-rc.browser.1.tgz"
```

Each candidate exports tracked Git blobs into two isolated repositories, builds
npm artifacts from the tracked JavaScript and generated public contract files,
checks naming on the exact source, compares both archives byte for byte, and
compares every regular archive member and mode with its Git source. No arbitrary
build callback or lifecycle hook runs. The output records source commit/tree,
DCO range, npm/runtime coordinates, SHA-256, SHA-1, SRI and complete member hashes.
The `local-candidate-no-publication-authority` marker cannot pass a publish gate.
The older local prerelease readiness command remains a candidate check only.

Public review must cover the final source, release notes, exact retained artifact
SHA and package/peer coordinates, account, public repository and registry targets,
PR/merge/tag/release actions, and post-publication verification. A machine block
records the reviewed proposal; it cannot prove that a human authorized publication.

## Exact real release event

After the required public approval and accepted source integration, create tags
on the same accepted source commit, in this order:

1. `preview/core/0.37.1-rc.browser.1`
2. `preview/read/0.11.2-rc.browser.1`, after Core publication is actually observed.

Publish each as a **prerelease**, with its exact corresponding section from
[change notes](release-preview-notes.md) followed by one final fenced
`kdna-preview-release` JSON block. The object has exactly these fields:

```json
{
  "schema": "kdna.preview-release-approval/1",
  "unit": "core",
  "repository": "aikdna/kdna",
  "source_commit": "FULL_REVIEWED_COMMIT",
  "source_tree": "FULL_REVIEWED_TREE",
  "base_commit": "c4299d751e0b5cac9474d2a95ce976c9cac0b267",
  "version": "0.37.1-rc.browser.1",
  "dist_tag": "browser-preview",
  "artifact_sha256": "EXACT_REVIEWED_RETAINED_ARCHIVE_SHA256",
  "notes_sha256": "SHA256_OF_TRIMMED_EXACT_NOTES_UTF8",
  "companion": null
}
```

For Read, `unit` and `version` change to `read` and `0.11.2-rc.browser.1`.
`companion` must contain exactly `name`, `version`, `sha256`, `integrity`,
`shasum`, and `gitHead` for the approved Core archive. The exact Core version is
`0.37.1-rc.browser.1`, and its `gitHead` must equal the same reviewed source
commit. Use actual generated facts; these placeholders are not runnable release
metadata. No private material, local path, private formal Reader input or
internal evidence belongs in the release body or attachments.

The workflow reads the actual `GITHUB_EVENT_PATH` published release. It checks
repository, prerelease/nondraft state, exact scoped tag/ref, SHA/tree, clean
checkout/index, source on `origin/main`, DCO for every introduced commit, source
notes and the approved artifact SHA. It builds and checks two exact-source packs
again, verifies the retained artifact through an isolated install, then repeats
all bindings immediately before publishing. Read additionally acquires the
already-public Core companion and checks its complete retained bytes.

The isolated audited npm publisher uploads the retained bytes with exact
registry `gitHead`, provenance and `defaultTag: browser-preview`. `latest` is
never selected. An exact existing name/version/SRI/SHA-1/gitHead is an idempotent
skip; any collision or ambiguous/failed registry response refuses publication.
No source-directory publish, lifecycle hook, fallback package or credential
output is allowed. A workflow failure is not successful publication.

## Public acquisition and rollback

After both packages are observed from the official registry, use a new directory,
empty cache and empty user config to install exact versions:

```sh
npm install --ignore-scripts --omit=optional --no-audit --no-fund \
  @aikdna/kdna-core@0.37.1-rc.browser.1 \
  @aikdna/kdna-read@0.11.2-rc.browser.1
```

Verify registry SRI and `gitHead`, all installed members, the exact Core peer,
then run the public licensed creation/save/read/selection/revision/reuse guide
and supported protected path. The workflow's installed-member/export smoke and
registry metadata check cover only those engineering facts; they do not replace
the complete public-channel use journey or independent acceptance. A source
candidate, public Git tag or draft PR alone is not release completion.

Keep old exact versions and compatibility guidance. If the preview needs to be
withdrawn, stop widening its use, publish an accurate advisory after required
approval, and use the separately approved named rollback action to move/remove
only `browser-preview`. Record its observed previous value before changing it.
Never move `latest`, overwrite/unpublish an existing version, force-update a tag,
or auto-upgrade users. Already pinned consumers keep their chosen version and
need explicit migration or rollback instructions. Any replacement package needs
a new version, reviewed bytes and a new release event.

The retained real-release evidence also records the official registry `dist-tags`
before publication. The duplicate guard, publisher and public verification compare
`latest` to that baseline. An identical existing version is accepted only when
`browser-preview` already selects it; public verification checks this exact tag
again after registry acquisition. Missing or conflicting tags fail closed. These
commands never repair tags, and a stale `latest` observation requires a fresh
reviewed run.
