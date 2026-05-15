# Contributing to KDNA

This repository is the KDNA protocol specification. Contributions here should focus on schema improvements, validator rules, documentation fixes, behavioral evaluation cases, and loader improvements.

## Scope of This Repository

- Spec and schema (SPEC.md, schema/*)
- Validators (validators/*)
- Documentation (docs/*)
- Registry and governance (registry/*)
- Minimal reference examples (examples/communication)

## Contributing a Domain

Domain-specific KDNA packages belong in **separate repositories** under the `aikdna` organization. See the [registry policy](./docs/registry-policy.md) for the inclusion criteria.

To contribute a new domain:

1. Create a new repository with the naming convention `kdna-<domain>`.
2. Include at least `KDNA_Core.json` and `KDNA_Patterns.json`.
3. Ensure the domain passes `kdna-validate`.
4. Open a PR to this repository adding an entry to `registry/domains.json`.

## Domain Example Rules

A contributed domain should include at least `KDNA_Core.json` and `KDNA_Patterns.json`, pass `kdna-lint`, avoid proprietary data, use clear boundaries, include reasons for banned terms, and include key distinctions for misunderstandings.
