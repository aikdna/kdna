# Web Package Release Readiness

The public web package path is:

```text
kdna-web-server -> kdna-web-client -> kdna-react -> create-kdna-web-app
```

Before these packages are published, the public ecosystem must prove that each
repository has real implementation files, tests, package locks, exported
entrypoints, generated-template smoke scripts, and a package-level
`npm run ci` command. It also checks that local README links point to files
that exist and are included in the npm package `files` list, so published
package documentation does not point users at missing local docs. Package and
template dependency ranges must not use `latest`; generated projects need
bounded semver ranges so maintainers can reproduce user reports. The gate also
blocks known MVP-boundary regressions, such as scaffolder templates
reintroducing unsupported remote-server configuration before that capability
exists in `kdna-web-server`.

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
