# KDNA Python Adapter

This source-only adapter lets Python applications use the official KDNA
toolchain without opening `.kdna` containers themselves.

It delegates to `@aikdna/kdna-cli` for:

```text
inspect → LoadPlan → authorization → load → Runtime Capsule
```

It never unzips an asset or decodes `payload.kdnab`. `open_kdna()` returns the
Runtime Capsule produced by KDNA Core.

## Install for local development

```bash
npm install -g @aikdna/kdna-cli
cd python-sdk
python -m pip install -e ".[dev]"
python -m pytest
```

This directory is not currently published as an official PyPI distribution.
Use the npm CLI/Core packages for the stable public runtime. The Python adapter
is a source-level integration preview until a separate signed release pipeline
exists.

## Use

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
