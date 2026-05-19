# KDNA Python SDK

Load KDNA domain cognition packages in Python.

## Install

```bash
pip install kdna
```

## Quickstart

```python
from kdna import load_domain, format_context

# Load a domain
domain = load_domain("./sales")

# Format for agent context
context = format_context(domain)
print(context)
```

## Load Modes

```python
# Minimum: Core + Patterns only
domain = load_domain("./sales", mode="minimum")

# All: load all 6 files
domain = load_domain("./sales", mode="all")

# Auto: load based on input signals
domain = load_domain("./sales", mode="auto")
```

## Use with LLM

```python
from kdna import load_domain, format_context
import openai

domain = load_domain("./sales")
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

### `load_domain(domain_dir, mode="minimum")`

Load a KDNA domain directory.

- `domain_dir`: Path to the domain folder
- `mode`: `"minimum"`, `"all"`, or `"auto"`
- Returns: `dict` with `core`, `patterns`, and optional files

### `format_context(domain)`

Format a loaded domain into agent-readable text.

- `domain`: Result from `load_domain()`
- Returns: Formatted context string

### `classify_input(text)`

Classify input text to detect scenario/reasoning/case/evolution signals.

- `text`: Input string
- Returns: List of detected signal types
