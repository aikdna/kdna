# Registry Fixture

The canonical KDNA domain registry is:

https://github.com/knowledge-dna/kdna-registry

This directory is kept in the protocol repository only as a fixture for CLI, docs, and validator development. It must not become the official domain package catalog.

Rules:

- Do not add first-wave or official public domains here.
- Do not point registry entries to `KDNA/examples/*` as official packages.
- Domain packages must live in standalone repositories named `kdna-<domain>`.
- Changes to the public registry belong in `knowledge-dna/kdna-registry`.
