#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { deflateRawSync, gzipSync } from 'node:zlib';

import {
  allowlistAuthorityDigest,
  assertAllowlistAuthority,
  collectCandidates,
  discoverPackageRoots,
  parseAllowlist,
  parseTokenAuthority,
  safeNpmTarballEntries,
  scanRecords,
  validateAllowlist,
} from './check-post-cutover-naming.mjs';

const prefix = String.fromCharCode(118);
const ownedGeneration = ['KDNA Core ', prefix, '7'].join('');
const authorityPath = 'scripts/post-cutover-naming-allowlist.json';
const tokenAuthorityUrl = new URL('./post-cutover-token-authority.json', import.meta.url);
const tokenAuthorityBytes = fs.readFileSync(tokenAuthorityUrl);
const authorityTokens = parseTokenAuthority(tokenAuthorityBytes);

const CRC32_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = CRC32_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function buildZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const entry of entries) {
    const nameBytes = entry.nameBytes || Buffer.from(entry.name, 'utf8');
    const content = Buffer.from(entry.content);
    const method = entry.method ?? 0;
    const compressed = method === 8 ? deflateRawSync(content) : content;
    const checksum = crc32(content);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    localParts.push(local, nameBytes, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE((3 << 8) | 20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(content.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt32LE(entry.externalAttributes ?? (0o100644 * 0x10000) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, nameBytes);
    offset += local.length + nameBytes.length + compressed.length;
  }
  const central = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, central, end]);
}

function writeTarOctal(header, offset, length, value) {
  const encoded = value.toString(8).padStart(length - 1, '0');
  header.write(encoded, offset, length - 1, 'ascii');
  header[offset + length - 1] = 0;
}

function buildTarballWithPath(nameBytes) {
  const header = Buffer.alloc(512);
  nameBytes.copy(header, 0);
  writeTarOctal(header, 100, 8, 0o644);
  writeTarOctal(header, 108, 8, 0);
  writeTarOctal(header, 116, 8, 0);
  writeTarOctal(header, 124, 12, 0);
  writeTarOctal(header, 136, 12, 0);
  header.fill(0x20, 148, 156);
  header[156] = 48;
  header.write('ustar\0', 257, 6, 'ascii');
  header.write('00', 263, 2, 'ascii');
  writeTarOctal(
    header,
    148,
    8,
    header.reduce((sum, byte) => sum + byte, 0),
  );
  return gzipSync(Buffer.concat([header, Buffer.alloc(1024)]));
}

function authority(path = 'docs/forged-exception.md', token = ownedGeneration) {
  return [
    {
      path,
      token,
      owner: 'GitHub Actions',
      reason: 'Third-party release reference controlled by the action owner.',
    },
  ];
}

test('stable coordinates and domain or third-party versions are not generation candidates', () => {
  const legal =
    'format_version 0.1.0; package 18.2.1; RFC-0018; API v2; Node v22; model v3; actions/checkout@v7; riscv64';
  assert.deepEqual(collectCandidates(legal), []);
});

test('all 73 hash-bound retired tokens fail independently', () => {
  assert.equal(authorityTokens.length, 73);
  for (const [index, token] of authorityTokens.entries()) {
    const violations = scanRecords(
      [{ path: `fixtures/authority-${index}.bin`, surface: 'tracked', bytes: token }],
      [],
      authorityTokens,
    );
    assert.ok(
      violations.some((violation) => violation.rule === 'authority-exact-old-token'),
      `authority token ${index} did not fail`,
    );
  }
});

test('exact authority tokens fail on tracked, dry-run, and actual package surfaces', () => {
  for (const surface of ['tracked', 'pack-dry-run', 'packed-tarball']) {
    const violations = scanRecords(
      [{ path: `packages/test/${surface}.bin`, surface, bytes: authorityTokens[0] }],
      [],
      authorityTokens,
    );
    assert.ok(
      violations.some(
        (violation) =>
          violation.rule === 'authority-exact-old-token' && violation.surface === surface,
      ),
    );
  }
});

