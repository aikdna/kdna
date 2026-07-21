# @aikdna/agent (Archived)

> **Legacy / deprecated.** This directory preserves the source of the retired
> `@aikdna/agent` npm package. It is private, has no publication workflow, and
> is not part of the current KDNA toolchain. Do not start a new integration
> from this package.

For current Agent integration, use one explicit `.kdna` file through
`inspect` → `plan-load` → `load`, or integrate the current
[`@aikdna/kdna-core`](../../packages/kdna-core/) Runtime Capsule contract.
The `kdna-loader` adapter is currently Unassessed and is not a replacement for
user-approved Host attachment policy.

## Historical usage

The remaining code and examples below describe the frozen historical package;
they are retained for provenance only.

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
