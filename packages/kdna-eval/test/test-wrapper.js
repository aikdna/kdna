#!/usr/bin/env node
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
  console.error(`\n=== ${label} ===`);
  const result = spawnSync(process.execPath, ["--test", file], {
    stdio: "inherit",
    cwd: path.resolve(__dirname, "..")
  });
  if (result.status !== 0) {
    allPassed = false;
    console.error(`FAIL: ${label}`);
  }
}

console.error(`\n=== smoke-esm.mjs ===`);
const esmResult = spawnSync(process.execPath, [path.join(testDir, "smoke-esm.mjs")], {
  stdio: "inherit",
  cwd: path.resolve(__dirname, "..")
});
if (esmResult.status !== 0) allPassed = false;

if (!allPassed) process.exit(1);
console.log("\nAll kdna-eval tests passed.");
