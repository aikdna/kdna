#!/usr/bin/env node

const { execFileSync } = require('child_process');
const os = require('os');
const path = require('path');

const root = path.join(__dirname, '..');
const coreDir = path.join(root, 'packages', 'kdna-core');
const compatDir = path.join(root, 'packages', 'kdna');
const defaultNpmCache = path.join(os.tmpdir(), 'kdna-npm-cache');
// The Core package ships every schema needed to validate and execute its
// stable container, authorization, and Runtime contracts.
const requiredCoreFiles = [
  'src/asset-reader.js',
  'src/runtime-capsule.js',
  'src/runtime-contract.js',
  'src/remote-runtime.js',
  'src/remote-runtime.mjs',
  'src/remote-runtime.d.ts',
  'src/index.js',
  'src/types.d.ts',
  'schema/manifest.schema.json',
  'schema/payload-profile.schema.json',
  'schema/bundle-profile.schema.json',
  'schema/checksums.schema.json',
  'schema/load-contract.schema.json',
  'schema/load-plan.schema.json',
  'schema/digest-evidence.schema.json',
  'schema/runtime-capsule.schema.json',
  'schema/consumption-plan.schema.json',
  'schema/agent-host-capabilities.schema.json',
  'schema/agent-host-request.schema.json',
  'schema/agent-host-receipt.schema.json',
  'schema/judgment-trace.schema.json',
  'schema/external-grant-envelope.schema.json',
  'schema/external-key-grant.schema.json',
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
