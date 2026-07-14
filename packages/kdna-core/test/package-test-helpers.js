'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '..', '..');

function findNpmCli() {
  const executable = fs.realpathSync(process.execPath);
  const candidates = [
    process.env.npm_execpath,
    path.join(path.dirname(executable), 'npm'),
    path.join(path.dirname(executable), 'npm-cli.js'),
    path.join(path.dirname(executable), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    path.join(path.dirname(executable), '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    path.join(
      path.dirname(process.execPath),
      '..',
      'lib',
      'node_modules',
      'npm',
      'bin',
      'npm-cli.js',
    ),
  ].filter(Boolean);
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error('npm CLI JavaScript entry not found; run this test through npm');
  }
  return found;
}

function runNpm(args, options = {}) {
  return execFileSync(process.execPath, [findNpmCli(), ...args], {
    ...options,
    env: { ...process.env, ...options.env },
  });
}

function isWithin(candidate, root) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function assertIsolatedNpmCache(cacheDirectory, environment = process.env) {
  if (!path.isAbsolute(cacheDirectory)) {
    throw new Error('test npm cache must be an absolute path');
  }
  const homeDirectories = new Set(
    [os.homedir(), environment.HOME, environment.USERPROFILE]
      .filter(Boolean)
      .map((home) => path.resolve(home)),
  );
  const forbiddenCaches = [...homeDirectories].map((home) => path.join(home, '.npm'));
  if (environment.LOCALAPPDATA) {
    forbiddenCaches.push(path.resolve(environment.LOCALAPPDATA, 'npm-cache'));
  }
  const resolved = path.resolve(cacheDirectory);
  if (forbiddenCaches.some((forbidden) => isWithin(resolved, forbidden))) {
    throw new Error(`test npm cache must not use a user cache: ${resolved}`);
  }
  return resolved;
}

function runNpmWithCache(args, cacheDirectory, options = {}) {
  const environment = { ...process.env, ...options.env };
  const cache = assertIsolatedNpmCache(path.resolve(cacheDirectory), environment);
  fs.mkdirSync(cache, { recursive: true });
  return runNpm([...args, '--cache', cache], {
    ...options,
    env: {
      ...environment,
      npm_config_cache: cache,
      NPM_CONFIG_CACHE: cache,
    },
  });
}

