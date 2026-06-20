#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function expandPattern(arg) {
  if (!arg.includes('*')) return [arg];
  const normalized = arg.split(path.sep).join('/');
  const slash = normalized.lastIndexOf('/');
  const dir = slash >= 0 ? normalized.slice(0, slash) : '.';
  const pattern = slash >= 0 ? normalized.slice(slash + 1) : normalized;
  const escaped = pattern
    .split('*')
    .map((part) => part.replace(/[|\\{}()[\]^$+?.]/g, '\\$&'))
    .join('.*');
  const re = new RegExp(`^${escaped}$`);
  return fs
    .readdirSync(dir)
    .filter((name) => re.test(name))
    .sort()
    .map((name) => path.join(dir, name));
}

const files = process.argv.slice(2).flatMap(expandPattern);
if (files.length === 0) {
  console.error('run-node-tests: no test files matched');
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--test', ...files], {
  stdio: 'inherit',
});

process.exit(result.status === null ? 1 : result.status);
