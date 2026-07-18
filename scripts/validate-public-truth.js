#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const manifest = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'ecosystem-manifest.json'), 'utf8'),
);
const failures = [];

function fail(label, message) {
  failures.push(`${label}: ${message}`);
  console.error(`FAIL ${label}: ${message}`);
}

function component(repository) {
  return manifest.components.find((entry) => entry.repository === repository);
}

function componentPath(repository) {
  const entry = component(repository);
  if (!entry || !entry.local_path) return null;
  if (entry.local_path === '.') return repoRoot;

  const repoName = repository.split('/').pop();
  const envRoot = process.env.KDNA_ECOSYSTEM_REPOS_ROOT;
  if (envRoot) {
    const envPath = path.resolve(envRoot, repoName);
    if (fs.existsSync(envPath)) return envPath;
  }

  const localPath = path.resolve(repoRoot, entry.local_path);
  if (fs.existsSync(localPath)) return localPath;

  const ciPath = path.join(repoRoot, '.ecosystem-repos', repoName);
  if (fs.existsSync(ciPath)) return ciPath;

  return null;
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function packageVersion(repository) {
  const entry = component(repository);
  return entry && entry.current_version;
}

function checkVSCodeBoundary() {
  const vscode = component('aikdna/kdna-vscode');
  const vscodeRoot = componentPath('aikdna/kdna-vscode');
  if (!vscode || !vscodeRoot) return;

  const pkg = readJson(path.join(vscodeRoot, 'package.json'));
  const coreRange = (pkg.dependencies && pkg.dependencies['@aikdna/kdna-core']) || null;
  const currentCoreVersion = packageVersion('aikdna/kdna');
  if (coreRange && !coreRange.includes(currentCoreVersion) && vscode.lifecycle !== 'Legacy') {
    fail(
      'aikdna/kdna-vscode',
      'VS Code depends on an old kdna-core version but is not marked Legacy',
    );
  }
  if (vscode.lifecycle === 'Legacy') {
    if (Array.isArray(vscode.supported_access_modes) && vscode.supported_access_modes.length > 0) {
      fail('aikdna/kdna-vscode', 'Legacy VS Code must not advertise supported access modes');
    }
    if (!vscode.legacy_replacement) {
      fail('aikdna/kdna-vscode', 'Legacy VS Code must declare a legacy_replacement');
    }
  }
}

function checkRetiredNpmBoundaries() {
  const retired = [
    ['@aikdna/agent', 'examples/typescript-agent/package.json'],
    ['@aikdna/kdna-artifact-engine', 'packages/artifact-engine/package.json'],
    ['@aikdna/kdna-fidelity-core', 'packages/fidelity-core/package.json'],
  ];
  const workflow = readText(path.join(repoRoot, '.github', 'workflows', 'publish.yml'));
  const evidenceGenerator = readText(
    path.join(repoRoot, 'scripts', 'generate-release-evidence.js'),
  );
  const maintenance = readText(path.join(repoRoot, 'docs', 'open-source-maintenance-baseline.md'));
  const statusMatrix = readText(path.join(repoRoot, 'docs', 'tool-status-matrix.md'));
  const core = component('aikdna/kdna');
  const limitations = Array.isArray(core?.known_limitations)
    ? core.known_limitations.join('\n')
    : '';

  for (const [coordinate, packagePath] of retired) {
    const pkg = readJson(path.join(repoRoot, packagePath));
    if (pkg.name !== coordinate || pkg.private !== true) {
      fail(coordinate, 'retired package source must keep its exact identity and be private');
    }
    for (const script of ['prepublishOnly', 'release:check', 'release:evidence:check']) {
      if (pkg.scripts && Object.prototype.hasOwnProperty.call(pkg.scripts, script)) {
        fail(coordinate, `retired package must not expose ${script}`);
      }
    }
    for (const [label, text] of [
      ['publish workflow', workflow],
      ['release evidence generator', evidenceGenerator],
    ]) {
      if (text.includes(coordinate)) fail(coordinate, `${label} still exposes publication`);
    }
    if (!maintenance.includes(coordinate) || !statusMatrix.includes(coordinate)) {
      fail(coordinate, 'retired lifecycle is missing from current public status documentation');
    }
    if (!limitations.includes(coordinate)) {
      fail(coordinate, 'ecosystem manifest does not classify the co-located legacy coordinate');
    }
  }
}

checkVSCodeBoundary();
checkRetiredNpmBoundaries();

if (failures.length > 0) {
  console.error(`public truth validation failed: ${failures.length} failure(s)`);
  process.exit(1);
}

console.log('public truth validation passed');
