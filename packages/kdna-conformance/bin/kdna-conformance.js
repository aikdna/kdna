#!/usr/bin/env node
'use strict';

/*
 * KDNA conformance runner.
 *
 * Runs the asset-first KDNA conformance suite against the reference
 * implementation (@aikdna/kdna-core). A third-party implementer points this
 * runner at their own implementation to produce a pass/fail report:
 *
 *   kdna-conformance                 # run against @aikdna/kdna-core
 *   kdna-conformance --impl <module> # run against a third-party module
 *
 * The suite proves the current Container, Runtime Capsule, Consumption Plan,
 * Agent Host, and Judgment Trace contract. It does not certify that an
 * asset's judgment is correct.
 */

const path = require('node:path');

function argValue(name, fallback = null) {
  const args = process.argv.slice(2);
  const inline = args.find((arg) => arg.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const impl = argValue('--impl', '@aikdna/kdna-core');

let core;
try {
  core = require(impl);
} catch (error) {
  console.error(`Cannot load implementation module: ${impl}`);
  console.error(error.message);
  process.exit(2);
}

const { runConformance } = require('../index.js');

const report = runConformance({ core });

console.log(`KDNA conformance report — implementation: ${impl}`);
console.log(`  passed: ${report.passed}`);
console.log(`  failed: ${report.failed}`);
for (const result of report.results) {
  console.log(`  ${result.ok ? 'PASS' : 'FAIL'}: ${result.name}${result.ok ? '' : ' — ' + result.detail}`);
}

process.exit(report.failed === 0 ? 0 : 1);
