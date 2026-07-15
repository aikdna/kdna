#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const container = require('../packages/kdna-core/src/container');

const repoRoot = path.resolve(__dirname, '..');
const examplesRoot = path.join(repoRoot, 'examples');
let failures = 0;
let checked = 0;

function fail(label, message) {
  failures += 1;
  console.error(`FAIL ${label}: ${message}`);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function walk(dir, visitor) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, visitor);
    else visitor(full);
  }
}

function validateContainerExample(dir) {
  checked += 1;
  const result = container.validate(dir);
  if (!result.overall_valid) {
    fail(path.relative(repoRoot, dir), result.problems.join('; '));
  }
}

function validateLegacyExample(dir) {
  checked += 1;
  const label = path.relative(repoRoot, dir);
  try {
    const manifest = readJson(path.join(dir, 'kdna.json'));
    const core = readJson(path.join(dir, 'KDNA_Core.json'));
    readJson(path.join(dir, 'KDNA_Patterns.json'));
    if (!manifest.name && !manifest.id && !manifest.domain) {
      fail(label, 'kdna.json must declare a name, id, or domain');
    }
    if (!Array.isArray(core.axioms) || core.axioms.length === 0) {
      fail(label, 'KDNA_Core.json must contain at least one axiom');
    }
    if (!core.meta || typeof core.meta !== 'object') {
      fail(label, 'KDNA_Core.json must contain meta object');
    }
  } catch (error) {
    fail(label, error.message);
  }
}

const containerDirs = new Set();
const legacyDirs = new Set();

walk(examplesRoot, (file) => {
  const base = path.basename(file);
  if (base === 'mimetype') containerDirs.add(path.dirname(file));
  if (base === 'KDNA_Core.json') legacyDirs.add(path.dirname(file));
});

for (const dir of [...containerDirs].sort()) validateContainerExample(dir);
for (const dir of [...legacyDirs].sort()) validateLegacyExample(dir);

if (checked === 0) {
  fail('examples', 'no examples were discovered');
}

if (failures > 0) {
  console.error(`Example validation failed: ${failures} failure(s), ${checked} example(s) checked`);
  process.exit(1);
}

console.log(`Example validation passed: ${checked} example(s) checked`);