test('a forged allowlist cannot suppress an exact KDNA-owned authority token', () => {
  const path = 'docs/forged-authority.md';
  const token = authorityTokens[0].toString('utf8');
  const violations = scanRecords(
    [{ path, surface: 'tracked', bytes: authorityTokens[0] }],
    authority(path, token),
    authorityTokens,
  );
  assert.ok(violations.some((violation) => violation.rule === 'authority-exact-old-token'));
});

test('NUL and invalid UTF-8 cannot hide retired tokens in binary CBOR-like content', () => {
  const bytes = Buffer.concat([
    Buffer.from([0xa1, 0x63, 0xff, 0x00]),
    authorityTokens[0],
    Buffer.from([0x00, 0xfe]),
  ]);
  const violations = scanRecords(
    [{ path: 'fixtures/hostile-payload.kdnab', surface: 'tracked', bytes }],
    [],
    authorityTokens,
  );
  assert.ok(violations.some((violation) => violation.rule === 'authority-exact-old-token'));

  const hostilePath = Buffer.concat([
    Buffer.from([0xff, 0x00]),
    authorityTokens[1],
    Buffer.from('.bin'),
  ]);
  const pathViolations = scanRecords(
    [
      {
        path: '<invalid-utf8-test-path>',
        pathBytes: hostilePath,
        surface: 'tracked',
        bytes: Buffer.alloc(0),
      },
    ],
    [],
    authorityTokens,
  );
  assert.ok(pathViolations.some((violation) => violation.rule === 'authority-exact-old-token'));
});

test('stored and deflated KDNA ZIP entries are scanned in memory', () => {
  const archive = buildZip([
    { name: 'stored.bin', method: 0, content: authorityTokens[0] },
    { name: 'deflated.bin', method: 8, content: authorityTokens[1] },
  ]);
  const violations = scanRecords(
    [{ path: 'fixtures/hostile.kdna', surface: 'tracked', bytes: archive }],
    [],
    authorityTokens,
  );
  const entryViolations = violations.filter((violation) =>
    violation.surface.endsWith('-kdna-entry'),
  );
  assert.ok(entryViolations.some((violation) => violation.path.endsWith('!/stored.bin')));
  assert.ok(entryViolations.some((violation) => violation.path.endsWith('!/deflated.bin')));

  const invalidPrefixPath = Buffer.concat([Buffer.from([0xff]), Buffer.from('asset.KDNA')]);
  const invalidPathViolations = scanRecords(
    [
      {
        path: '<invalid-utf8-kdna-path>',
        pathBytes: invalidPrefixPath,
        surface: 'tracked',
        bytes: buildZip([{ name: 'hidden.bin', method: 8, content: authorityTokens[2] }]),
      },
    ],
    [],
    authorityTokens,
  );
  assert.ok(
    invalidPathViolations.some(
      (violation) =>
        violation.surface.endsWith('-kdna-entry') && violation.path.endsWith('!/hidden.bin'),
    ),
  );
});

test('KDNA ZIP parser rejects unsafe paths, duplicates, symlinks, and unsupported methods', () => {
  const cases = [
    buildZip([{ name: '../escape', content: Buffer.alloc(0) }]),
    buildZip([
      { name: 'same', content: Buffer.alloc(0) },
      { name: 'same', content: Buffer.alloc(0) },
    ]),
    buildZip([
      { name: 'link', content: Buffer.alloc(0), externalAttributes: (0o120777 * 0x10000) >>> 0 },
    ]),
    buildZip([{ name: 'method.bin', method: 9, content: Buffer.alloc(0) }]),
  ];
  for (const archive of cases) {
    assert.throws(
      () =>
        scanRecords(
          [{ path: 'fixtures/hostile.kdna', surface: 'tracked', bytes: archive }],
          [],
          authorityTokens,
        ),
      /ZIP entry|unsafe archive path/u,
    );
  }
});

test('KDNA ZIP parser enforces entry-count, entry-size, and compression-ratio limits', () => {
  const cases = [
    buildZip(
      Array.from({ length: 257 }, (_, index) => ({
        name: `entry-${index}`,
        content: Buffer.alloc(0),
      })),
    ),
    buildZip([{ name: 'oversized', content: Buffer.alloc(8 * 1024 * 1024 + 1) }]),
    buildZip([{ name: 'ratio', method: 8, content: Buffer.alloc(256 * 1024) }]),
  ];
  for (const archive of cases) {
    assert.throws(
      () =>
        scanRecords(
          [{ path: 'fixtures/hostile.kdna', surface: 'tracked', bytes: archive }],
          [],
          authorityTokens,
        ),
      /ZIP entry count exceeds|ZIP entry exceeds size or compression-ratio limits/u,
    );
  }
});

