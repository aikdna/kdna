# Start Here

KDNA v1.0-rc has five public paths. Pick the path that matches what you need to prove today.

| You are | Start path | Success definition |
| --- | --- | --- |
| AI user | [5-minute guide](docs/5-minute-guide.md) | You install `@aikdna/writing` and see a with/without KDNA judgment difference. |
| Domain expert | [First domain walkthrough](docs/first-domain-walkthrough.md) | You move from source notes to a verified `.kdna` asset with Human Lock evidence. |
| Developer | [CLI JSON contract](docs/cli-json-contract.md) | Your tool can verify, list, load, and trace a `.kdna` asset with stable JSON fields. |
| Agent builder | [Agent integration kit](docs/agent-integration-kit.md) | Your agent loads a domain and records the loaded judgment marker in a trace. |
| Registry operator | [Private registry demo](examples/private-registry/README.md) | Your registry blocks yanked, expired, digest-mismatched, and untrusted assets. |
| Domain maintainer | [Reference benchmark runbook](docs/reference-domain-benchmark-runbook.md) | Your domain has eval specs, raw outputs, scoring artifacts, limitations, and a passing public-confidence audit. |

## Public Confidence Quick Check

Run these in this repository:

```bash
npm install
npm run conformance
npm run validate:runtime-contract
npm test
```

Run this in `aikdna/kdna-cli` when validating the runtime CLI:

```bash
npm test
kdna doctor --agents --json
kdna available --json
kdna load @aikdna/writing --as=json
kdna trace --json
```

## What To Read Next

- [State of KDNA](STATE_OF_KDNA.md): what is stable, what is release-candidate, and what remains evidence-gated.
- [v1.0-rc release board](docs/V1RC_RELEASE_BOARD.md): execution board and remaining public release gates.
- [Conformance expected behavior](conformance/EXPECTED.md): fixture-level pass/fail contract.
- [Publishing example](PUBLISHING_EXAMPLE.md): Studio export to registry PR.
- [Reference benchmark runbook](docs/reference-domain-benchmark-runbook.md): evidence required before a domain can claim `validated`.
