#!/usr/bin/env node
import { KDNAAgent } from "./agent.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function main(): void {
  console.log("=".repeat(60));
  console.log("KDNA TypeScript Custom Agent Demo");
  console.log("=".repeat(60));

  const domainPath = join(__dirname, "..", "..", "examples", "decision_state");
  const agent = new KDNAAgent(domainPath);

  console.log("\nLoaded domain: decision_state");
  console.log(`Context size: ${agent.systemPrompt().length} chars`);
  console.log();

  const scenarios = [
    `Team discussed the Q3 budget. Everyone agreed marketing needs more spend.
    No specific amount was decided. No owner assigned to draft the revised budget.`,

    `Decision: Migrate payment API to Stripe. Owner: Alex. Action: implement webhook handlers.
    Deadline: June 15. Contingent on security review completion by June 10.`,

    `Sprint retrospective identified deployment issues. Tech lead said: 'We should look into CI/CD improvements.
    Let's revisit next sprint.' No owner, no date, no specific improvements listed.`,
  ];

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    console.log(`\n--- Scenario ${i + 1} ---`);
    console.log(scenario.trim().slice(0, 100) + "...");
    console.log();

    const result = agent.analyze(scenario);

    console.log(`Classification: ${result.classification}`);
    console.log(
      `Missing: ${result.missing_elements.length > 0 ? result.missing_elements.join(", ") : "None"}`,
    );
    console.log(
      `Misunderstandings: ${result.misunderstandings_detected.length > 0 ? result.misunderstandings_detected.join("; ") : "None detected"}`,
    );
    console.log(`Recommendation: ${result.recommended_action}`);
    console.log("-".repeat(40));
  }

  console.log("\n=== History ===");
  for (const entry of agent.history) {
    console.log(`Input: ${entry.input.slice(0, 50)}...`);
    console.log(`  -> ${entry.result.classification}`);
  }
}

main();
