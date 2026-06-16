# Conformance Fixtures

> **Status: Phase 1 placeholder.**

Conformance fixtures are `.kdna` files used to test loaders, validators, and packers. They live under [`fixtures/`](../../fixtures/) in this repository.

Fixtures include:

- minimal valid assets
- assets with optional fields populated
- assets with intentionally invalid manifests (for negative testing)
- assets with signature, digest, and load contract variations

Phase 1 only ships the minimal valid example. Negative fixtures and signature variants are reserved for later phases.
