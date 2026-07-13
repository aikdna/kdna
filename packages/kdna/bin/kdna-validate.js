#!/usr/bin/env node
'use strict';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: kdna-validate <asset.kdna|source-dir> [--runtime] [--json]');
  console.log('Compatibility alias for: kdna validate');
  process.exit(0);
}

if (args.length === 0) {
  console.error('Usage: kdna-validate <asset.kdna|source-dir> [--runtime] [--json]');
  process.exit(2);
}

process.argv = [process.argv[0], process.argv[1], 'validate', ...args];
require('@aikdna/kdna-cli/src/cli.js');
