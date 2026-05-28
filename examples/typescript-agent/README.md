# @aikdna/agent

KDNA Agent SDK - pre/post judgment guardrails for AI agents.

## Install

```bash
npm install @aikdna/agent
```

## Usage

```ts
import { KDNAAgent } from "@aikdna/agent";

const agent = new KDNAAgent("/path/to/.kdna/domains");

const result = await agent.judge("Meeting transcript...", async (systemPrompt, input) => {
  return await yourLLM.complete({ system: systemPrompt, user: input });
});

console.log(result.passed);
console.log(result.pre_filter);
console.log(result.post_validate);
```

## API

- `new KDNAAgent(domainDir)` loads a single KDNA domain directory or a parent directory containing multiple domains.
- `agent.systemPrompt()` returns KDNA judgment context for injection into an LLM system message.
- `agent.preFilter(input)` screens input for local banned terms and domain signals before an LLM call.
- `agent.postValidate(response)` checks an LLM response against self-checks, banned terms, and known misunderstandings.
- `agent.judge(input, llmCallFn)` runs pre-filter, calls your LLM function, then post-validates the response.

## Package Boundary

This SDK depends on `@aikdna/kdna-core` for KDNA loading and rendering. It does not depend on the legacy `@aikdna/kdna` CLI compatibility package.
