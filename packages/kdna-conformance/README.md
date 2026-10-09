# @aikdna/kdna-conformance

The published npm `0.2.0` package is a historical conformance bundle. It is already published and must not be overwritten. Its default runner exercises the earlier `validate`, `planLoad` and `load` surface, Container `0.1.0`, and Runtime Capsule `0.1.0`. Passing that suite does not establish conformance to the native Container `0.6.0` / Read `0.7.0-candidate` route or the current browser contract.

The complete Git source also contains a public-contract dispatcher that is absent from the published `0.2.0` tarball. The source package still carries version `0.2.0`; it is not byte-identical to that registry artifact. A future independently installable dispatcher needs a new package coordinate and a complete packaged worker/vector graph. No same-version replacement is intended.

## Historical npm runner

For implementations of the historical `validate`, `planLoad`, `load` API:

```sh
npm install @aikdna/kdna-conformance@0.2.0
npx kdna-conformance --impl ./my-historical-core.js
```

The published package depends on Core `0.22.0` and `cbor-x ^1.6.5`. Its bundled signature, password-envelope and authorization vectors are bound by `vectors/manifest.json` byte counts and SHA-256 values. They remain historical vector sets; their presence does not add those capabilities to the current native route or certify an asset's judgments.

## Complete-source frozen vector dispatcher

Use an exact complete Git checkout, not the npm tarball alone:

```sh
node packages/kdna-conformance/bin/kdna-conformance.js --public-contract --source-root /absolute/complete-kdna-source --runtime /absolute/isolated-runtime --output /absolute/report.json
```

The source must include `scripts/public-contract/run-vectors.mjs`, `conformance/public-contract-decision-vectors.json`, `conformance/public-contract/vectors.generated.json`, and the complete `conformance/public-contract/test/` worker/fixture authority. The explicit runtime directory must contain the matching installed Core/Read implementation. The dispatcher starts fresh child processes and records their actual results; it is not another semantic implementation.

The frozen 94-vector suite has its own tuple in the decision-vector file (Container `0.5.0`, payload `0.5.1`, Core `0.8.2`, Canonical IR `0.6.1`, Read `0.6.4`). That suite is distinct from the native Container `0.6.0` / Read `0.7.0-candidate` and browser routes. It includes real-byte checks, test-authority fixtures and explicit stage observations. Keep each recorded evidence route and execution receipt; a vector expectation or assertion projection alone is not full runtime conformance, human acceptance, authorship or action permission.

See [auxiliary support boundaries](../AUXILIARY-SUPPORT.md). Apache-2.0.
