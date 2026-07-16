#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const AUDITED_NPM_VERSION = '11.17.0';
const OFFICIAL_REGISTRY = 'https://registry.npmjs.org/';
const COMMIT_RE = /^[0-9a-f]{40}$/u;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readOneLink(file, label) {
  const stats = fs.lstatSync(file);
  assert(
    stats.isFile() && !stats.isSymbolicLink() && stats.nlink === 1,
    `${label} must be one regular file`,
  );
  return fs.readFileSync(file);
}

async function publishVerified({
  libraryPath,
  manifestPath,
  artifactPath,
  registry,
  token,
  provenance,
  npmVersion,
}) {
  assert(path.isAbsolute(libraryPath), 'publisher library path must be absolute');
  assert(path.isAbsolute(manifestPath), 'publisher manifest path must be absolute');
  assert(path.isAbsolute(artifactPath), 'publisher artifact path must be absolute');
  assert(typeof registry === 'string' && registry.endsWith('/'), 'publisher registry is invalid');
  assert(typeof token === 'string' && token !== '', 'publisher token is missing');
  assert(typeof provenance === 'boolean', 'publisher provenance flag is invalid');
  assert(npmVersion === AUDITED_NPM_VERSION, 'publisher npm version is not audited');
  const manifest = JSON.parse(readOneLink(manifestPath, 'publisher manifest').toString('utf8'));
  assert(
    manifest &&
      typeof manifest === 'object' &&
      !Array.isArray(manifest) &&
      typeof manifest.name === 'string' &&
      typeof manifest.version === 'string' &&
      COMMIT_RE.test(manifest.gitHead || ''),
    'publisher manifest identity is invalid',
  );
  const tarball = readOneLink(artifactPath, 'publisher artifact');
  const library = require(libraryPath);
  assert(library && typeof library.publish === 'function', 'audited publisher library is invalid');
  const parsedRegistry = new URL(registry);
  const authKey = `//${parsedRegistry.host}${parsedRegistry.pathname}:_authToken`;
  await library.publish(manifest, tarball, {
    [authKey]: token,
    access: 'public',
    algorithms: ['sha512'],
    defaultTag: 'latest',
    npmVersion,
    provenance,
    registry,
  });
  return true;
}

async function main(argv = process.argv.slice(2)) {
  assert(argv.length === 3, 'publisher arguments are invalid');
  const token = process.env.NODE_AUTH_TOKEN;
  delete process.env.NODE_AUTH_TOKEN;
  await publishVerified({
    libraryPath: path.resolve(argv[0]),
    manifestPath: path.resolve(argv[1]),
    artifactPath: path.resolve(argv[2]),
    registry: OFFICIAL_REGISTRY,
    token,
    provenance: true,
    npmVersion: AUDITED_NPM_VERSION,
  });
}

if (require.main === module) {
  main().catch(() => {
    console.error('Verified Core publisher rejected the request');
    process.exitCode = 1;
  });
}

module.exports = { publishVerified };
