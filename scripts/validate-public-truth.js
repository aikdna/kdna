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

checkVSCodeBoundary();

if (failures.length > 0) {
  console.error(`public truth validation failed: ${failures.length} failure(s)`);
  process.exit(1);
}

console.log('public truth validation passed');
