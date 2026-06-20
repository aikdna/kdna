#!/usr/bin/env node

const { execFileSync } = require('child_process');

const checks = [
  ['npm', ['run', 'format:check']],
  ['npm', ['run', 'validate:protocol-fixtures']],
  ['npm', ['run', 'lint']],
  ['npm', ['run', 'conformance']],
  ['npm', ['test']],
  ['npm', ['--prefix', 'examples/typescript-agent', 'ci']],
  ['npm', ['--prefix', 'examples/typescript-agent', 'test']],
  ['npm', ['run', 'check:pack']],
  ['npm', ['run', 'release:evidence']],
  ['git', ['diff', '--check']],
];

for (const [command, args] of checks) {
  console.log(`\n$ ${command} ${args.join(' ')}`);
  execFileSync(command, args, { stdio: 'inherit' });
}

console.log('\nKDNA protocol release preflight passed');
