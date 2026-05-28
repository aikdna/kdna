#!/usr/bin/env node

const { execFileSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const coreDir = path.join(root, 'packages', 'kdna-core');
const requiredCoreFiles = [
  'schema/kdna-manifest-v1rc.json',
  'schema/kdna-file.schema.json',
  'schema/KDNA_Core.schema.json',
  'src/asset-reader.js',
  'src/index.js',
  'src/types.d.ts',
];

const stdout = execFileSync('npm', ['pack', '--dry-run', '--json'], {
  cwd: coreDir,
  env: {
    ...process.env,
    npm_config_cache: process.env.npm_config_cache || '/private/tmp/kdna-npm-cache',
    NPM_CONFIG_CACHE: process.env.NPM_CONFIG_CACHE || '/private/tmp/kdna-npm-cache',
  },
  encoding: 'utf8',
});

const pack = JSON.parse(stdout)[0];
const files = new Set((pack.files || []).map((file) => file.path));
const missing = requiredCoreFiles.filter((file) => !files.has(file));

if (missing.length) {
  missing.forEach((file) => console.error(`Missing from @aikdna/kdna-core pack: ${file}`));
  process.exit(1);
}

console.log(`Core pack contents valid: ${pack.entryCount} files`);
