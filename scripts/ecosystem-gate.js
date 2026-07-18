#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const manifest = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'ecosystem-manifest.json'), 'utf8'),
);
const npmCacheDir = path.join(repoRoot, '.npm-cache', 'ecosystem-gate');
const swiftModuleCache = path.join(os.tmpdir(), 'kdna-core-swift-ecosystem-gate-module-cache');
const failures = [];

function section(title) {
  console.log(`\n=== ${title} ===`);
}

function fail(label, message) {
  failures.push(`${label}: ${message}`);
  console.error(`FAIL ${label}: ${message}`);
}

function run(label, cwd, command, args, options = {}) {
  if (!fs.existsSync(cwd)) {
    fail(label, `missing directory ${cwd}`);
    return;
  }
  console.log(`$ ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: 'inherit',
    env: { ...process.env, npm_config_cache: npmCacheDir, ...(options.env || {}) },
  });
  if (result.error) {
    fail(label, result.error.message);
    return;
  }
  if (result.status !== 0) {
    fail(label, `exited ${result.status}`);
  }
}

function runCaptured(label, cwd, command, args, options = {}) {
  if (!fs.existsSync(cwd)) {
    fail(label, `missing directory ${cwd}`);
    return;
  }
  console.log(`$ ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, npm_config_cache: npmCacheDir, ...(options.env || {}) },
  });
  if (result.error) {
    fail(label, result.error.message);
    return;
  }
  if (result.status !== 0) {
    if (result.stderr) process.stderr.write(result.stderr);
    fail(label, `exited ${result.status}`);
    return;
  }
  console.log(
    `PASS ${label}: captured ${Buffer.byteLength(result.stdout || '', 'utf8')} stdout byte(s)`,
  );
}

function packFiles(cwd) {
  const result = spawnSync('npm', ['pack', '--dry-run', '--json'], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, npm_config_cache: npmCacheDir },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `npm pack exited ${result.status}`);
  }
  const parsed = JSON.parse(result.stdout);
  return new Set((parsed[0] && parsed[0].files ? parsed[0].files : []).map((file) => file.path));
}

function assertPack(label, cwd, checks) {
  try {
    const files = packFiles(cwd);
    for (const required of checks.required || []) {
      if (!files.has(required)) fail(label, `tarball missing ${required}`);
    }
    for (const forbiddenPattern of checks.forbidden || []) {
      for (const file of files) {
        if (forbiddenPattern.test(file)) fail(label, `tarball includes forbidden file ${file}`);
      }
    }
    console.log(`PASS ${label}: ${files.size} tarball file(s) checked`);
  } catch (error) {
    fail(label, error.message);
  }
}

function componentPath(repository) {
  const component = manifest.components.find((entry) => entry.repository === repository);
  if (!component || !component.local_path) return null;
  const localPath = path.resolve(repoRoot, component.local_path);
  if (fs.existsSync(localPath)) return localPath;

  const repoName = repository.split('/').pop();
  const envRoot = process.env.KDNA_ECOSYSTEM_REPOS_ROOT;
  if (envRoot) {
    const envPath = path.resolve(envRoot, repoName);
    if (fs.existsSync(envPath)) return envPath;
  }

  const ciPath = path.join(repoRoot, '.ecosystem-repos', repoName);
  if (fs.existsSync(ciPath)) return ciPath;

  return localPath;
}

function referenceAssetComponents() {
  return manifest.components.filter((entry) => entry.artifact_path);
}

section('Core Repo Gates');
run('kdna npm test', repoRoot, 'npm', ['test']);
run('kdna validate:examples', repoRoot, 'npm', ['run', 'validate:examples']);
run('kdna validate:ecosystem-manifest', repoRoot, 'npm', ['run', 'validate:ecosystem-manifest']);
run('kdna validate:public-truth', repoRoot, 'npm', ['run', 'validate:public-truth']);
run('kdna production npm audit', repoRoot, 'npm', ['audit', '--omit=dev']);
run(
  'python adapter pytest against current CLI',
  path.join(repoRoot, 'python-sdk'),
  process.env.KDNA_PYTHON || 'python3',
  ['-m', 'pytest', 'tests', '-q'],
  {
    env: {
      KDNA_CLI: path.join(repoRoot, 'node_modules', '.bin', 'kdna'),
      PYTHONPATH: path.join(repoRoot, 'python-sdk'),
    },
  },
);

