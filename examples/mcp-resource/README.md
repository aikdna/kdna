# KDNA as MCP Resource Example

Shows how KDNA dev source workspaces can be served as MCP (Model Context Protocol) Resources, making judgment cognition available to any MCP-compatible client.

## Core Principle

> **KDNA is a Resource, not a Tool.**
>
> - **Resources** provide context and knowledge (what the model should know)
> - **Tools** perform actions (what the model can do)
> - KDNA provides judgment context. It does not take actions.
> - KDNA enriches tools. It does not compete with them.

## Architecture

```
┌─────────────────┐     MCP Protocol      ┌─────────────────┐
│   MCP Client    │ ◄──────────────────► │  KDNA Resource  │
│ (Claude/Cursor) │   resources/list      │     Server      │
│                 │   resources/read      │                 │
└────────┬────────┘                       └─────────────────┘
         │
         ▼
┌─────────────────┐
│  LLM with KDNA  │
│  context loaded │
└─────────────────┘
```

## Files

- `server.py` — Conceptual MCP resource server exposing KDNA domains
- `client.py` — Client demonstrating resource discovery and consumption

## Run

```bash
# Server demo (lists resources, reads domain, builds judgment prompts)
python server.py

# Client demo (shows integration pattern)
python client.py
```

## What it demonstrates

| Without KDNA Resource | With KDNA Resource |
|---|---|
| LLM reasons from base training | LLM reasons from domain-specific expert judgment |
| Each session starts from zero | KDNA context is loaded as a resource at session start |
| No version tracking | Resource has version, can be updated independently |
| Generic responses | Domain-calibrated classification and self-checks |

## Integration Pattern

```python
# 1. Discover available KDNA resources
resources = mcp_client.list_resources()
# -> [kdna://decision_state, kdna://sales, ...]

# 2. Read the resource
resource = mcp_client.read_resource("kdna://decision_state")
context = resource["context"]

# 3. Inject into system prompt
system_prompt = f"You are an expert. Use this framework:\n\n{context}"

# 4. Use in conversation
response = llm.chat(system=system_prompt, user=user_input)
```

## Real Implementation

For a production MCP server, use the official SDK:

```bash
pip install mcp
```

Then implement `ListResourcesRequest` and `ReadResourceRequest` handlers that delegate to `KDNAResourceServer`.

See: https://github.com/modelcontextprotocol/python-sdk