function withTempNpmCache(callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-core-npm-cache-'));
  try {
    return callback(path.join(root, 'cache'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function runTsc(args, options = {}) {
  return execFileSync(process.execPath, [require.resolve('typescript/lib/tsc.js'), ...args], {
    ...options,
    env: { ...process.env, ...options.env },
  });
}

function packagePathParts(packageName) {
  return packageName.startsWith('@') ? packageName.split('/') : [packageName];
}

function resolveInstalledPackage(packageName, fromDirectory) {
  let current = path.resolve(fromDirectory);
  const root = path.parse(current).root;
  while (true) {
    const candidate = path.join(current, 'node_modules', ...packagePathParts(packageName));
    if (fs.existsSync(path.join(candidate, 'package.json'))) return candidate;
    if (current === root) return null;
    current = path.dirname(current);
  }
}

function installedDependencyClosure(rootPackageDirectory) {
  const rootManifest = JSON.parse(
    fs.readFileSync(path.join(rootPackageDirectory, 'package.json'), 'utf8'),
  );
  const pending = Object.keys({
    ...rootManifest.dependencies,
    ...rootManifest.optionalDependencies,
    ...rootManifest.peerDependencies,
  }).map((name) => ({ name, from: rootPackageDirectory }));
  const packages = [];
  const seen = new Set();

  while (pending.length > 0) {
    const dependency = pending.pop();
    const directory = resolveInstalledPackage(dependency.name, dependency.from);
    if (!directory) continue;
    const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
    const key = `${manifest.name}@${manifest.version}:${fs.realpathSync(directory)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    packages.push(directory);

    for (const name of Object.keys({
      ...manifest.dependencies,
      ...manifest.optionalDependencies,
      ...manifest.peerDependencies,
    })) {
      pending.push({ name, from: directory });
    }
  }
  return packages;
}

function packPackage(packageDirectory, destination, cache) {
  const packed = JSON.parse(
    runNpmWithCache(
      ['pack', '--json', '--ignore-scripts', '--pack-destination', destination],
      cache,
      { cwd: packageDirectory, encoding: 'utf8' },
    ),
  )[0];
  return path.join(destination, packed.filename);
}

function installPackedCoreOffline(tempDirectory) {
  const artifacts = path.join(tempDirectory, 'artifacts');
  const packCacheRoot = fs.mkdtempSync(path.join(tempDirectory, 'pack-cache-'));
  const packCache = path.join(packCacheRoot, 'cache');
  const installCache = path.join(tempDirectory, 'install-cache');
  fs.mkdirSync(artifacts, { recursive: true });

  let coreTarball;
  const localDependencies = {};
  try {
    coreTarball = packPackage(PACKAGE_ROOT, artifacts, packCache);
    for (const directory of installedDependencyClosure(PACKAGE_ROOT)) {
      const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
      const tarball = packPackage(directory, artifacts, packCache);
      const spec = `file:./${path.relative(tempDirectory, tarball).split(path.sep).join('/')}`;
      if (localDependencies[manifest.name] && localDependencies[manifest.name] !== spec) {
        throw new Error(`offline dependency closure has multiple ${manifest.name} versions`);
      }
      localDependencies[manifest.name] = spec;
    }
  } finally {
    fs.rmSync(packCacheRoot, { recursive: true, force: true });
  }

  fs.writeFileSync(
    path.join(tempDirectory, 'package.json'),
    JSON.stringify({
      private: true,
      name: 'kdna-core-cold-install',
      version: '1.0.0',
      dependencies: {
        ...localDependencies,
        '@aikdna/kdna-core': `file:./${path
          .relative(tempDirectory, coreTarball)
          .split(path.sep)
          .join('/')}`,
      },
    }),
  );
  try {
    if (fs.existsSync(installCache)) {
      throw new Error('offline install cache must not exist before the first install');
    }
    runNpmWithCache(
      ['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund'],
      installCache,
      {
        cwd: tempDirectory,
        stdio: 'pipe',
      },
    );
  } finally {
    fs.rmSync(installCache, { recursive: true, force: true });
  }
  return { coreTarball };
}

function representativeTypesSource(importSpecifier) {
  return [
    `import { ALG, EXTERNAL_AAD_PROFILE, WORK_PACK_SCHEMA, KDNAManifest, KDNAWorkPackManifest, LicensedEntryLegacyEnvelope, encryptLicensedEntryV1, decryptLicensedEntryV1, decryptLicensedEntry, encryptProtectedEntry, validateWorkPackManifest, inspectWorkPack, externalEnvelopeAad } from ${JSON.stringify(importSpecifier)};`,
    "const algorithm: 'AES-256-GCM' = ALG;",
    "const aadProfile: 'kdna-external-asset-cek-v1' = EXTERNAL_AAD_PROFILE;",
    'declare const manifest: KDNAManifest;',
    "const envelope = encryptLicensedEntryV1('judgment', { entryName: 'payload.kdnab', manifest, licenseKey: 'license' });",
    "const plaintext: Uint8Array = decryptLicensedEntryV1(envelope, { entryName: 'payload.kdnab', manifest, licenseKey: 'license' });",
    "const unifiedV1: Uint8Array = decryptLicensedEntry(envelope, { entryName: 'payload.kdnab', manifest, licenseKey: 'license' });",
    "const protectedEnvelope = encryptProtectedEntry('judgment', { entryName: 'payload.kdnab', manifest, password: 'password' });",
    "const kdfName: 'Argon2id' = protectedEnvelope.password_kdf.name;",
    'declare const legacyEnvelope: LicensedEntryLegacyEnvelope;',
    "const legacyPlaintext: Uint8Array = decryptLicensedEntry(legacyEnvelope, { entryName: 'payload.kdnab', manifest, licenseKey: 'license', machineFingerprint: 'machine' });",
    '// @ts-expect-error legacy envelopes require machineFingerprint',
    "decryptLicensedEntry(legacyEnvelope, { entryName: 'payload.kdnab', manifest, licenseKey: 'license' });",
    'declare const unifiedBytes: Uint8Array;',
    "const unifiedPlaintext: Uint8Array = decryptLicensedEntry(unifiedBytes, { entryName: 'payload.kdnab', manifest, licenseKey: 'license', machineFingerprint: 'machine' });",
    '// @ts-expect-error raw unified input may be legacy and requires machineFingerprint',
    "decryptLicensedEntry(unifiedBytes, { entryName: 'payload.kdnab', manifest, licenseKey: 'license' });",
    "const workpack: KDNAWorkPackManifest = { format: 'kdna-workpack', format_version: '0.1', name: 'example', version: '1.0.0', description: 'test', status: 'draft', kdna: { mode: 'single', asset: { name: 'asset', version: '1.0.0', role: 'primary' } } };",
    'const validation: boolean = validateWorkPackManifest(workpack).valid;',
    "const summary: string = inspectWorkPack(workpack, '.').name;",
    "const aad: Uint8Array = externalEnvelopeAad({ manifest, entryName: 'payload.kdnab', plaintextDigest: 'sha256:00', keyRef: 'key', issuerKeyId: 'issuer' });",
    'const schemaTitle: unknown = WORK_PACK_SCHEMA.title;',
    'console.log(algorithm, aadProfile, plaintext, unifiedV1, protectedEnvelope, kdfName, legacyPlaintext, unifiedPlaintext, validation, summary, aad, schemaTitle);',
  ].join('\n');
}

module.exports = {
  PACKAGE_ROOT,
  REPO_ROOT,
  installPackedCoreOffline,
  representativeTypesSource,
  runNpmWithCache,
  runTsc,
  withTempNpmCache,
};
