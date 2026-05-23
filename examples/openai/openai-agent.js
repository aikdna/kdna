/**
 * KDNA + OpenAI — 10-minute integration example.
 *
 * Usage:
 *   1. npm install @aikdna/kdna-core openai
 *   2. export OPENAI_API_KEY=sk-...
 *   3. node openai-agent.js
 */

import OpenAI from "openai";
import { loadDomain, formatContext } from "@aikdna/kdna-core";

const client = new OpenAI();

async function main() {
  // 1. Load a KDNA domain
  const domain = loadDomain("./domains/writing", { mode: "all" });
  if (!domain) {
    console.error("Domain not found. Run: kdna install writing");
    process.exit(1);
  }

  // 2. Format domain cognition into agent context
  const kdnaContext = formatContext(domain);

  // 3. Use it as system prompt context
  const task =
    'Write a product announcement for "FlowState", ' +
    "a new focus timer app. Keep it under 100 words.";

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          `You are an expert editor. Use the following domain cognition framework to evaluate and generate content:\n\n${kdnaContext}`,
      },
      { role: "user", content: task },
    ],
  });

  console.log("=== With KDNA ===");
  console.log(response.choices[0]?.message?.content);

  // 4. Compare: same task without KDNA
  const baseline = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are an expert editor." },
      { role: "user", content: task },
    ],
  });

  console.log("\n=== Without KDNA ===");
  console.log(baseline.choices[0]?.message?.content);
}

main().catch(console.error);
