# Web Package Release Readiness

The public web package path is:

```text
kdna-web-server -> kdna-web-client -> kdna-react -> create-kdna-web-app
```

Before these packages are published, the public ecosystem must prove that each
repository has real implementation files, tests, package locks, exported
entrypoints, generated-template smoke scripts, and a package-level
`npm run ci` command.

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
entrypoints so generated projects can verify KDNA package imports after install.
After publication, run a separate generated-app smoke test against published
package versions.
