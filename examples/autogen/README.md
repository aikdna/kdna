# KDNA + AutoGen Example

Integrate KDNA domain cognition into a Microsoft AutoGen multi-agent conversation system.

## Overview

This example shows how KDNA serves as a **shared judgment layer** across multiple AutoGen conversable agents:

1. **Classifier** — Classifies input into UNRESOLVED / CONDITIONAL / INTENTIONAL_DEFERRAL / EXECUTABLE_DECISION
2. **Validator** — Checks for missing elements, detects misunderstandings, flags false actionization
3. **Recommender** — Recommends safe next steps based on classification

All agents reference the same KDNA `decision_state` domain cognition loaded into their system messages.

## Setup

```bash
pip install -r requirements.txt
```

Or install from local Python SDK:

```bash
pip install ../../python-sdk
pip install pyautogen anthropic
```

## Run

```bash
export ANTHROPIC_API_KEY=your-key
python agent.py
```

## What it demonstrates

| Without KDNA | With KDNA |
|---|---|
| Agents reason independently | All agents share same axioms and frameworks |
| No structured classification | Classifier uses AX-001–AX-005, FW-001–FW-003 |
| No validation layer | Validator checks for MS-001–MS-005 misunderstandings |
| Generic recommendations | Recommender respects decision-state boundaries |

## Key pattern

```python
from kdna import load_dev_source, format_context
import autogen

# Load KDNA once
domain = load_dev_source("./decision_state", mode="all")
context = format_context(domain)

# Inject into each agent's system_message
classifier = autogen.ConversableAgent(
    name="classifier",
    system_message=f"You are a classifier. Use this framework:\n\n{context}",
    ...
)
```

## Structure

- `agent.py` — AutoGen group chat with 3 KDNA-loaded agents
- `requirements.txt` — Python dependencies
