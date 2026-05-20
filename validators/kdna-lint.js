#!/usr/bin/env node
/**
 * kdna-lint — Structural and content validation for KDNA domains.
 *
 * Uses @aikdna/kdna-core lintDomain for pure validation logic,
 * handles file I/O here.
 */

const fs = require('fs');
const path = require('path');
const { lintDomain } = require('@aikdna/kdna-core');

const domainDir = process.argv[2];
if (!domainDir || domainDir === '--help' || domainDir === '-h') {
  console.log(`kdna-lint — Structural and content validation for KDNA domains.

Usage: kdna-lint <domain-folder>

Runs lint checks on KDNA_*.json files for structure, content, and consistency.

Options:
  -h, --help    Show this help message`);
  process.exit(domainDir ? 0 : 2);
}

if (!fs.existsSync(domainDir) || !fs.statSync(domainDir).isDirectory()) {
  console.error(`Not a directory: ${domainDir}`);
  process.exit(2);
}

// Read all KDNA JSON files in the domain directory
const files = fs.readdirSync(domainDir).filter((f) => f.endsWith('.json') && f !== 'kdna.json');
const dataMap = {};
for (const f of files) {
  try {
    dataMap[f] = JSON.parse(fs.readFileSync(path.join(domainDir, f), 'utf8'));
  } catch (e) {
    // lintDomain will report missing required files; skip unparseable here
  }
}

const result = lintDomain(dataMap);

if (result.warnings.length) {
  console.log('Warnings:');
  result.warnings.forEach((w) => console.log(`  - ${w}`));
}
if (result.errors.length) {
  console.error('Errors:');
  result.errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log(`✓ KDNA domain valid: ${domainDir}`);
