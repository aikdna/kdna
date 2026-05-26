# KDNA + LangChain Example

Integrate KDNA domain cognition into a LangChain pipeline for decision-state judgment.

## Overview

This example shows two LangChain chains side by side:

1. **Naive chain** — no KDNA loaded. Generic system prompt. Produces summaries.
2. **KDNA chain** — loads `decision_state` domain. Injects axioms, frameworks, and self-checks into system prompt. Produces structured judgment.

## Setup

```bash
pip install -r requirements.txt
```

Or install from local Python SDK:

```bash
pip install ../../python-sdk
pip install langchain langchain-anthropic
```

## Run

```bash
export ANTHROPIC_API_KEY=your-key
python agent.py
```

## What it demonstrates

| Without KDNA | With KDNA |
|---|---|
| Summarizes what was discussed | Classifies whether a real decision was made |
| Suggests generic next steps | Checks for missing owner, deadline, explicit choice |
| No structured reasoning | Applies AX-001 through AX-005, FW-001 through FW-003 |
| "The team discussed budget. Consider following up." | "Classification: UNRESOLVED. Missing: owner, timing. Misunderstanding: Social agreement mistaken for commitment (MS-001)." |

## Key pattern

```python
from kdna import load_dev_source, format_context
from langchain_core.prompts import ChatPromptTemplate

# Load KDNA domain
domain = load_dev_source("./decision_state", mode="all")
context = format_context(domain)

# Inject into system prompt
prompt = ChatPromptTemplate.from_messages([
    ("system", f"You are an expert. Use this framework:\n\n{context}"),
    ("human", "{input}")
])

chain = prompt | llm | output_parser
```

## Structure

- `agent.py` — Two-chain comparison demo
- `requirements.txt` — Python dependencies
