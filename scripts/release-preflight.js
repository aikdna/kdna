#!/usr/bin/env node

'use strict';

const { execFileSync } = require('child_process');

const checks = [
  ['npm', ['run', 'format:check']],
  ['npm', ['run', 'validate:protocol-fixtures']],
  ['npm', ['run', 'validate:runtime-contract']],
  ['npm', ['run', 'lint']],
  ['npm', ['run', 'conformance']],
  ['npm', ['test']],
  ['npm', ['--workspace', '@aikdna/kdna', 'test']],
  ['npm', ['--prefix', 'examples/typescript-agent', 'ci']],
  ['npm', ['--prefix', 'examples/typescript-agent', 'test']],
  ['npm', ['run', 'check:pack']],
  ['npm', ['run', 'release:evidence']],
  ['git', ['diff', '--check']],
];

function runChecks(checksToRun = checks, options = {}) {
  const execute = options.execute || execFileSync;
  const logger = options.logger || console;
  for (const [command, args] of checksToRun) {
    logger.log(`\n$ ${command} ${args.join(' ')}`);
    execute(command, args, { stdio: 'inherit' });
  }
}

function main() {
  runChecks();
  console.log('\nKDNA protocol release preflight passed');
}

if (require.main === module) main();

module.exports = {
  checks,
  runChecks,
};