test('token authority tampering fails before tokens are trusted', () => {
  const tampered = Buffer.from(tokenAuthorityBytes);
  tampered[tampered.length - 2] ^= 1;
  assert.throws(() => parseTokenAuthority(tampered), /authority file digest mismatch/u);
});

test('public token authority generator is byte-stable and private-input-free at runtime', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-token-authority-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = path.join(root, 'migration.json');
  const output = path.join(root, 'authority.json');
  const generator = fileURLToPath(
    new URL('./generate-post-cutover-token-authority.mjs', import.meta.url),
  );
  fs.writeFileSync(
    source,
    JSON.stringify({
      entries: [
        {
          id: 'test-authority',
          repo: 'open/kdna',
          classification: 'A',
          replacements: authorityTokens.map((token) => ({
            kind: 'token',
            old: token.toString('utf8'),
          })),
        },
      ],
    }),
  );
  const run = (...extra) =>
    spawnSync(process.execPath, [generator, '--source', source, '--output', output, ...extra], {
      encoding: 'utf8',
    });
  const first = run();
  assert.equal(first.status, 0, first.stderr);
  const firstBytes = fs.readFileSync(output);
  const firstHash = createHash('sha256').update(firstBytes).digest('hex');
  assert.deepEqual(firstBytes, tokenAuthorityBytes);
  const second = run();
  assert.equal(second.status, 0, second.stderr);
  assert.equal(createHash('sha256').update(fs.readFileSync(output)).digest('hex'), firstHash);
  const check = run('--check');
  assert.equal(check.status, 0, check.stderr);
});

test('npm tar parser rejects invalid UTF-8 paths before path normalization', () => {
  const name = Buffer.concat([Buffer.from('package/'), Buffer.from([0xff]), Buffer.from('.js')]);
  assert.throws(
    () => safeNpmTarballEntries(buildTarballWithPath(name), 'hostile.tgz'),
    /tar path is not valid UTF-8/u,
  );
});

test('KDNA-owned generation prose, identifiers, paths, and tags fail', () => {
  const identifiers = [
    ['buildRuntimeCapsule', 'V', '2'].join(''),
    ...['Capsule', 'Runtime', 'Host', 'KDNA', 'kdna'].map((name) => [name, 'V', '2'].join('')),
    ['finalize', 'V', '1', 'Layout'].join(''),
    ['read', 'V', '1', 'Layout'].join(''),
    ['cardsFrom', 'V', '1', 'Payload'].join(''),
  ];
  const ownedTag = ['kdna-core-', prefix, '${version}'].join('');
  const records = [
    {
      path: ['docs/core-', prefix, '7.md'].join(''),
      surface: 'tracked',
      text: `${ownedGeneration}\n${identifiers.join('\n')}\n${ownedTag}`,
    },
  ];
  const tokens = scanRecords(records, []).map((violation) => violation.token);
  for (const identifier of identifiers) assert.ok(tokens.includes(identifier));
  assert.ok(tokens.includes(ownedGeneration));
});

test('generation-style route coordinates fail while an exact third-party route can be allowed', () => {
  const ownedRoute = ['/', 'v', '7', '/entitlements/activate'].join('');
  const externalRoute = ['/api/', 'v', '2', '/notifications/preferences'].join('');
  assert.ok(
    collectCandidates(ownedRoute).some(({ rule }) => rule === 'generation-route-coordinate'),
  );

  const path = 'fixtures/third-party-route.json';
  const record = { path, surface: 'tracked', text: externalRoute };
  const exceptions = [
    {
      path,
      token: externalRoute.slice(0, externalRoute.lastIndexOf('/')),
      owner: 'Example notification API',
      reason: 'Third-party API route retained verbatim as interoperability input.',
    },
  ];
  validateAllowlist(exceptions, [record]);
  assert.deepEqual(scanRecords([record], exceptions, []), []);
});

