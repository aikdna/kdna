#!/usr/bin/env node
// Negative controls for scripts/check-packaged-readme.mjs.
//
// The gate exists because a published tarball's README is immutable while the
// publication state it described is not. Each refused pattern gets a case here,
// the exact text the registry served for Core 0.37.7 is kept as a regression
// fixture, and the published-read path is exercised against a synthetic tarball
// so the archive member is really extracted rather than assumed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync, gzipSync } from 'node:zlib';
import {
  STATE_CLAIM_PATTERNS,
  checkPublished,
  checkSource,
  evaluateLegacy,
  evaluatePackagedReadme,
  loadLegacy,
  loadMatrix,
  readPackedMember,
} from './check-packaged-readme.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(ROOT, path), 'utf8');
const matrix = loadMatrix(read);

// The README bytes the registry served inside @aikdna/kdna-core@0.37.7. They
// name 0.37.6 as stable and 0.37.7 as an unpublished candidate, inside the
// 0.37.7 tarball. Kept verbatim as the regression fixture for this gate.
const PUBLISHED_CORE_0_37_7_README = `# KDNA Core — R2 candidate

Stable distribution: package \`0.37.6\` on \`latest\`, paired with exact Read
\`0.13.0\`.
The current source carries the next candidate pair -- package \`0.37.7\` with
exact Read \`0.13.1\`. This source candidate is not yet published;
its own exact release and registry acquisition must be verified first.
`;

function tarEntry(name, text) {
  const body = Buffer.from(text, 'utf8');
  const header = Buffer.alloc(512);
  header.write(name, 0, 100, 'utf8');
  header.write('0000644\0', 100, 8, 'utf8');
  header.write('0000000\0', 108, 8, 'utf8');
  header.write('0000000\0', 116, 8, 'utf8');
  header.write(`${body.length.toString(8).padStart(11, '0')}\0`, 124, 12, 'utf8');
  header.write('00000000000\0', 136, 12, 'utf8');
  header.write('        ', 148, 8, 'utf8');
  header.write('0', 156, 1, 'utf8');
  header.write('ustar\0' + '00', 257, 8, 'utf8');
  const padding = Buffer.alloc((512 - (body.length % 512)) % 512);
  return Buffer.concat([header, body, padding]);
}

function packedTarball(members) {
  return gzipSync(
    Buffer.concat([...members.map(([name, text]) => tarEntry(name, text)), Buffer.alloc(1024)]),
  );
}

test('the in-repository packaged READMEs name their own version and state no publication status', () => {
  assert.deepEqual(checkSource({ readText: read }), []);
});

test('source mode covers every non-private workspace package, not a hand-kept list', () => {
  const packages = ['kdna', 'kdna-core', 'kdna-read', 'artifact-engine'];
  const privatePackages = new Set(['artifact-engine']);
  const manifests = {
    kdna: { name: '@aikdna/kdna', version: '0.14.0' },
    'kdna-core': { name: '@aikdna/kdna-core', version: '0.37.7' },
    'kdna-read': { name: '@aikdna/kdna-read', version: '0.13.1' },
    'artifact-engine': { name: '@aikdna/kdna-artifact-engine', version: '0.1.0', private: true },
  };
  const findings = checkSource({
    readText: (path) => {
      if (path === 'docs/release-coordinates.json') return read(path);
      if (path.endsWith('package.json')) {
        const name = path.split('/')[1];
        return JSON.stringify({ ...manifests[name], private: privatePackages.has(name) });
      }
      const name = path.split('/')[1];
      // Only the alias package carries the state claim; the private package
      // must not be scanned at all, so its own state claim stays invisible.
      return name === 'kdna'
        ? 'Package `0.14.0`. New integrations should use the next candidate `0.15.0`.\n'
        : `Package \`${manifests[name].version}\`.\n`;
    },
    listPackageDirs: () => packages,
  });
  assert.deepEqual(
    findings.map((finding) => [finding.rule, finding.label]),
    [['publication-state', 'packages/kdna/README.md (@aikdna/kdna@0.14.0)']],
  );
});

test('the served coordinates of the legacy list match the release matrix', () => {
  assert.deepEqual(evaluateLegacy(loadLegacy(read), matrix), []);
});

test('the tarball text actually served for Core 0.37.7 is rejected', () => {
  const findings = evaluatePackagedReadme({
    readme: PUBLISHED_CORE_0_37_7_README,
    name: '@aikdna/kdna-core',
    version: '0.37.7',
  });
  assert.deepEqual(
    findings.filter((finding) => finding.rule === 'identity'),
    [],
    'the published text does name its own version; the defect is the state claim',
  );
  for (const phrase of [
    'latest',
    'not yet published',
    'next candidate',
    'source candidate',
    'R2 candidate',
    'Stable distribution',
    'carries the next',
  ]) {
    assert.ok(
      findings.some(
        (finding) => finding.rule === 'publication-state' && finding.detail.includes(phrase),
      ),
      `the gate must refuse "${phrase}"`,
    );
  }
});