section('Cross Repo Package Tests');
run('kdna-cli fresh npm ci', componentPath('aikdna/kdna-cli'), 'npm', ['ci']);
run('kdna-cli production npm audit', componentPath('aikdna/kdna-cli'), 'npm', [
  'audit',
  '--omit=dev',
]);
run(
  'kdna-skills mcp fresh npm ci',
  path.join(componentPath('aikdna/kdna-skills'), 'mcp-server'),
  'npm',
  ['ci'],
);
run(
  'kdna-skills mcp production npm audit',
  path.join(componentPath('aikdna/kdna-skills'), 'mcp-server'),
  'npm',
  ['audit', '--omit=dev'],
);
run('kdna-studio-core fresh npm ci', componentPath('aikdna/kdna-studio-core'), 'npm', ['ci']);
run('kdna-studio-core production npm audit', componentPath('aikdna/kdna-studio-core'), 'npm', [
  'audit',
  '--omit=dev',
]);
run('kdna-studio-cli fresh npm ci', componentPath('aikdna/kdna-studio-cli'), 'npm', ['ci']);
run('kdna-studio-cli production npm audit', componentPath('aikdna/kdna-studio-cli'), 'npm', [
  'audit',
  '--omit=dev',
]);
run('kdna-cli npm test', componentPath('aikdna/kdna-cli'), 'npm', ['test']);
run(
  'kdna-skills mcp npm test',
  path.join(componentPath('aikdna/kdna-skills'), 'mcp-server'),
  'npm',
  ['test'],
);
run('kdna-studio-core npm test', componentPath('aikdna/kdna-studio-core'), 'npm', ['test']);
run('kdna-studio-cli npm test', componentPath('aikdna/kdna-studio-cli'), 'npm', ['test']);
run(
  'kdna-core-swift fixed conformance swift test',
  componentPath('aikdna/kdna-core-swift'),
  'swift',
  ['test', '--disable-sandbox', '-Xcc', `-fmodules-cache-path=${swiftModuleCache}`],
  {
    env: {
      KDNA_CONFORMANCE_ROOT: repoRoot,
      CLANG_MODULE_CACHE_PATH: swiftModuleCache,
    },
  },
);

section('Legacy Proof Asset Release Artifacts');
const kdnaBin = path.join(repoRoot, 'packages', 'kdna', 'bin', 'kdna.js');
for (const component of referenceAssetComponents()) {
  const assetRoot = componentPath(component.repository);
  run(`${component.repository} validate release artifact`, assetRoot, 'node', [
    kdnaBin,
    'validate',
    component.artifact_path,
  ]);
  run(`${component.repository} plan release artifact load`, assetRoot, 'node', [
    kdnaBin,
    'plan-load',
    component.artifact_path,
  ]);
  runCaptured(`${component.repository} load release artifact`, assetRoot, 'node', [
    kdnaBin,
    'load',
    component.artifact_path,
    '--profile=compact',
    '--as=prompt',
  ]);
}

section('Tarball Allowlist Checks');
assertPack('@aikdna/kdna-core', path.join(repoRoot, 'packages', 'kdna-core'), {
  required: ['LICENSE', 'NOTICE', 'src/container/index.js', 'src/container/index.mjs'],
  forbidden: [/\.bak$/, /\.tgz$/],
});
assertPack('@aikdna/kdna-cli', componentPath('aikdna/kdna-cli'), {
  required: ['LICENSE', 'NOTICE', 'src/cli.js'],
  forbidden: [/\.bak$/, /\.tgz$/],
});
assertPack(
  '@aikdna/kdna-mcp-server',
  path.join(componentPath('aikdna/kdna-skills'), 'mcp-server'),
  {
    required: ['LICENSE', 'NOTICE', 'bin/kdna-mcp.mjs'],
    forbidden: [/\.bak$/, /\.tgz$/],
  },
);

if (failures.length > 0) {
  console.error('\nEcosystem gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('\nEcosystem gate passed.');
