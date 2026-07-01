# KDNA Python SDK

Load canonical KDNA `.kdna` cognition assets in Python.

The SDK is asset-first: public integration code should open `.kdna` files
directly. Expanded project views are supported only for authoring and debugging
tools.

## Install

```bash
pip install kdna
```

For local development from this repository:

```bash
cd python-sdk
python -m pip install -e ".[dev]"
python -m pytest
```

## Quickstart

```python
from kdna import open_kdna, inspect_kdna, verify_digest, format_context

# Inspect and load a canonical asset without persistent extraction.
# The SDK supports both legacy entry-based assets and v1 payload.kdnab assets.
info = inspect_kdna("./writing.kdna")
domain = open_kdna("./writing.kdna", mode="all")

# Format for agent context
context = format_context(domain)
print(context)
```

## Load Modes

```python
# Minimum: Core + Patterns only
domain = open_kdna("./writing.kdna", mode="minimum")

# All: load all 6 files
domain = open_kdna("./writing.kdna", mode="all")

# Auto: load based on input signals
domain = open_kdna("./writing.kdna", mode="auto")
```

## Use with LLM

```python
from kdna import open_kdna, format_context
import openai

domain = open_kdna("./writing.kdna")
context = format_context(domain)

response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[
        {"role": "system", "content": f"You are a sales expert. Use this judgment framework:\n\n{context}"},
        {"role": "user", "content": "The client says our price is too high. What should I do?"}
    ]
)
```

## API

### `open_kdna(asset_path, mode="minimum")`

Open a canonical `.kdna` asset directly.

- `asset_path`: Path to the `.kdna` file
- `mode`: `"minimum"`, `"all"`, or `"auto"`
- Returns: `dict` with `manifest`, `core`, `patterns`, optional entries, and `asset_info`
- Supports both legacy `KDNA_*.json` ZIP entries and v1 `payload.kdnab` assets.

### `inspect_kdna(asset_path)`

Inspect manifest metadata, internal entries, required-entry status, and
whole-file `asset_digest` without extracting the asset.

### `verify_digest(asset_path, expected_digest)`

Verify a `.kdna` asset against a `sha256:<hex>` digest.

### `load_dev_source(source_dir, mode="minimum")`

Developer-only helper for non-canonical source workspaces.

- `source_dir`: Path to the dev source folder
- `mode`: `"minimum"`, `"all"`, or `"auto"`
- Returns: `dict` with `core`, `patterns`, and optional files

### `format_context(domain)`

Format a loaded domain into agent-readable text.

- `domain`: Result from `open_kdna()` or `load_dev_source()`
- Returns: Formatted context string

### `classify_input(text)`

Classify input text to detect scenario/reasoning/case/evolution signals.

- `text`: Input string
- Returns: List of detected signal types
