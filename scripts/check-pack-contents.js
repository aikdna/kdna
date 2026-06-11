#!/usr/bin/env node

const { execFileSync } = require('child_process');
const os = require('os');
const path = require('path');

const root = path.join(__dirname, '..');
const coreDir = path.join(root, 'packages', 'kdna-core');
const compatDir = path.join(root, 'packages', 'kdna');
const defaultNpmCache = path.join(os.tmpdir(), 'kdna-npm-cache');
// Schema files moved to repo-root schema/ — no longer in npm package
const requiredCoreFiles = [
  'src/asset-reader.js',
  'src/index.js',
  'src/types.d.ts',
];
const requiredCompatFiles = [
  'bin/kdna.js',
  'bin/kdna-lint.js',
  'bin/kdna-validate.js',
  'README.md',
];

function pack(cwd) {
  return execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd,
    env: {
      ...process.env,
      npm_config_cache: process.env.npm_config_cache || defaultNpmCache,
      NPM_CONFIG_CACHE: process.env.NPM_CONFIG_CACHE || defaultNpmCache,
    },
    encoding: 'utf8',
  });
}

function checkPackage(label, cwd, requiredFiles) {
  const stdout = pack(cwd);
  const packResult = JSON.parse(stdout)[0];
  const files = new Set((packResult.files || []).map((file) => file.path));
  const missing = requiredFiles.filter((file) => !files.has(file));

  if (missing.length) {
    missing.forEach((file) => console.error(`Missing from ${label} pack: ${file}`));
    process.exit(1);
  }

  console.log(`${label} pack contents valid: ${packResult.entryCount} files`);
}

checkPackage('@aikdna/kdna-core', coreDir, requiredCoreFiles);
checkPackage('@aikdna/kdna', compatDir, requiredCompatFiles);
