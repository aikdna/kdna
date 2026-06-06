#!/usr/bin/env node
/**
 * kdna-eval test wrapper
 *
 * Runs all test files under test/ with node:test.
 */

const { spawnSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const testDir = __dirname;
const files = fs
  .readdirSync(testDir)
  .filter((f) => f.endsWith(".test.js"))
  .map((f) => path.join(testDir, f));

let allPassed = true;

for (const file of files) {
  const label = path.basename(file);
  const result = spawnSync(process.execPath, ["--test", file], {
    stdio: "inherit",
    cwd: path.resolve(__dirname, "..")
  });
  if (result.status !== 0) {
    allPassed = false;
    console.error(`FAIL: ${label}`);
  }
}

if (!allPassed) {
  process.exit(1);
}

console.log("\nAll kdna-eval tests passed.");
