# KDNA + LangGraph Example

Integrate KDNA domain cognition into a LangGraph agent for decision-state judgment.

## Overview

This example shows how to use KDNA as the **judgment layer** in a LangGraph workflow:

1. **Load Node** — loads KDNA `decision_state` domain
2. **Classify Node** — uses KDNA context to classify meeting notes / decisions
3. **Judge Node** — applies KDNA axioms, checks for misunderstandings, runs self-checks
4. **Action Node** — recommends next steps based on classification

## Setup

```bash
pip install -r requirements.txt
```

Or install from the local Python SDK:

```bash
pip install ../../python-sdk
pip install langgraph langchain langchain-anthropic
```

## Run

```bash
python agent.py
```

## Structure

- `agent.py` — LangGraph state graph with KDNA-loaded judgment nodes
- `requirements.txt` — Python dependencies

## What it demonstrates

| Without KDNA | With KDNA |
|---|---|
| LLM summarizes what was discussed | LLM classifies whether a decision was actually made |
| May hallucinate action items | Checks for missing owner, deadline, explicit choice |
| No structured reasoning | Applies axioms (AX-001 to AX-005) and self-checks |
| No traceability | Outputs judgment trace showing which rules triggered |

## Key pattern

```python
from kdna import load_dev_source, format_context
from langgraph.graph import StateGraph

# Load KDNA domain
domain = load_dev_source("../../examples/decision_state", mode="all")
context = format_context(domain)

# Build LangGraph that uses KDNA context for judgment
builder = StateGraph(State)
builder.add_node("load_kdna", load_kdna_node)
builder.add_node("classify", classify_node)
builder.add_node("judge", judge_node)
builder.add_node("recommend", recommend_node)
```