for (const [pattern, reason] of STATE_CLAIM_PATTERNS) {
  test(`refuses a packaged README that states "${pattern.source}"`, () => {
    const readme = `# Sample\n\nPackage \`1.2.3\`.\n\nOne sentence states ${pattern.source.replaceAll('\\b', '')} here.\n`;
    const findings = evaluatePackagedReadme({
      readme,
      name: '@aikdna/sample',
      version: '1.2.3',
      label: 'sample',
    });
    assert.deepEqual(findings, [
      {
        rule: 'publication-state',
        label: 'sample',
        detail: `states "${pattern.exec(readme)[0]}": ${reason}`,
      },
    ]);
  });
}

test('refuses a packaged README that never names its own version', () => {
  const findings = evaluatePackagedReadme({
    readme: '# KDNA Core\n\nCore `0.37.6` paired with Read `0.13.0`.\n',
    name: '@aikdna/kdna-core',
    version: '0.37.7',
  });
  assert.deepEqual(findings, [
    {
      rule: 'identity',
      label: '@aikdna/kdna-core',
      detail: 'does not name its own version 0.37.7',
    },
  ]);
});

test('a longer number does not satisfy the identity rule', () => {
  const findings = evaluatePackagedReadme({
    readme: 'Read `10.13.10` and Read `0.13.10` are different coordinates.\n',
    name: '@aikdna/kdna-read',
    version: '0.13.1',
  });
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, 'identity');
});

test('the packed README member is extracted from the real archive layout', () => {
  const archive = packedTarball([
    ['package/package.json', '{"name":"@aikdna/sample","version":"1.2.3"}'],
    ['package/README.md', 'Package `1.2.3`.\n'],
    ['package/NOTICE', 'notice\n'],
  ]);
  const bytes = readPackedMember(gunzipSync(archive), 'package/README.md');
  assert.equal(bytes, 'Package `1.2.3`.\n');
  assert.equal(readPackedMember(gunzipSync(archive), 'package/CHANGELOG.md'), null);
});

test('a stale legacy entry is a finding, never an exemption', () => {
  const findings = evaluateLegacy(
    [
      { name: '@aikdna/kdna-core', version: '0.37.6', recorded: '2026-10-16', reason: 'x' },
      { name: '@aikdna/kdna-read', version: '0.13.1', recorded: '2026-10-16', reason: 'x' },
      { name: '@aikdna/kdna-read', version: '0.13.1', recorded: '2026-10-16', reason: 'x' },
      { name: '@aikdna/kdna-cli', version: '0.43.0', recorded: '2026-10-16' },
      { name: '@aikdna/kdna-cli', version: '0.43.0', recorded: '2026-10-16', reason: 'x' },
    ],
    matrix,
  );
  assert.ok(
    findings.some((finding) =>
      finding.detail.includes('@aikdna/kdna-core@0.37.6: the matrix serves 0.37.7'),
    ),
  );
  assert.ok(findings.some((finding) => finding.detail.includes('duplicate legacy entry')));
  assert.ok(
    findings.some((finding) => finding.detail.includes('needs a reason and a recorded date')),
  );
});

test('published mode reads the tarball it is given and reports an unreadable coordinate', async () => {
  const compliant = new Map([
    [
      'https://registry.npmjs.org/@aikdna%2Fkdna-core',
      Buffer.from(
        JSON.stringify({
          versions: {
            '0.37.7': { dist: { tarball: 'https://registry.test/core-0.37.7.tgz' } },
          },
        }),
      ),
    ],
    [
      'https://registry.test/core-0.37.7.tgz',
      packedTarball([
        ['package/README.md', '# KDNA Core\n\nPackage `@aikdna/kdna-core` version `0.37.7`.\n'],
      ]),
    ],
  ]);
  const onlyCore = { ...matrix, packages: matrix.packages.slice(0, 2) };
  const findings = await checkPublished(onlyCore, [], {
    fetchBytes: async (url) => {
      const found = compliant.get(url);
      if (found) return found;
      throw new Error(`${url}: HTTP 404`);
    },
  });
  assert.deepEqual(
    findings.filter((finding) => finding.label === '@aikdna/kdna-core@0.37.7 tarball README'),
    [],
  );
  assert.deepEqual(findings, [
    {
      rule: 'published',
      label: '@aikdna/kdna-read@0.13.1',
      detail: 'unreadable: https://registry.npmjs.org/@aikdna%2Fkdna-read: HTTP 404',
    },
  ]);
});

test('published mode refuses a stale tarball README instead of trusting the source', async () => {
  const stale = packedTarball([['package/README.md', PUBLISHED_CORE_0_37_7_README]]);
  const findings = await checkPublished({ ...matrix, packages: [matrix.packages[0]] }, [], {
    fetchBytes: async (url) =>
      url.endsWith('.tgz')
        ? stale
        : Buffer.from(
            JSON.stringify({
              versions: {
                '0.37.7': { dist: { tarball: 'https://registry.test/core-0.37.7.tgz' } },
              },
            }),
          ),
  });
  assert.ok(findings.filter((finding) => finding.rule === 'publication-state').length >= 7);
});
