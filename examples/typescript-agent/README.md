# KDNA TypeScript Custom Agent Example

A minimal TypeScript agent that uses KDNA domain cognition for judgment.

## Setup

```bash
npm install
npm run build
```

## Run

```bash
npm run demo
```

## What it shows

- `loadDomain()` — load a KDNA domain package
- `formatContext()` — format domain into agent-readable context
- `classifyInput()` — detect signals in user input
- `KDNAAgent` class — framework-agnostic agent with KDNA-loaded judgment

## Structure

- `src/agent.ts` — `KDNAAgent` class with `analyze()` method
- `src/index.ts` — demo runner with 3 scenarios

## Use in your project

```typescript
import { loadDomain, formatContext } from "@aikdna/kdna";

const domain = loadDomain("./my-domain", { mode: "all" });
const context = domain ? formatContext(domain) : "";

// Inject into your LLM system prompt
const systemPrompt = `You are an expert. Use this framework:\n\n${context}`;
```
