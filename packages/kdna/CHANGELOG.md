# Changelog

## 0.13.0 (2026-07-15)

- Pin the compatibility package to the exact KDNA CLI 0.33.0 and KDNA Core
  0.18.0 registry releases so its legacy executable names resolve through the
  coordinated current toolchain.
- Preserve the existing CLI delegation shims and default runtime behavior. The
  compatibility package does not claim semantic Capsule consumption, judgment
  quality, or a second format/runtime path.
- Bind publication to a stable release event, one immutable source commit, an
  independently parsed exact tarball, the audited npm client and registry, and
  fail-closed registry duplicate evidence before any publish command can run.

## 0.12.0 (2026-07-14)

- Pin the compatibility package to the exact KDNA CLI 0.32.0 and KDNA Core
  0.17.0 registry releases so legacy executable names cannot drift onto an
  unverified runtime combination.
- Keep `kdna`, `kdna-lint`, and `kdna-validate` as delegation shims over the
  current CLI/Core toolchain; no second format or container-loading path is
  introduced.

## 0.11.0 (2026-07-13)

- Track KDNA Core 0.16.0 and CLI 0.31.0 so compatibility installs use the
  account/device entitlement runtime and current Runtime Capsule contract.
- Preserve the package as executable-name compatibility only; it does not
  introduce another KDNA format or direct container-consumption path.

## 0.10.6 (2026-07-13)

- Make the legacy `kdna-validate` executable delegate to the current
  `@aikdna/kdna-cli` validation path, including packaged `.kdna` assets and
  truthful non-zero failure codes.
- Add a clean packed-asset regression test for the compatibility alias.
