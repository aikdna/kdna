# Web Package Release Readiness

The public web package path is:

```text
kdna-web-server -> kdna-web-client -> kdna-react -> create-kdna-web-app
```

Before these packages are published, the public ecosystem must prove that each
repository has real implementation files, tests, package locks, exported
entrypoints, generated-template smoke scripts, and a package-level
`npm run ci` command. It also checks that local links in packaged markdown files
point to files that exist and are included in the npm package `files` list, so
published package documentation does not point users at missing local docs.
Package and template dependency ranges must not use `latest`; generated
projects need bounded semver ranges so maintainers can reproduce user reports.
The server adapter must also keep its `@aikdna/kdna-core` peer range aligned
with the current KDNA runtime API used by the web package milestone. React package
peers must stay limited to the actual React runtime dependencies instead of
forcing sibling KDNA packages that are connected through endpoint props. The
browser client must keep its credential guidance aligned with the server
contract: passwords and signed entitlements can be sent once to `/load`, while
raw license keys belong on activation endpoints and must not be documented as
load credentials. The scaffolder templates must also install only the KDNA packages they import at
runtime; the current Next.js templates should not install
`@aikdna/kdna-web-client` just because it exists as a sibling package. The gate
also blocks known MVP-boundary regressions, such as scaffolder templates
reintroducing unsupported remote-server configuration before that capability
exists in `kdna-web-server`, or scaffolder metadata advertising templates that
do not exist yet. The scaffolder package must include its public docs and
security policy so contribution and template guidance do not disappear from the
npm tarball. Example `.kdna` downloads should use explicit release tags, not
`releases/latest/download`, so first-run docs do not drift when new assets are
released. The React MVP must also avoid exporting placeholder authoring
components or helpers for server endpoints that intentionally return `501` in
the current `kdna-web-server` milestone, and its maintenance docs must not
describe `@aikdna/kdna-web-client` as an internal dependency boundary while the
package calls compatible server endpoints directly. This includes the security
model, because vulnerability triage depends on the documented package boundary.

Run from `aikdna/kdna`:

```bash
npm run validate:web-packages
```

By default the script looks for sibling repositories next to `kdna`. To check a
different checkout layout:

```bash
KDNA_REPOS_ROOT=/path/to/open npm run validate:web-packages
```

This gate intentionally checks source/package readiness only. It does not
publish packages, create GitHub workflows, or prove a generated application can
install from npm. The `create-kdna-web-app` templates must include smoke-test
entrypoints and env examples so generated projects can verify KDNA package
imports after install without advertising unsupported runtime modes. After
publication, run a separate generated-app smoke test against published package
versions.
