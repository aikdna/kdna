#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { currentPublishedPackages } = require('./ecosystem-manifest');

const repoRoot = path.resolve(__dirname, '..');
const outputRoot = path.join(repoRoot, 'release-evidence');
const npmCacheDir = path.join(repoRoot, '.npm-cache', 'release-evidence');

const knownPackages = {
  core: {
    label: 'core',
    path: path.join(repoRoot, 'packages', 'kdna-core'),
  },
  compat: {
    label: 'compat',
    path: path.join(repoRoot, 'packages', 'kdna'),
  },
  eval: {
    label: 'eval',
    path: path.join(repoRoot, 'packages', 'kdna-eval'),
  },
};

function validateKnownPackages() {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'ecosystem-manifest.json'), 'utf8'),
  );
  const manifestPackages = currentPublishedPackages(manifest).filter(
    ({ component }) => component.repository === 'aikdna/kdna',
  );
  const expected = new Map(
    manifestPackages.map(({ component, packageRecord }) => [
      packageRecord.npm_package,
      path.resolve(repoRoot, component.local_path || '.', path.dirname(packageRecord.package_json)),
    ]),
  );
  const observed = new Map(
    Object.values(knownPackages).map((entry) => {
      const pkg = JSON.parse(fs.readFileSync(path.join(entry.path, 'package.json'), 'utf8'));
      return [pkg.name, path.resolve(entry.path)];
    }),
  );
  if (
    expected.size !== observed.size ||
    [...expected].some(([packageName, packagePath]) => observed.get(packageName) !== packagePath)
  ) {
    throw new Error('release evidence package inventory differs from ecosystem-manifest.json');
  }
}

function json(value) {
  return JSON.stringify(value, null, 2) + '\n';
}

function run(command, args, cwd = repoRoot) {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      npm_config_cache: process.env.npm_config_cache || npmCacheDir,
      NPM_CONFIG_CACHE: process.env.NPM_CONFIG_CACHE || npmCacheDir,
    },
  }).trim();
}

function tryRun(command, args, cwd = repoRoot) {
  try {
    return run(command, args, cwd);
  } catch {
    return null;
  }
}

function parsePackageSelection() {
  const arg = process.argv.find((item) => item.startsWith('--package='));
  const selected = arg ? arg.slice('--package='.length) : 'all';
  if (selected === 'all') return Object.values(knownPackages);
  if (!knownPackages[selected]) {
    console.error(
      `Unknown --package=${selected}. Use one of: all, ${Object.keys(knownPackages).join(', ')}`,
    );
    process.exit(2);
  }
  return [knownPackages[selected]];
}

function packArtifact(entry) {
  const stdout = run('npm', ['pack', '--json', '--pack-destination', outputRoot], entry.path);
  const parsed = JSON.parse(stdout);
  if (!parsed[0]) throw new Error(`npm pack returned no package metadata for ${entry.label}`);
  const pack = parsed[0];
  const expectedFilename = `${pack.name.replace(/^@/, '').replace('/', '-')}-${pack.version}.tgz`;
  if (
    typeof pack.filename !== 'string' ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]*\.tgz$/.test(pack.filename) ||
    path.basename(pack.filename) !== pack.filename ||
    pack.filename !== expectedFilename
  ) {
    throw new Error(`npm pack returned an unsafe artifact filename for ${entry.label}`);
  }
  const artifactPath = path.join(outputRoot, pack.filename);
  const stat = fs.lstatSync(artifactPath);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`npm pack did not produce a regular artifact for ${entry.label}`);
  }
  const bytes = fs.readFileSync(artifactPath);
  const shasum = crypto.createHash('sha1').update(bytes).digest('hex');
  const integrity = `sha512-${crypto.createHash('sha512').update(bytes).digest('base64')}`;
  if (pack.shasum !== shasum || pack.integrity !== integrity || pack.size !== bytes.length) {
    throw new Error(`npm pack metadata does not bind the generated artifact for ${entry.label}`);
  }
  return {
    pack,
    artifactPath,
    bytes,
    shasum,
    integrity,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  };
}

function spdxId(value) {
  return `SPDXRef-${String(value).replace(/[^A-Za-z0-9.-]/g, '-')}`;
}

function npmPurl(name, version) {
  if (name.startsWith('@')) {
    const [scope, packageName] = name.slice(1).split('/');
    return `pkg:npm/%40${encodeURIComponent(scope || '')}/${encodeURIComponent(packageName || '')}@${encodeURIComponent(version)}`;
  }
  return `pkg:npm/${encodeURIComponent(name)}@${encodeURIComponent(version)}`;
}

