#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const testDir = __dirname;
const testFiles = fs.readdirSync(testDir)
  .filter(f => f.endsWith('.test.js'))
  .map(f => path.join(testDir, f))
  .join(' ');

function tryFlags(flags) {
  try {
    execSync(`node ${flags} ${testFiles}`, { stdio: 'inherit' });
    return true;
  } catch (e) {
    return false;
  }
}

const passed = tryFlags('--test') || tryFlags('--experimental-test-runner --test');

if (!passed) {
  process.exit(1);
}
