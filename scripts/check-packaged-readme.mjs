#!/usr/bin/env node
// Packaged-README consistency gate.
//
// Why it exists: the README inside a published tarball is immutable, but the
// publication state it used to describe is not. A package README written at the
// candidate commit could read "0.42.0 is published on `latest` ... the current
// source carries the next candidate `0.43.0` ... it is not yet published", and
// the release chain packs the tarball from that exact tag commit. The artifact
// therefore shipped a README that denied its own publication, and every later
// reader saw the same false statement.
//
// The rule this gate enforces:
//   1. identity: the packaged README must name the exact version it ships with,
//      matching its own package.json;
//   2. no moving publication state: the packaged README must not name the
//      `latest` dist-tag or describe any version as published, unpublished or a
//      candidate. Which coordinate a registry serves changes after the artifact
//      is frozen, so that statement belongs to the generated status surface -
//      the release-coordinates block in README.md, rendered from
//      docs/release-coordinates.json by scripts/render-release-coordinates.mjs.
//
// Modes:
//   --source      (default) check the in-repository READMEs of the packages the
//                 release matrix declares in this repository, against their own
//                 package.json. Offline; safe for CI and pre-release use.
//   --published   download every published coordinate's tarball from the
//                 registry and check the README bytes the registry actually
//                 serves, which is the only surface a consumer reads.
//   --report-only print findings and exit 0. This never hides a finding: the
//                 published coordinates that predate this rule are named
//                 individually in docs/packaged-readme-legacy-claims.json.
//
// usage: node scripts/check-packaged-readme.mjs [--source|--published] [--report-only] [--root <dir>]
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

// Publication-state vocabulary. Each entry is a distinct way a packaged README
// can contradict the artifact's own frozen bytes, so each one is refused and
// each one has its own negative case in scripts/check-packaged-readme.test.mjs.
export const STATE_CLAIM_PATTERNS = Object.freeze([
  [/\blatest\b/iu, 'names the `latest` dist-tag, which moves after this artifact is frozen'],
  [/\bnot yet published\b/iu, 'states an unpublished status this artifact cannot keep true'],
  [/\bunpublished\b/iu, 'states an unpublished status this artifact cannot keep true'],
  [/\bnext candidate\b/iu, 'describes a moving candidate window'],
  [/\bsource candidate\b/iu, 'describes a moving candidate window'],
  [/\bcurrent candidate\b/iu, 'describes a moving candidate window'],
  [/\bR2 candidate\b/iu, 'labels the artifact as a candidate rather than the version it is'],
  [/\bstable distribution\b/iu, 'names a moving stable-distribution coordinate'],
  [/\bcarries the next\b/iu, 'describes this source as a leading candidate'],
  [/\bwill be published\b/iu, 'promises a future publication this artifact cannot verify'],
  [/\bpublished on\b/iu, 'names the registry state a consumer observes, not this artifact'],
]);

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MATRIX_PATH = 'docs/release-coordinates.json';
const LEGACY_PATH = 'docs/packaged-readme-legacy-claims.json';
const LEGACY_SCHEMA = 'kdna-packaged-readme-legacy-claims/1';
// The README member of the retained archive of an npm pack: `package/README.md`.
const PACKED_README_PATH = 'package/README.md';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

// A version match must not be a prefix or suffix of a longer number, so
// `0.13.1` cannot be satisfied by `10.13.10` or by `0.13.10`.
export function versionPattern(version) {
  return new RegExp(`(?<![0-9.])${escapeRegExp(version)}(?![0-9.-])`, 'u');
}

// Rules 1 and 2 for one packaged README. `version` is the version the artifact
// declares (package.json in source mode, the matrix coordinate in published
// mode); `name` is used only to make the finding self-describing.
export function evaluatePackagedReadme({ readme, name, version, label = name }) {
  const findings = [];
  if (!versionPattern(version).test(readme)) {
    findings.push({
      rule: 'identity',
      label,
      detail: `does not name its own version ${version}`,
    });
  }
  for (const [pattern, reason] of STATE_CLAIM_PATTERNS) {
    const match = pattern.exec(readme);
    if (match) {
      findings.push({
        rule: 'publication-state',
        label,
        detail: `states "${match[0]}": ${reason}`,
      });
    }
  }
  return findings;
}

// Minimal tar reader for one regular-file member. npm pack archives are
// ustar/PAX with short `package/...` names, so the 512-byte header fields are
// enough; other member types are skipped rather than interpreted.
export function readPackedMember(tarBytes, wantedPath) {
  let offset = 0;
  while (offset + 512 <= tarBytes.length) {
    const header = tarBytes.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) return null;
    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/su, '');
    const size = Number.parseInt(
      header.subarray(124, 136).toString('utf8').replace(/\0.*$/su, '').trim() || '0',
      8,
    );
    const body = tarBytes.subarray(offset + 512, offset + 512 + size);
    if (name === wantedPath) return body.toString('utf8');
    offset += 512 + Math.ceil((Number.isFinite(size) ? size : 0) / 512) * 512;
  }
  return null;
}

function readJson(readText, path) {
  return JSON.parse(readText(path));
}

export function loadMatrix(readText) {
  const matrix = readJson(readText, MATRIX_PATH);
  if (matrix.schema !== 'kdna-release-coordinates/1') {
    throw new Error(`${MATRIX_PATH}: unexpected schema ${matrix.schema}`);
  }
  return matrix;
}

