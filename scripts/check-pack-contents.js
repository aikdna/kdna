#!/usr/bin/env node

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.join(__dirname, '..');
const coreDir = path.join(root, 'packages', 'kdna-core');
const compatDir = path.join(root, 'packages', 'kdna');
const defaultNpmCache = path.join(os.tmpdir(), 'kdna-npm-cache');
// The published Core surface is the reviewed member allowlist, not a hand-kept
// subset: the pack must equal it member for member, so a retired member that is
// still demanded and an unreviewed member that slipped into `files` both fail
// here. scripts/pack-allowlists.json carries the accepted archive hash.
const packAllowlists = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'pack-allowlists.json'), 'utf8'),
);
const corePackAllowlist = packAllowlists.packages['@aikdna/kdna-core'];
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

function checkPackage(label, cwd, { required = [], exact = null } = {}) {
  const stdout = pack(cwd);
  const packResult = JSON.parse(stdout)[0];
  const files = new Set((packResult.files || []).map((file) => file.path));
  const findings = [];
  for (const file of required) {
    if (!files.has(file)) findings.push(`Missing from ${label} pack: ${file}`);
  }
  if (exact) {
    const expected = new Set(exact);
    for (const file of [...expected].sort()) {
      if (!files.has(file)) findings.push(`Missing from ${label} pack: ${file}`);
    }
    for (const file of [...files].sort()) {
      if (!expected.has(file)) findings.push(`Unreviewed member in ${label} pack: ${file}`);
    }
  }

  if (findings.length) {
    findings.forEach((finding) => console.error(finding));
    process.exit(1);
  }

  console.log(`${label} pack contents valid: ${packResult.entryCount} files`);
}

checkPackage('@aikdna/kdna-core', coreDir, {
  required: ['LICENSE', 'NOTICE'],
  exact: corePackAllowlist.members,
});
checkPackage('@aikdna/kdna', compatDir, { required: requiredCompatFiles });
