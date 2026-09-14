# Current source integration

The `core-smoke` workflow checks sixteen source repositories: this repository
and fifteen external repositories at exact commits. Its input inventory is
[`ecosystem-source-inventory.json`](../scripts/ecosystem-source-inventory.json).
The workflow also materializes the accepted historical compatibility checkouts
for the release-manifest and dependency-binding checks. The frozen editor
checkout participates only in that historical compatibility check.

The two checks have different scopes. `ecosystem-manifest.json`, the default
`ecosystem-gate` command and `publish.yml` retain the accepted release and
publication coordinates. The source inventory does not publish a candidate,
change a registry coordinate or make an older compatibility audit pass.

## What the source check proves

The gate verifies each checkout's exact commit and tree, executable modes and
actual file bytes against its Git objects. It inventories tracked npm package manifests, npm lockfiles, managed KDNA
dependency declarations, local package archives and current Swift dependency
declarations in both directions. Other tracked inputs, including Python package
metadata and Swift resolution files, remain fixed by their Git bytes; they are
not parsed as additional dependency graphs. Python test dependencies are fixed
in the workflow and verified by real suite execution. Retired Swift manifests retain their complete content hashes as historical
inputs. Current Swift manifests must use a literal dependency array containing
public Git URLs and full commit revisions; moving branches, ranges, local paths
and dynamic dependency expressions fail closed. Comments and escaped identifiers
cannot hide a dependency. Retained manifests and fixtures remain visible in the
inventory; their presence does not make them current APIs.

It creates real npm packs with lifecycle scripts disabled and compares their
actual members and bytes with the reviewed inventory. The MCP pack includes its
twelve bounded vendor archives. Four exact third-party archives use a separate,
bounded standard tar reader for their existing tar dialect or size; unknown
digests receive no exception. That reader verifies package identity, members and
content hashes and rejects path escapes and links without extracting files.

Frozen dependency archives retain their own SHA-256 and SRI coordinates.
Matching version strings do not establish matching package bytes. The inventory
records every difference between an archive and a current pack, including
documentation, package metadata and executable content. A source-checkout
consumer still uses its declared fixed archive graph. In particular, the Studio
repositories document a local vendor installation graph and require coordinate
migration before registry publication; inspecting their packs does not establish
standalone registry installation.

Platform and repository-specific tests are queried from GitHub for an exact
reviewed tree. A normal rebase may change the commit while preserving that tree.
Every required check must be present; all observed checks, including duplicates,
additional checks and post-merge checks, must have completed successfully.
Failed, cancelled, skipped, neutral, missing required or unfinished checks block
the result. An absent post-merge run inventory is disclosed rather than counted
as another execution. The report retains the repository, commit, tree,
application identity and individual check URLs.

These remote executions are recorded separately from local package inspection
and this repository's real test suite, example validation, dependency audit and
Python adapter tests. Python tests run with explicit environment settings, a fixed configuration and
a repository boundary for local test hooks. They
produce a fresh JUnit report with nonzero executed cases; collection-only, skipped
cases and inconsistent case counts block the check. Every source checkout must
also retain its first observed commit and tree through the end of the run. A child's registered product-level `not_run` receipt stays
an unexecuted leg under that child's exact recomputation rules. Successful CI
does not turn it into Host installation, native device execution, provider
acceptance or editorial adoption.

## Reproducing the check

Run this coordination gate on Linux or macOS: its source-byte checks use POSIX
Git paths, executable modes and link behavior. The existing product test matrix
continues to cover Windows. Integration policy counterexamples run explicitly
in the Linux CI job and the macOS `core-smoke` job. This tooling boundary does
not change protocol or SDK platform support.

The pinned checkouts and tool setup are visible in
[`core-smoke.yml`](../.github/workflows/core-smoke.yml). For a local run, create
clean checkouts for the inventory's external repositories under a common
directory, each named by its repository and detached at its exact `commit`.
Keep their full histories for the separate compatibility projection. Install
this repository's locked dependencies with the authenticated npm release as
shown in the workflow, and install the workflow's fixed Python dependencies.

Set `KDNA_TRUSTED_NPM_TARBALL` to the authenticated npm archive outside the
repositories. Set `KDNA_SOURCE_REPOS_ROOT` to the directory containing the exact
external checkouts, and `KDNA_PYTHON` to the prepared Python interpreter. GitHub
check queries use `GH_TOKEN` or `GITHUB_TOKEN`; an authenticated GitHub CLI is the
local fallback. Then run:

```bash
node scripts/ecosystem-source-gate.js --work-dir ../source-check-result
```

The output directory must be new and outside every input checkout. The gate
writes `source-gate.json`, real packed artifacts and root command logs there.
It never treats a saved report as an authority or waits indefinitely for missing
CI. A blocked result identifies the failing stage; rerun into a new directory
after correcting the input or completing the required check. Child source
checkouts and frozen archives are never rewritten by this gate.