export function loadLegacy(readText) {
  const document = readJson(readText, LEGACY_PATH);
  if (document.schema !== LEGACY_SCHEMA) {
    throw new Error(`${LEGACY_PATH}: unexpected schema ${document.schema}`);
  }
  if (!Array.isArray(document.coordinates)) {
    throw new Error(`${LEGACY_PATH}: coordinates must be an array`);
  }
  return document.coordinates;
}

// A legacy entry excuses exactly one immutable published coordinate. It must
// name the coordinate the matrix currently carries for that package, so the
// entry stops matching as soon as the unit publishes again and has to be
// deleted. An entry that matches nothing is a finding, not a silent pass.
export function evaluateLegacy(legacy, matrix) {
  const findings = [];
  const current = new Map(matrix.packages.map((row) => [row.name, row.version]));
  const seen = new Set();
  for (const entry of legacy) {
    const key = `${entry?.name}@${entry?.version}`;
    if (seen.has(key)) findings.push({ rule: 'legacy', detail: `${key}: duplicate legacy entry` });
    seen.add(key);
    if (!entry?.reason || !entry?.recorded) {
      findings.push({ rule: 'legacy', detail: `${key}: needs a reason and a recorded date` });
    }
    if (current.get(entry?.name) !== entry?.version) {
      findings.push({
        rule: 'legacy',
        detail: `${key}: the matrix serves ${current.get(entry?.name) ?? 'no such package'}, so this entry is stale and must be removed`,
      });
    }
  }
  return findings;
}

export function checkSource({ root = ROOT, readText, listPackageDirs } = {}) {
  const read =
    readText ?? ((path) => readFileSync(path.startsWith('/') ? path : join(root, path), 'utf8'));
  const list =
    listPackageDirs ??
    ((dir) =>
      readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort());
  const findings = [];
  // Every non-private workspace package ships its README inside its published
  // tarball, so the rule covers all of them. A package that stops being private
  // becomes covered without editing this script.
  for (const name of list(join(root, 'packages'))) {
    const packageDir = `packages/${name}`;
    let manifest;
    try {
      manifest = JSON.parse(read(`${packageDir}/package.json`));
    } catch {
      continue;
    }
    if (manifest.private === true) continue;
    const readmePath = `${packageDir}/README.md`;
    findings.push(
      ...evaluatePackagedReadme({
        readme: read(readmePath),
        name: manifest.name,
        version: manifest.version,
        label: `${readmePath} (${manifest.name}@${manifest.version})`,
      }),
    );
  }
  // The release matrix and the workspace manifests describe the same releases,
  // so a disagreement between them is a finding here rather than a silent
  // preference for one of the two.
  const matrix = loadMatrix(read);
  for (const row of matrix.packages.filter((entry) => entry.repository === 'aikdna/kdna')) {
    const packageDir = `packages/kdna-${row.unit}`;
    const manifest = JSON.parse(read(`${packageDir}/package.json`));
    if (manifest.name !== row.name || manifest.version !== row.version) {
      findings.push({
        rule: 'matrix-source',
        label: packageDir,
        detail: `declares ${manifest.name}@${manifest.version}, the matrix declares ${row.name}@${row.version}`,
      });
    }
  }
  return findings;
}

async function fetchBytes(url) {
  const response = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

export async function checkPublished(matrix, legacy, options = {}) {
  const fetchBytesImpl = options.fetchBytes ?? fetchBytes;
  const findings = evaluateLegacy(legacy, matrix);
  const excused = new Set(legacy.map((entry) => `${entry?.name}@${entry?.version}`));
  for (const row of matrix.packages) {
    const coordinate = `${row.name}@${row.version}`;
    if (excused.has(coordinate)) continue;
    let readme;
    try {
      const packument = JSON.parse(
        (await fetchBytesImpl(`${matrix.registry}${row.name.replaceAll('/', '%2F')}`)).toString(
          'utf8',
        ),
      );
      const published = packument.versions?.[row.version];
      if (!published?.dist?.tarball) throw new Error('declared version is not published');
      readme = readPackedMember(
        gunzipSync(await fetchBytesImpl(published.dist.tarball)),
        PACKED_README_PATH,
      );
      if (readme === null) throw new Error(`${PACKED_README_PATH} is missing from the tarball`);
    } catch (error) {
      findings.push({
        rule: 'published',
        label: coordinate,
        detail: `unreadable: ${error.message}`,
      });
      continue;
    }
    findings.push(
      ...evaluatePackagedReadme({
        readme,
        name: row.name,
        version: row.version,
        label: `${coordinate} tarball README`,
      }),
    );
  }
  return findings;
}

async function main(argv) {
  const reportOnly = argv.includes('--report-only');
  const publishedMode = argv.includes('--published');
  const rootIndex = argv.indexOf('--root');
  const root = rootIndex < 0 ? ROOT : resolve(argv[rootIndex + 1]);
  const read = (path) => readFileSync(path.startsWith('/') ? path : join(root, path), 'utf8');
  let findings;
  let surface;
  if (publishedMode) {
    surface = 'published tarball READMEs from the registry';
    findings = await checkPublished(loadMatrix(read), loadLegacy(read));
  } else {
    surface = 'in-repository packaged READMEs';
    findings = checkSource({ root, readText: read });
  }
  for (const finding of findings) {
    console.error(`FAIL [${finding.rule}] ${finding.label}: ${finding.detail}`);
  }
  if (findings.length > 0) {
    console.error(
      `packaged-readme: ${findings.length} finding(s) on ${surface}` +
        (reportOnly ? ' (report-only)' : ''),
    );
    process.exitCode = reportOnly ? 0 : 1;
    return;
  }
  console.log(`packaged-readme: ${surface} name their own version and state no publication status`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}
