#!/usr/bin/env node
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { KDNAAgent } from "./agent.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const domainPath = resolve(process.argv[2] || join(__dirname, "..", "..", "decision_state"));
  const agent = new KDNAAgent(domainPath);
  const input = `Team discussed the Q3 budget. Everyone agreed marketing needs more spend.
No specific amount was decided. No owner assigned to draft the revised budget.`;

  const result = await agent.judge(input, async () => {
    return "Classification: UNRESOLVED. Missing owner and explicit choice.";
  });

  console.log("KDNA Agent Demo");
  console.log(`Domain loaded: ${result.pre_filter.domain_loaded}`);
  console.log(`Passed: ${result.passed}`);
  console.log(`Signals: ${result.pre_filter.signals_detected.length}`);
  console.log(`Self-check failures: ${result.post_validate.self_checks_failed.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
