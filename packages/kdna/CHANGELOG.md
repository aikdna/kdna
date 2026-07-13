# Changelog

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
