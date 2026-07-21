#!/usr/bin/env node
'use strict';

/**
 * Fail-closed cross-repository lock for current KDNA npm coordinates.
 *
 * Package records come from the schema-2 public ecosystem manifest. Active and
 * compatibility coordinates are both recognized so an unreviewed dependency
 * on either fails closed; the explicit binding policy is the only allowlist.
 * Deprecated package manifests are frozen and excluded from dependency scans.
 */

const fs = require('node:fs');
const path = require('node:path');
const { packageRecords } = require('./ecosystem-manifest');

const EXCLUDED_LIFECYCLES = new Set(['Unassessed', 'Legacy', 'Removed']);

// This is an explicit compatibility policy, not a best-effort inventory. Any
// repository, manifest, or managed dependency disappearing must fail the gate
// until the ecosystem policy is deliberately updated in the same change.
const EXPECTED_BINDINGS = Object.freeze(
  [
    ['create-kdna-web-app', 'templates/express/package.json', 'dependencies', '@aikdna/kdna-core'],
    [
      'create-kdna-web-app',
      'templates/express/package.json',
      'dependencies',
      '@aikdna/kdna-web-server',
    ],
    [
      'create-kdna-web-app',
      'templates/nextjs-pages/package.json',
      'dependencies',
      '@aikdna/kdna-core',
    ],
    [
      'create-kdna-web-app',
      'templates/nextjs-pages/package.json',
      'dependencies',
      '@aikdna/kdna-react',
    ],
    [
      'create-kdna-web-app',
      'templates/nextjs-pages/package.json',
      'dependencies',
      '@aikdna/kdna-web-server',
    ],
    ['create-kdna-web-app', 'templates/nextjs/package.json', 'dependencies', '@aikdna/kdna-core'],
    ['create-kdna-web-app', 'templates/nextjs/package.json', 'dependencies', '@aikdna/kdna-react'],
    [
      'create-kdna-web-app',
      'templates/nextjs/package.json',
      'dependencies',
      '@aikdna/kdna-web-server',
    ],
    ['kdna', 'package.json', 'devDependencies', '@aikdna/kdna-cli'],
    ['kdna', 'packages/kdna/package.json', 'dependencies', '@aikdna/kdna-core'],
    ['kdna', 'packages/kdna/package.json', 'dependencies', '@aikdna/kdna-cli'],
    ['kdna-activation-server', 'package.json', 'dependencies', '@aikdna/kdna-core'],
    ['kdna-assets', 'package.json', 'devDependencies', '@aikdna/kdna-core'],
    ['kdna-assets', 'package.json', 'devDependencies', '@aikdna/kdna-cli'],
    ['kdna-cli', 'package.json', 'dependencies', '@aikdna/kdna-core'],
    ['kdna-cli', 'package.json', 'dependencies', '@aikdna/kdna-eval'],
    ['kdna-demo-web-viewer', 'app/package.json', 'dependencies', '@aikdna/kdna-core'],
    ['kdna-demo-web-viewer', 'app/package.json', 'dependencies', '@aikdna/kdna-react'],
    ['kdna-demo-web-viewer', 'app/package.json', 'dependencies', '@aikdna/kdna-web-client'],
    ['kdna-demo-web-viewer', 'app/package.json', 'dependencies', '@aikdna/kdna-web-server'],
    ['kdna-react', 'package.json', 'devDependencies', '@aikdna/kdna-core'],
    ['kdna-react', 'package.json', 'devDependencies', '@aikdna/kdna-activation-server'],
    ['kdna-react', 'package.json', 'devDependencies', '@aikdna/kdna-web-server'],
    ['kdna-react', 'package.json', 'dependencies', '@aikdna/kdna-web-client'],
    ['kdna-remote-server', 'package.json', 'dependencies', '@aikdna/kdna-core'],
    ['kdna-remote-server', 'package.json', 'devDependencies', '@aikdna/kdna-activation-server'],
    ['kdna-skills', 'mcp-server/package.json', 'dependencies', '@aikdna/kdna-core'],
    ['kdna-studio-cli', 'package.json', 'dependencies', '@aikdna/kdna-core'],
    ['kdna-studio-cli', 'package.json', 'dependencies', '@aikdna/kdna-studio-core'],
    ['kdna-studio-core', 'package.json', 'dependencies', '@aikdna/kdna-core'],
    ['kdna-web-client', 'package.json', 'devDependencies', '@aikdna/kdna-web-server'],
    ['kdna-web-server', 'package.json', 'devDependencies', '@aikdna/kdna-core'],
    ['kdna-web-server', 'package.json', 'peerDependencies', '@aikdna/kdna-core'],
    ['kdna-web-server', 'package.json', 'devDependencies', '@aikdna/kdna-activation-server'],
  ].map(([repository, manifest, section, packageName]) => ({
    repository,
    manifest,
    section,
    packageName,
  })),
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readBaselines(controlRoot) {
  const manifest = readJson(path.join(controlRoot, 'ecosystem-manifest.json'));
  const baselines = new Map();
  const lifecycleByRepository = new Map();
  const manifestsByRepository = new Map();

  for (const component of manifest.components) {
    const repositoryName = component.repository.split('/').pop();
    lifecycleByRepository.set(repositoryName, component.lifecycle);
  }

  for (const { component, packageRecord } of packageRecords(manifest)) {
    const repositoryName = component.repository.split('/').pop();
    if (packageRecord.dependency_policy === 'current') {
      const manifests = manifestsByRepository.get(repositoryName) || [];
      manifests.push(packageRecord.package_json);
      manifestsByRepository.set(repositoryName, manifests);
    }
    if (
      ['active', 'compatibility'].includes(packageRecord.release_status) &&
      packageRecord.npm_package &&
      packageRecord.version
    ) {
      if (baselines.has(packageRecord.npm_package)) {
        throw new Error(`duplicate managed package ${packageRecord.npm_package}`);
      }
      baselines.set(packageRecord.npm_package, packageRecord.version);
    }
    if (
      packageRecord.release_status === 'candidate' &&
      packageRecord.npm_package &&
      packageRecord.published_version
    ) {
      if (baselines.has(packageRecord.npm_package)) {
        throw new Error(`duplicate managed package ${packageRecord.npm_package}`);
      }
      baselines.set(packageRecord.npm_package, packageRecord.published_version);
    }
  }

  const candidateBaselines = new Map();
  if (process.env.KDNA_CORE_BASELINE) {
    candidateBaselines.set('@aikdna/kdna-core', process.env.KDNA_CORE_BASELINE);
  }
  if (process.env.KDNA_STUDIO_CORE_BASELINE) {
    candidateBaselines.set('@aikdna/kdna-studio-core', process.env.KDNA_STUDIO_CORE_BASELINE);
  }

  for (const binding of EXPECTED_BINDINGS) {
    const manifests = manifestsByRepository.get(binding.repository) || [];
    manifests.push(binding.manifest);
    manifestsByRepository.set(binding.repository, [...new Set(manifests)].sort());
  }

  return { baselines, candidateBaselines, lifecycleByRepository, manifestsByRepository };
}

function workspacePackagePaths(repositoryRoot, rootPackage) {
  const paths = [path.join(repositoryRoot, 'package.json')];
  const declarations = Array.isArray(rootPackage.workspaces)
    ? rootPackage.workspaces
    : rootPackage.workspaces?.packages || [];

  for (const declaration of declarations) {
    if (typeof declaration !== 'string') continue;
    if (declaration.endsWith('/*') && !declaration.slice(0, -2).includes('*')) {
      const parent = path.join(repositoryRoot, declaration.slice(0, -2));
      if (!fs.existsSync(parent)) continue;
      for (const entry of fs.readdirSync(parent, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const candidate = path.join(parent, entry.name, 'package.json');
        if (fs.existsSync(candidate)) paths.push(candidate);
      }
      continue;
    }
    if (!declaration.includes('*')) {
      const candidate = path.join(repositoryRoot, declaration, 'package.json');
      if (fs.existsSync(candidate)) paths.push(candidate);
    }
  }

  return [...new Set(paths)].sort();
}

function repositoryRoots(reposRoot, controlRoot) {
  const roots = new Map();
  if (fs.existsSync(reposRoot)) {
    for (const entry of fs.readdirSync(reposRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      roots.set(entry.name, path.join(reposRoot, entry.name));
    }
  }
  if (controlRoot && fs.existsSync(controlRoot)) {
    roots.set(path.basename(controlRoot), controlRoot);
  }
  return roots;
}

function findConsumers(
  reposRoot,
  baselines,
  lifecycleByRepository,
  manifestsByRepository = new Map(),
  options = {},
) {
  const consumers = [];
  const skipped = [];
  const controlRoot = options.controlRoot || path.join(reposRoot, 'kdna');

  for (const [repository, repositoryRoot] of repositoryRoots(reposRoot, controlRoot)) {
    const rootPackagePath = path.join(repositoryRoot, 'package.json');

    const lifecycle = lifecycleByRepository.get(repository) || null;
    if (EXCLUDED_LIFECYCLES.has(lifecycle)) {
      skipped.push({ repository, lifecycle });
      continue;
    }

    let packagePaths = [];
    if (fs.existsSync(rootPackagePath)) {
      try {
        packagePaths = workspacePackagePaths(repositoryRoot, readJson(rootPackagePath));
      } catch {
        consumers.push({ repository, manifest: 'package.json', error: 'invalid JSON' });
      }
    }
    for (const manifest of manifestsByRepository.get(repository) || []) {
      const packagePath = path.join(repositoryRoot, manifest);
      if (!fs.existsSync(packagePath)) {
        consumers.push({ repository, manifest, error: 'required manifest is missing' });
      } else {
        packagePaths.push(packagePath);
      }
    }

    for (const packagePath of [...new Set(packagePaths)].sort()) {
      let pkg;
      try {
        pkg = readJson(packagePath);
      } catch {
        consumers.push({
          repository,
          manifest: path.relative(repositoryRoot, packagePath),
          error: 'invalid JSON',
        });
        continue;
      }
      for (const section of [
        'dependencies',
        'devDependencies',
        'optionalDependencies',
        'peerDependencies',
      ]) {
        const declarations = pkg[section] || {};
        for (const [packageName, expected] of baselines) {
          if (!Object.prototype.hasOwnProperty.call(declarations, packageName)) continue;
          consumers.push({
            repository,
            manifest: path.relative(repositoryRoot, packagePath),
            section,
            packageName,
            declared: declarations[packageName],
            expected,
          });
        }
      }
    }
  }

  return { consumers, skipped };
}

function bindingKey(binding) {
  return `${binding.repository}\0${binding.manifest}\0${binding.section}\0${binding.packageName}`;
}

function reconcileBindings(consumers, baselines, expectedBindings = EXPECTED_BINDINGS) {
  const expectedByKey = new Map(expectedBindings.map((binding) => [bindingKey(binding), binding]));
  const seen = new Set();
  const reconciled = [];

  for (const consumer of consumers) {
    if (consumer.error) {
      reconciled.push(consumer);
      continue;
    }
    const key = bindingKey(consumer);
    if (!expectedByKey.has(key)) {
      reconciled.push({
        ...consumer,
        error: 'unexpected managed binding; update the explicit ecosystem policy',
      });
      continue;
    }
    if (seen.has(key)) {
      reconciled.push({ ...consumer, error: 'duplicate managed binding' });
      continue;
    }
    seen.add(key);
    reconciled.push(consumer);
  }

  for (const [key, binding] of expectedByKey) {
    if (seen.has(key)) continue;
    const expected = baselines.get(binding.packageName);
    reconciled.push({
      ...binding,
      expected,
      error: expected
        ? 'expected managed binding is missing'
        : 'managed package has no current ecosystem baseline',
    });
  }
  return reconciled;
}

function evaluateConsumers(consumers, candidateBaselines = new Map()) {
  return consumers.map((consumer) => ({
    ...consumer,
    ok:
      !consumer.error &&
      (consumer.declared === consumer.expected ||
        consumer.declared === candidateBaselines.get(consumer.packageName)),
  }));
}

function main() {
  const strict = process.argv.includes('--strict');
  const reposRoot = process.env.KDNA_REPOS_ROOT || path.resolve(__dirname, '..', '..');
  const controlRoot = process.env.KDNA_CONTROL_ROOT || path.join(reposRoot, 'kdna');
  let policy;
  try {
    policy = readBaselines(controlRoot);
  } catch (error) {
    console.error(`ecosystem-version-lock: cannot read public baselines: ${error.message}`);
    process.exit(2);
  }

  console.log('ecosystem-version-lock: exact managed coordinates');
  for (const [packageName, version] of [...policy.baselines].sort()) {
    console.log(`  MANAGED ${packageName}@${version}`);
  }
  for (const [packageName, version] of [...policy.candidateBaselines].sort()) {
    console.log(`  MANAGED-CANDIDATE ${packageName}@${version}`);
  }
  console.log(`scanning ${reposRoot}`);

  const discovered = findConsumers(
    reposRoot,
    policy.baselines,
    policy.lifecycleByRepository,
    policy.manifestsByRepository,
    { controlRoot },
  );
  for (const repository of discovered.skipped) {
    console.log(`  SKIP ${repository.repository}: ${repository.lifecycle}`);
  }

  const evaluated = evaluateConsumers(
    reconcileBindings(discovered.consumers, policy.baselines),
    policy.candidateBaselines,
  );
  const failures = [];
  for (const consumer of evaluated) {
    const section = consumer.section ? `#${consumer.section}` : '';
    const label = `${consumer.repository}/${consumer.manifest}${section}`;
    if (consumer.ok) {
      console.log(`  PASS ${label}: ${consumer.packageName}@${consumer.declared}`);
      continue;
    }
    const detail = consumer.error
      ? consumer.error
      : `${consumer.packageName}@${consumer.declared} (expected exact ${consumer.expected})`;
    if (strict) {
      failures.push(`${label}: ${detail}`);
      console.log(`  FAIL ${label}: ${detail}`);
    } else {
      console.log(`  WARN ${label}: ${detail}`);
    }
  }

  if (failures.length > 0) {
    console.error(`\necosystem-version-lock: ${failures.length} consumer(s) drifted`);
    process.exit(1);
  }
  console.log(
    `\necosystem-version-lock: ${EXPECTED_BINDINGS.length} expected binding(s) are present and exact`,
  );
}

if (require.main === module) main();

module.exports = {
  EXPECTED_BINDINGS,
  bindingKey,
  evaluateConsumers,
  findConsumers,
  readBaselines,
  reconcileBindings,
  repositoryRoots,
  workspacePackagePaths,
};
