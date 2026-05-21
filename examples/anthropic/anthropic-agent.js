/**
 * KDNA + Anthropic — 10-minute integration example.
 *
 * Usage:
 *   1. npm install @aikdna/kdna @anthropic-ai/sdk
 *   2. export ANTHROPIC_API_KEY=sk-ant-...
 *   3. node anthropic-agent.js
 */

import Anthropic from "@anthropic-ai/sdk";
import { loadDomain, formatContext } from "@aikdna/kdna";

const client = new Anthropic();

async function main() {
  // 1. Load a KDNA domain
  const domain = loadDomain("./domains/decision_state", { mode: "all" });
  if (!domain) {
    console.error("Domain not found. Run: kdna install decision_state");
    process.exit(1);
  }

  // 2. Format domain cognition into agent context
  const kdnaContext = formatContext(domain);

  // 3. Use it as system prompt
  const input = `Meeting notes: "Team discussed Q3 priorities. Marketing wants more budget for the launch campaign. Engineering said the timeline is tight. No decisions were recorded. Next steps TBD."`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 400,
    system: `You are an expert meeting analyst. Use this domain cognition framework:\n\n${kdnaContext}`,
    messages: [{ role: "user", content: input }],
  });

  console.log("=== With KDNA (Anthropic) ===");
  console.log(response.content[0]?.text);

  // 4. Baseline without KDNA
  const baseline = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 400,
    system: "You are an expert meeting analyst.",
    messages: [{ role: "user", content: input }],
  });

  console.log("\n=== Without KDNA ===");
  console.log(baseline.content[0]?.text);
}

main().catch(console.error);