function readPackageLockPackages(lockPath, lockLabel) {
  if (!fs.existsSync(lockPath)) return [];
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  return Object.entries(lock.packages || {}).map(([packagePath, info]) => {
    const name =
      info.name ||
      (packagePath.startsWith('node_modules/')
        ? packagePath.slice('node_modules/'.length)
        : packagePath || 'root');
    return {
      name,
      version: info.version || '0.0.0',
      packagePath,
      lockLabel,
      resolved: info.resolved || 'NOASSERTION',
      license: info.license || 'NOASSERTION',
    };
  });
}

function collectSbomPackages(selectedPackages) {
  const lockPaths = new Map();
  lockPaths.set(path.join(repoRoot, 'package-lock.json'), 'repo-root');
  for (const entry of selectedPackages) {
    const lockPath = path.join(entry.path, 'package-lock.json');
    if (fs.existsSync(lockPath)) lockPaths.set(lockPath, entry.label);
  }

  const packages = [];
  for (const [lockPath, lockLabel] of lockPaths.entries()) {
    packages.push(...readPackageLockPackages(lockPath, lockLabel));
  }
  return packages;
}

function generateSbom(sourceCommit, selectedPackages) {
  const packages = collectSbomPackages(selectedPackages).map((pkg) => ({
    SPDXID: spdxId(`${pkg.lockLabel}:${pkg.name}@${pkg.version}:${pkg.packagePath}`),
    name: pkg.name,
    versionInfo: pkg.version,
    downloadLocation: pkg.resolved,
    filesAnalyzed: false,
    licenseConcluded: pkg.license,
    licenseDeclared: pkg.license,
    copyrightText: 'NOASSERTION',
    comment: `source lockfile: ${pkg.lockLabel}`,
    externalRefs: [
      {
        referenceCategory: 'PACKAGE-MANAGER',
        referenceType: 'purl',
        referenceLocator: npmPurl(pkg.name, pkg.version),
      },
    ],
  }));

  return {
    spdxVersion: 'SPDX-2.3',
    dataLicense: 'CC0-1.0',
    SPDXID: 'SPDXRef-DOCUMENT',
    name: `kdna-release-sbom-${sourceCommit || 'unknown'}`,
    documentNamespace: `https://github.com/aikdna/kdna/release-evidence/${sourceCommit || 'unknown'}/${Date.now()}`,
    creationInfo: {
      created: new Date().toISOString(),
      creators: ['Tool: scripts/generate-release-evidence.js'],
    },
    packages,
  };
}

function main() {
  validateKnownPackages();
  fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.mkdirSync(outputRoot, { recursive: true });
  fs.mkdirSync(npmCacheDir, { recursive: true });

  const selectedPackages = parsePackageSelection();
  const sourceCommit = tryRun('git', ['rev-parse', 'HEAD']);
  const sourceRef = tryRun('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
  const dirtyStatus = tryRun('git', ['status', '--short']);

  const artifacts = [];
  for (const entry of selectedPackages) {
    if (!fs.existsSync(entry.path)) {
      throw new Error(`Package path does not exist: ${entry.path}`);
    }
    const { pack, artifactPath, bytes, shasum, integrity, sha256 } = packArtifact(entry);
    const artifactRelativePath = path.relative(repoRoot, artifactPath).split(path.sep).join('/');
    const artifact = {
      label: entry.label,
      package_name: pack.name,
      version: pack.version,
      filename: pack.filename,
      artifact_path: artifactRelativePath,
      sha256,
      shasum,
      integrity,
      size: bytes.length,
      unpacked_size: pack.unpackedSize,
      entry_count: pack.entryCount,
      publish_command: `npm publish "${artifactRelativePath}" --provenance --access public`,
      npm_provenance_required: true,
      files: (pack.files || []).map((file) => ({
        path: file.path,
        size: file.size,
        mode: file.mode,
      })),
    };
    artifacts.push(artifact);
    fs.writeFileSync(path.join(outputRoot, `${entry.label}.npm-pack.json`), json(artifact), 'utf8');
  }

  const manifest = {
    generated_at: new Date().toISOString(),
    generated_on: os.hostname(),
    source_repository: 'aikdna/kdna',
    source_ref: sourceRef,
    source_commit: sourceCommit,
    git_dirty: Boolean(dirtyStatus),
    selected_packages: selectedPackages.map((entry) => entry.label),
    artifacts,
  };

  fs.writeFileSync(path.join(outputRoot, 'artifact-manifest.json'), json(manifest), 'utf8');
  fs.writeFileSync(
    path.join(outputRoot, 'sbom.spdx.json'),
    json(generateSbom(sourceCommit, selectedPackages)),
    'utf8',
  );

  console.log(`release evidence generated: ${outputRoot}`);
  console.log(
    `artifacts: ${artifacts.map((artifact) => `${artifact.package_name}@${artifact.version}`).join(', ')}`,
  );
  if (dirtyStatus) console.log('note: git_dirty=true because the worktree has uncommitted changes');
}

main();
