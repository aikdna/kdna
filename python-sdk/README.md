# KDNA Python Core + Adapter

This package contains two layers:

1. **`kdna.core`** — an independent Python implementation of the KDNA
   protocol containers. It parses the ZIP envelope (mimetype STORED first,
   CBOR `payload.kdnab`), validates `kdna.json` / payload / checksums against
   the protocol JSON Schemas, computes the LoadPlan decision tree, emits the
   Runtime Capsule with digest evidence, and packs authoring sources into
   deterministic byte-identical containers. It has no dependency on the JS
   toolchain.
2. **`kdna.loader`** — the existing adapter that delegates `inspect → LoadPlan
   → authorization → load → Runtime Capsule` to `@aikdna/kdna-cli` for
   applications that prefer the official JS runtime.

## Python Core

```python
from kdna.core import validate_file, plan_load_file, load_file, pack

result = validate_file("./writing.kdna")   # five gates + overall_valid
plan = plan_load_file("./writing.kdna")    # state / can_load_now / required_action
capsule = load_file("./writing.kdna", "compact")  # Runtime Capsule
pack("./authoring-source", "./writing.kdna")      # deterministic output
```

The Core is interoperable with the JS Core: a JS-packed container validates
and loads identically in Python, a Python-packed container validates and
loads identically in JS, and both packers produce byte-identical output for
the same source (same SHA-256).

## Install

The Python distribution publishes on PyPI as **`aikdna`** (the import package is
`kdna`):

```bash
python -m pip install aikdna
python -c "import kdna; print(kdna.open_kdna)"
```

> **Security note:** the `kdna` project on PyPI is unrelated to this project.
> Install only the official `aikdna` distribution from this repository.

For local development inside this repository:

```bash
cd python-sdk
python -m pip install -e ".[dev]"
python -m pytest
```

The adapter layer supports `@aikdna/kdna-cli >=0.35.0,<0.36.0` and checks the
CLI version before its first operation. Compatibility with a later pre-1.0 CLI
minor release must be verified before this range is widened. The adapter also
validates the declared `inspect` response boundary (`format_version`, `asset_id`,
`version`, and `payload`) instead of relying on the removed `kdna_version`
field.

## Adapter use

```python
from kdna import inspect_kdna, open_kdna

metadata = inspect_kdna("./writing.kdna")
capsule = open_kdna("./writing.kdna", mode="minimum")
assert capsule["type"] == "kdna.runtime-capsule"
```

Modes map to Core profiles:

- `minimum` → `compact`
- `all` → `full`
- `auto` → `compact`

The adapter fails closed when LoadPlan says `can_load_now: false`. Applications
that support licensed, account, organization, or remote assets must use the
corresponding authorization flow rather than bypassing it.

Set `KDNA_CLI` only when development or testing needs a non-global CLI command.