test('release-candidate suffixes without a separator remain generation candidates', () => {
  const candidates = [
    ['Runtime ', prefix, '7', 'rc1'].join(''),
    ['KDNA Core ', prefix.toUpperCase(), '7', 'RC_RELEASE'].join(''),
  ];
  for (const candidate of candidates) {
    assert.equal(collectCandidates(candidate)[0].token, candidate);
  }
});

test('allowlist rejects field drift, weak reasons, stale paths, and stale tokens', () => {
  assert.throws(
    () =>
      parseAllowlist(
        JSON.stringify({
          schema: 'kdna.post-cutover-naming-allowlist',
          schema_version: '0.1.0',
          exceptions: [],
          trusted: true,
        }),
      ),
    /manifest fields are not exact/u,
  );
  assert.throws(
    () =>
      parseAllowlist(
        JSON.stringify({
          schema: 'kdna.post-cutover-naming-allowlist',
          schema_version: '0.1.0',
          exceptions: [{ ...authority()[0], note: 'extra' }],
        }),
      ),
    /fields are not exact/u,
  );
  assert.throws(
    () =>
      parseAllowlist(
        JSON.stringify({
          schema: 'kdna.post-cutover-naming-allowlist',
          schema_version: '0.1.0',
          exceptions: [{ ...authority()[0], reason: 'weak' }],
        }),
      ),
    /not specific enough/u,
  );
  assert.throws(
    () =>
      parseAllowlist(
        JSON.stringify({
          schema: 'kdna.post-cutover-naming-allowlist',
          schema_version: '0.1.0',
          exceptions: [{ ...authority()[0], owner: 'AIKDNA maintainers' }],
        }),
      ),
    /cannot be owned by KDNA/u,
  );
  const tracked = [
    {
      path: 'docs/forged-exception.md',
      surface: 'tracked',
      text: ownedGeneration,
    },
  ];
  assert.throws(
    () => validateAllowlist(authority('docs/moved-exception.md'), tracked),
    /must name one tracked file/u,
  );
  assert.throws(
    () => validateAllowlist(authority(undefined, ['KDNA Core ', prefix, '8'].join('')), tracked),
    /stale/u,
  );
});

test('allowlist rejects self exceptions', () => {
  const self = authority(authorityPath)[0];
  const tracked = [{ path: authorityPath, surface: 'tracked', text: self.token }];
  assert.throws(() => validateAllowlist([self], tracked), /self exception/u);
});

test('allowlist full-tuple authority rejects additions, removals, and modifications', () => {
  const manifest = JSON.parse(
    fs.readFileSync(new URL('./post-cutover-naming-allowlist.json', import.meta.url), 'utf8'),
  );
  assert.doesNotThrow(() => parseAllowlist(JSON.stringify(manifest)));

  const forged = authority()[0];
  const candidate = structuredClone(manifest);
  candidate.exceptions.push(forged);
  assert.throws(() => parseAllowlist(JSON.stringify(candidate)), /authority digest mismatch/u);

  const fixture = [forged];
  const fixtureDigest = allowlistAuthorityDigest(fixture);
  for (const mutation of [
    [],
    [{ ...forged, owner: 'Modified Third Party' }],
    [...fixture, { ...forged, path: 'docs/second-forged-exception.md' }],
  ]) {
    assert.throws(
      () => assertAllowlistAuthority(mutation, fixtureDigest),
      /authority digest mismatch/u,
    );
  }
});

test('a generation token injected only into any publishable tarball surface fails', () => {
  const roots = discoverPackageRoots();
  assert.deepEqual(roots, [
    'examples/typescript-agent',
    'packages/artifact-engine',
    'packages/fidelity-core',
    'packages/kdna',
    'packages/kdna-core',
    'packages/kdna-eval',
  ]);
  const records = roots.map((root) => ({
    path: `${root}/README.md`,
    surface: 'packed-tarball',
    text: ownedGeneration,
  }));
  const violations = scanRecords(records, []);
  assert.equal(violations.length, roots.length);
  assert.ok(violations.every((violation) => violation.surface === 'packed-tarball'));
});
