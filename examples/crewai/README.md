# KDNA + CrewAI Example

Integrate KDNA domain cognition into a CrewAI multi-agent crew for decision-state judgment.

## Overview

This example shows how KDNA serves as a **shared judgment layer** across multiple CrewAI agents:

1. **Signal Detector** — Identifies what kind of decision-state signals are present
2. **Judgment Analyst** — Applies KDNA axioms, frameworks, and self-checks (loaded with full KDNA context)
3. **Action Recommender** — Translates judgment into safe, appropriate next steps

The KDNA domain cognition is loaded once and shared with the Judgment Analyst agent as its backstory/system prompt.

## Setup

```bash
pip install -r requirements.txt
```

Or install from local Python SDK:

```bash
pip install ../../python-sdk
pip install crewai langchain-anthropic
```

## Run

```bash
export ANTHROPIC_API_KEY=your-key
python agent.py
```

## What it demonstrates

| Without KDNA | With KDNA |
|---|---|
| Each agent reasons independently | Judgment Analyst shares KDNA-loaded cognition |
| Agents may disagree on classification | All agents reference same axioms and frameworks |
| No traceability | Judgment trace shows which rules each agent applied |
| Generic multi-agent summary | Structured decision-state analysis with anti-patterns |

## Key pattern

```python
from kdna import load_dev_source, format_context
from crewai import Agent, Task, Crew

# Load KDNA once
domain = load_dev_source("./decision_state", mode="all")
context = format_context(domain)

# Inject into agent backstory
analyst = Agent(
    role="Judgment Analyst",
    backstory=f"You are an expert. Use this framework:\n\n{context}",
    ...
)
```

## Structure

- `agent.py` — CrewAI crew with 3 agents and sequential tasks
- `requirements.txt` — Python dependencies
