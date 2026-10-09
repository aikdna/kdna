#!/usr/bin/env node
'use strict';
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const DIST_TAG = 'browser-preview';
const REGISTRY = 'https://registry.npmjs.org/';
const NPM_VERSION = '11.17.0';
function assert(value, message) {
  if (!value) throw new Error(message);
}
function read(file) {
  assert(
    path.isAbsolute(file) && fs.realpathSync(file) === file,
    'publisher file path must be canonical',
  );
  const stat = fs.lstatSync(file);
  assert(
    stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1 && stat.size <= 64 * 1024 * 1024,
    'publisher input must be a bounded regular file',
  );
  return fs.readFileSync(file);
}
async function publishVerified({
  libraryPath,
  manifestPath,
  artifactPath,
  artifactSha256,
  token,
  library = null,
}) {
  assert(path.isAbsolute(libraryPath), 'publisher library path must be absolute');
  assert(
    typeof token === 'string' && token !== '' && !/[\r\n\0]/u.test(token),
    'publisher token missing or invalid',
  );
  assert(/^[0-9a-f]{64}$/u.test(artifactSha256 || ''), 'publisher artifact digest invalid');
  const bytes = read(artifactPath);
  assert(
    crypto.createHash('sha256').update(bytes).digest('hex') === artifactSha256,
    'publisher retained artifact digest mismatch',
  );
  const manifest = JSON.parse(read(manifestPath).toString('utf8'));
  const versions = {
    '@aikdna/kdna-core': '0.37.1-rc.browser.1',
    '@aikdna/kdna-read': '0.11.2-rc.browser.1',
  };
  assert(
    Object.hasOwn(versions, manifest.name) &&
      manifest.version === versions[manifest.name] &&
      /^[a-f0-9]{40}$/u.test(manifest.gitHead || ''),
    'publisher target identity invalid',
  );
  assert(
    !Object.hasOwn(manifest, 'publishConfig') &&
      !Object.hasOwn(manifest, 'dist') &&
      !Object.hasOwn(manifest, 'tag'),
    'publisher manifest contains conflicting metadata',
  );
  const publisher = library || require(libraryPath);
  assert(typeof publisher.publish === 'function', 'publisher audited library unavailable');
  await publisher.publish(manifest, bytes, {
    '//registry.npmjs.org/:_authToken': token,
    access: 'public',
    algorithms: ['sha512'],
    defaultTag: DIST_TAG,
    npmVersion: NPM_VERSION,
    provenance: true,
    registry: REGISTRY,
  });
  return true;
}
async function main(argv = process.argv.slice(2)) {
  assert(argv.length === 4, 'publisher arguments invalid');
  const token = process.env.NODE_AUTH_TOKEN;
  delete process.env.NODE_AUTH_TOKEN;
  await publishVerified({
    libraryPath: argv[0],
    manifestPath: argv[1],
    artifactPath: argv[2],
    artifactSha256: argv[3],
    token,
  });
}
if (require.main === module)
  main().catch(() => {
    console.error('Verified preview publisher rejected the request');
    process.exitCode = 1;
  });
module.exports = { DIST_TAG, publishVerified };
