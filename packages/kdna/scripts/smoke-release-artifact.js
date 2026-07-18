#!/usr/bin/env node
'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createRequire } = require('node:module');
const { OFFICIAL_REGISTRY, REGISTRY_TIMEOUT_MS, verifyAuditedNpm } = require('./npm-tooling');

function parseArguments(argv) {
  const artifactIndex = argv.indexOf('--artifact');
  if (artifactIndex < 0 || !argv[artifactIndex + 1] || argv.length !== 2) {
    throw new Error('usage: smoke-release-artifact.js --artifact <verified.tgz>');
  }
  return { artifactPath: path.resolve(argv[artifactIndex + 1]) };
}

function packageDirectories(nodeModulesRoot, packageName) {
  const found = new Set();

  function scan(currentNodeModules) {
    if (!fs.existsSync(currentNodeModules)) return;
    for (const entry of fs.readdirSync(currentNodeModules, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === '.bin') continue;
      if (entry.name.startsWith('@')) {
        const scopeRoot = path.join(currentNodeModules, entry.name);
        for (const scoped of fs.readdirSync(scopeRoot, { withFileTypes: true })) {
          if (!scoped.isDirectory()) continue;
          inspectPackage(path.join(scopeRoot, scoped.name), `${entry.name}/${scoped.name}`);
        }
      } else {
        inspectPackage(path.join(currentNodeModules, entry.name), entry.name);
      }
    }
  }

  function inspectPackage(packagePath, observedName) {
    if (observedName === packageName) found.add(fs.realpathSync(packagePath));
    scan(path.join(packagePath, 'node_modules'));
  }

  scan(nodeModulesRoot);
  return [...found].sort();
}

function readManifest(packagePath) {
  return JSON.parse(fs.readFileSync(path.join(packagePath, 'package.json'), 'utf8'));
}

function main() {
  const { artifactPath } = parseArguments(process.argv.slice(2));
  if (!fs.existsSync(artifactPath)) throw new Error(`exact release tarball is missing: ${artifactPath}`);
  verifyAuditedNpm();

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-compat-clean-install-'));
  try {
    fs.writeFileSync(
      path.join(temp, 'package.json'),
      JSON.stringify({ name: 'kdna-compat-release-smoke', version: '1.0.0', private: true }),
    );
    execFileSync(
      'npm',
      [
        'install',
        '--ignore-scripts',
        '--package-lock=false',
        '--no-audit',
        '--no-fund',
        `--registry=${OFFICIAL_REGISTRY}`,
        artifactPath,
      ],
      { cwd: temp, stdio: 'inherit', timeout: REGISTRY_TIMEOUT_MS },
    );

    const modules = path.join(temp, 'node_modules');
    const compatPath = path.join(modules, '@aikdna', 'kdna');
    const cliPath = path.join(modules, '@aikdna', 'kdna-cli');
    const corePath = path.join(modules, '@aikdna', 'kdna-core');
    const evalPath = path.join(modules, '@aikdna', 'kdna-eval');
    const expected = [
      [compatPath, '@aikdna/kdna', '0.13.2'],
      [cliPath, '@aikdna/kdna-cli', '0.35.1'],
      [corePath, '@aikdna/kdna-core', '0.20.0'],
      [evalPath, '@aikdna/kdna-eval', '0.3.2'],
    ];
    for (const [packagePath, name, version] of expected) {
      const manifest = readManifest(packagePath);
      if (manifest.name !== name || manifest.version !== version) {
        throw new Error(
          `clean install resolved ${manifest.name || '<missing>'}@${manifest.version || '<missing>'}, expected ${name}@${version}`,
        );
      }
    }

    const compatRequire = createRequire(path.join(compatPath, 'package.json'));
    const cliRequire = createRequire(path.join(cliPath, 'package.json'));
    const compatCore = fs.realpathSync(compatRequire.resolve('@aikdna/kdna-core'));
    const cliCore = fs.realpathSync(cliRequire.resolve('@aikdna/kdna-core'));
    if (compatCore !== cliCore) {
      throw new Error(`compatibility and CLI resolve different Core modules: ${compatCore} vs ${cliCore}`);
    }
    const physicalCorePackages = packageDirectories(modules, '@aikdna/kdna-core');
    if (physicalCorePackages.length !== 1 || physicalCorePackages[0] !== fs.realpathSync(corePath)) {
      throw new Error(
        `clean install contains ${physicalCorePackages.length} physical Core packages: ${physicalCorePackages.join(', ')}`,
      );
    }
    const physicalEvalPackages = packageDirectories(modules, '@aikdna/kdna-eval');
    if (physicalEvalPackages.length !== 1 || physicalEvalPackages[0] !== fs.realpathSync(evalPath)) {
      throw new Error(
        `clean install contains ${physicalEvalPackages.length} physical Eval packages: ${physicalEvalPackages.join(', ')}`,
      );
    }

    execFileSync(
      'npm',
      [
        'ls',
        '@aikdna/kdna',
        '@aikdna/kdna-cli',
        '@aikdna/kdna-core',
        '@aikdna/kdna-eval',
        '--all',
      ],
      { cwd: temp, stdio: 'inherit' },
    );
    execFileSync(process.execPath, [path.join(compatPath, 'bin', 'kdna.js'), '--help'], {
      cwd: temp,
      stdio: 'ignore',
    });
    execFileSync(
      process.execPath,
      [path.join(compatPath, 'bin', 'kdna.js'), 'eval', 'asset', '--help'],
      { cwd: temp, stdio: 'ignore', timeout: REGISTRY_TIMEOUT_MS },
    );
    for (const executable of ['kdna-lint', 'kdna-validate']) {
      const publicBin = path.join(modules, '.bin', executable);
      if (!fs.existsSync(publicBin)) throw new Error(`public executable is missing: ${executable}`);
      execFileSync(publicBin, ['--help'], {
        cwd: temp,
        stdio: 'ignore',
        timeout: REGISTRY_TIMEOUT_MS,
      });
    }
    console.log(
      'clean exact-tarball install resolved one Core 0.20.0, Eval 0.3.2, and CLI 0.35.1',
    );
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Compatibility clean-install smoke failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { packageDirectories, parseArguments };
