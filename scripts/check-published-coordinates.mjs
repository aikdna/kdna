#!/usr/bin/env node
// Compares docs/release-coordinates.json with the live public registry.
//
//   node scripts/check-published-coordinates.mjs            # version + dist-tag
//   node scripts/check-published-coordinates.mjs --bytes     # also download and hash
//
// Network is required; the registry is read with a cache-busting query so a
// stale local npm cache cannot turn a missing publication into a pass.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const matrix = JSON.parse(readFileSync(join(ROOT, 'docs/release-coordinates.json'), 'utf8'));
const checkBytes = process.argv.includes('--bytes');
const failures = [];

async function packument(name) {
  const url = `${matrix.registry}${name.replaceAll('/', '%2F')}?cachebust=${Date.now()}`;
  const response = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
  if (!response.ok) throw new Error(`registry read failed for ${name}: ${response.status}`);
  return response.json();
}

for (const entry of matrix.packages) {
  let document;
  try {
    document = await packument(entry.name);
  } catch (error) {
    failures.push(`${entry.name}: ${error.message}`);
    continue;
  }
  const published = document.versions?.[entry.version];
  if (!published) {
    failures.push(`${entry.name}@${entry.version}: version is not published`);
    continue;
  }
  // A declared source candidate is a version the source produces but the
  // registry has not published. Once it appears on the registry it must be
  // promoted to `version`, so a candidate can never stay declared while already
  // being served, and a published coordinate can never be a candidate restated.
  if (typeof entry.candidate_version === 'string') {
    const candidate = document.versions?.[entry.candidate_version];
    if (candidate) {
      failures.push(
        `${entry.name}@${entry.candidate_version}: declared as an unpublished candidate but the registry serves it; promote it to version`,
      );
    }
  }
  const tag = document['dist-tags']?.[entry.npm_tag];
  if (tag !== entry.version) {
    failures.push(
      `${entry.name}: npm tag ${entry.npm_tag} is ${tag}, matrix expects ${entry.version}`,
    );
  }
  if (checkBytes) {
    const url = published.dist.tarball;
    const response = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
    if (!response.ok) {
      failures.push(`${entry.name}@${entry.version}: tarball fetch failed (${response.status})`);
    } else {
      const bytes = Buffer.from(await response.arrayBuffer());
      const digest = createHash('sha256').update(bytes).digest('hex');
      if (digest !== entry.artifact_sha256) {
        failures.push(
          `${entry.name}@${entry.version}: published bytes ${digest} differ from the matrix`,
        );
      }
    }
  }
}

for (const [name, tags] of Object.entries(matrix.preserved_preview_tags)) {
  let document;
  try {
    document = await packument(name);
  } catch (error) {
    failures.push(`${name}: preview tag read failed (${error.message})`);
    continue;
  }
  for (const [tag, version] of Object.entries(tags)) {
    const observed = document['dist-tags']?.[tag];
    if (observed !== version) {
      failures.push(`${name}: preview tag ${tag} is ${observed}, matrix expects ${version}`);
    }
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `published coordinates match the matrix (${matrix.packages.length} packages, bytes ${
      checkBytes ? 'verified' : 'not checked'
    })`,
  );
}
