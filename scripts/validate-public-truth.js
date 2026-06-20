#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

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
  const localPath = path.resolve(repoRoot, entry.local_path);
  if (fs.existsSync(localPath)) return localPath;

  const repoName = repository.split('/').pop();
  const envRoot = process.env.KDNA_ECOSYSTEM_REPOS_ROOT;
  if (envRoot) {
    const envPath = path.resolve(envRoot, repoName);
    if (fs.existsSync(envPath)) return envPath;
  }

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

function requireText(label, text, expected) {
  if (!text.includes(expected)) fail(label, `missing "${expected}"`);
}

function rejectText(label, text, pattern, reason) {
  if (pattern.test(text)) fail(label, reason);
}

function packageVersion(repository) {
  const entry = component(repository);
  return entry && entry.current_version;
}

function checkWebsite() {
  const websiteRoot = componentPath('aikdna/kdna-website');
  if (!websiteRoot) {
    fail('aikdna/kdna-website', 'website local_path is not available');
    return;
  }

  const productPath = path.join(websiteRoot, 'src', 'pages', 'product.js');
  const ecosystemPath = path.join(websiteRoot, 'src', 'pages', 'ecosystem.js');
  const indexPath = path.join(websiteRoot, 'src', 'index.js');
  const registryPath = path.join(websiteRoot, 'src', 'registry-data.js');

  const product = readText(productPath);
  const ecosystem = readText(ecosystemPath);
  const index = readText(indexPath);
  const registry = readText(registryPath);

  requireText('website product', product, `@aikdna/kdna-cli@${packageVersion('aikdna/kdna-cli')}`);
  requireText(
    'website product',
    product,
    `@aikdna/kdna-mcp-server@${packageVersion('aikdna/kdna-skills')}`,
  );
  requireText(
    'website product',
    product,
    `@aikdna/kdna-studio-cli@${packageVersion('aikdna/kdna-studio-cli')}`,
  );

  for (const [label, text] of [
    ['website product', product],
    ['website ecosystem', ecosystem],
    ['website registry endpoint', index],
    ['website registry data', registry],
  ]) {
    requireText(label, text, 'plan-load');
    rejectText(
      label,
      text,
      /@aikdna\/kdna-cli@0\.25\.[01]|@aikdna\/kdna-mcp-server@0\.1\.0|@aikdna\/kdna-studio-cli@0\.5\.[23]/,
      'contains stale public package version',
    );
    rejectText(
      label,
      text,
      /registry marketplace|marketplace registry/i,
      'must not imply registry or marketplace is part of the current stable baseline',
    );
  }

  const publicDocsCheck = path.join(websiteRoot, 'scripts', 'check-public-docs.mjs');
  if (!fs.existsSync(publicDocsCheck)) {
    fail('website public docs', 'missing scripts/check-public-docs.mjs');
  } else {
    const result = spawnSync(process.execPath, [publicDocsCheck], {
      cwd: websiteRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (result.status !== 0) {
      if (result.stdout) process.stdout.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
      fail('website public docs', `check-public-docs exited ${result.status}`);
    }
  }
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

checkWebsite();
checkVSCodeBoundary();

if (failures.length > 0) {
  console.error(`public truth validation failed: ${failures.length} failure(s)`);
  process.exit(1);
}

console.log('public truth validation passed');
