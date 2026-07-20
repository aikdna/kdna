#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  packageRecords,
  requireComponent,
  requireNpmPackage,
  resolveComponentPath,
} = require('./ecosystem-manifest');

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
  try {
    return requireComponent(manifest, repository);
  } catch (error) {
    fail(repository, error.message);
    return null;
  }
}

function componentPath(repository) {
  const entry = component(repository);
  return entry ? resolveComponentPath(repoRoot, entry) : null;
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function packageVersion(npmPackage) {
  try {
    return requireNpmPackage(manifest, npmPackage).packageRecord.version;
  } catch (error) {
    fail(npmPackage, error.message);
    return null;
  }
}

function checkVSCodeBoundary() {
  const vscode = component('aikdna/kdna-vscode');
  const vscodeRoot = componentPath('aikdna/kdna-vscode');
  if (!vscode || !vscodeRoot) return;

  const pkg = readJson(path.join(vscodeRoot, 'package.json'));
  const coreRange = (pkg.dependencies && pkg.dependencies['@aikdna/kdna-core']) || null;
  const currentCoreVersion = packageVersion('@aikdna/kdna-core');
  if (vscode.lifecycle !== 'Unassessed') {
    fail(
      'aikdna/kdna-vscode',
      'VS Code maturity must remain Unassessed until independently recertified and owner-reviewed',
    );
  }
  if (
    coreRange &&
    !coreRange.includes(currentCoreVersion) &&
    !(vscode.known_limitations || []).some((item) => /recertif/iu.test(item))
  ) {
    fail('aikdna/kdna-vscode', 'old Core dependency must be disclosed as recertification debt');
  }
  if (vscode.legacy_replacement !== null) {
    fail('aikdna/kdna-vscode', 'retained editor mission must not be represented as a replacement');
  }
}

function checkRetiredNpmBoundaries() {
  const expectedDeprecated = new Map([
    ['@aikdna/agent', 'examples/typescript-agent/package.json'],
    ['@aikdna/kdna-artifact-engine', 'packages/artifact-engine/package.json'],
    ['@aikdna/kdna-fidelity-core', 'packages/fidelity-core/package.json'],
  ]);
  const workflow = readText(path.join(repoRoot, '.github', 'workflows', 'publish.yml'));
  const evidenceGenerator = readText(
    path.join(repoRoot, 'scripts', 'generate-release-evidence.js'),
  );
  const maintenance = readText(path.join(repoRoot, 'docs', 'open-source-maintenance-baseline.md'));
  const statusMatrix = readText(path.join(repoRoot, 'docs', 'tool-status-matrix.md'));
  const deprecatedRecords = packageRecords(manifest).filter(
    ({ packageRecord }) => packageRecord.release_status === 'deprecated',
  );
  const observedCoordinates = new Set(
    deprecatedRecords.map(({ packageRecord }) => packageRecord.npm_package),
  );
  if (
    observedCoordinates.size !== expectedDeprecated.size ||
    [...expectedDeprecated.keys()].some((coordinate) => !observedCoordinates.has(coordinate))
  ) {
    fail(
      'deprecated packages',
      'ecosystem manifest deprecated inventory is incomplete or unexpected',
    );
  }

  for (const { component: owner, packageRecord } of deprecatedRecords) {
    const coordinate = packageRecord.npm_package;
    const packagePath = expectedDeprecated.get(coordinate);
    if (!packagePath) continue;
    if (owner.repository !== 'aikdna/kdna' || packageRecord.package_json !== packagePath) {
      fail(coordinate, 'deprecated package source identity does not match the ecosystem manifest');
    }
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
    if (!packageRecord.legacy_replacement || packageRecord.dependency_policy !== 'frozen') {
      fail(coordinate, 'deprecated package must declare a frozen replacement path');
    }
  }
}

function checkCompatibilityBoundary() {
  let compatibility;
  try {
    compatibility = requireNpmPackage(manifest, '@aikdna/kdna').packageRecord;
  } catch (error) {
    fail('@aikdna/kdna', error.message);
    return;
  }
  if (
    !['candidate', 'compatibility'].includes(compatibility.release_status) ||
    compatibility.lifecycle !== 'Legacy' ||
    compatibility.dependency_policy !== 'current' ||
    !compatibility.legacy_replacement
  ) {
    fail(
      '@aikdna/kdna',
      'compatibility bridge candidate/current lifecycle is not structurally classified',
    );
  }

  const workflow = readText(path.join(repoRoot, '.github', 'workflows', 'publish.yml'));
  const maintenance = readText(path.join(repoRoot, 'docs', 'open-source-maintenance-baseline.md'));
  const packageReadme = readText(path.join(repoRoot, 'packages', 'kdna', 'README.md'));
  for (const [label, text] of [
    ['publish workflow', workflow],
    ['maintenance baseline', maintenance],
    ['package README', packageReadme],
  ]) {
    if (!text.includes('@aikdna/kdna')) {
      fail('@aikdna/kdna', `${label} does not classify the compatibility bridge`);
    }
  }
}

checkVSCodeBoundary();
checkRetiredNpmBoundaries();
checkCompatibilityBoundary();

if (failures.length > 0) {
  console.error(`public truth validation failed: ${failures.length} failure(s)`);
  process.exit(1);
}

console.log('public truth validation passed');
