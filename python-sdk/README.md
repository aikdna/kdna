# KDNA Python SDK

Load KDNA cognition assets in Python.

This SDK currently exposes a developer source-tree loader. Canonical installed
assets are `.kdna` files; production runtimes should prefer the CLI/core
asset reader path until native Python `.kdna` asset loading is added.

## Install

```bash
pip install kdna
```

## Quickstart

```python
from kdna import load_dev_source, format_context

# Load a dev source workspace
domain = load_dev_source("./sales-source")

# Format for agent context
context = format_context(domain)
print(context)
```

## Load Modes

```python
# Minimum: Core + Patterns only
domain = load_dev_source("./sales-source", mode="minimum")

# All: load all 6 files
domain = load_dev_source("./sales-source", mode="all")

# Auto: load based on input signals
domain = load_dev_source("./sales-source", mode="auto")
```

## Use with LLM

```python
from kdna import load_dev_source, format_context
import openai

domain = load_dev_source("./sales-source")
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

### `load_dev_source(source_dir, mode="minimum")`

Load a non-canonical KDNA dev source workspace.

- `source_dir`: Path to the dev source folder
- `mode`: `"minimum"`, `"all"`, or `"auto"`
- Returns: `dict` with `core`, `patterns`, and optional files

### `format_context(domain)`

Format a loaded domain into agent-readable text.

- `domain`: Result from `load_dev_source()`
- Returns: Formatted context string

### `classify_input(text)`

Classify input text to detect scenario/reasoning/case/evolution signals.

- `text`: Input string
- Returns: List of detected signal types
