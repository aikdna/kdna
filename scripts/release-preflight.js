#!/usr/bin/env node

const { execFileSync } = require('child_process');

const checks = [
  ['npm', ['run', 'format:check']],
  ['npm', ['run', 'validate:protocol-fixtures']],
  ['npm', ['run', 'lint']],
  ['npm', ['run', 'conformance']],
  ['npm', ['test']],
  ['git', ['diff', '--check']],
];

for (const [command, args] of checks) {
  console.log(`\n$ ${command} ${args.join(' ')}`);
  execFileSync(command, args, { stdio: 'inherit' });
}

console.log('\nKDNA protocol release preflight passed');
