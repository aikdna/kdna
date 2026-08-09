#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const core = require('@aikdna/kdna-core');

const target = process.argv[2];
if (!target || target === '--help' || target === '-h') {
  console.log(`kdna-lint — Fail-closed structural lint for a current KDNA source.

Usage: kdna-lint <source-folder>

Options:
  -h, --help    Show this help message`);
  process.exit(target ? 0 : 2);
}

const absolute = path.resolve(target);
if (!fs.existsSync(absolute) || !fs.statSync(absolute).isDirectory()) {
  console.error(`Not a source folder: ${absolute}`);
  process.exit(2);
}
if (typeof core.validate !== 'function') {
  console.error('Current @aikdna/kdna-core validate API is required.');
  process.exit(2);
}

try {
  const validation = core.validate(absolute);
  if (!validation || validation.overall_valid !== true || !Array.isArray(validation.problems)) {
    const problems = Array.isArray(validation?.problems) ? validation.problems : [];
    console.error('Errors:');
    for (const problem of problems.length ? problems : ['Core validation did not pass.']) {
      console.error(`  - ${problem}`);
    }
    process.exit(1);
  }
} catch (cause) {
  console.error(`Lint failed closed: ${cause.message}`);
  process.exit(1);
}

console.log(`✓ KDNA source valid: ${absolute}`);
