#!/usr/bin/env node
// Compares docs/release-coordinates.json with the live public registry.
//
//   node scripts/check-published-coordinates.mjs            # version + dist-tag
//   node scripts/check-published-coordinates.mjs --bytes     # also download and hash
//
// Network is required; the registry is read with a cache-busting query so a
// stale local npm cache cannot turn a missing publication into a pass.
//
// Two kinds of rows are checked:
//   * published coordinates - the matrix must agree with the live registry
//     (version, dist-tag, preserved preview tags, and with --bytes the exact
//     published bytes);
//   * current-state fields that move on their own - a Git-channel main commit and
//     an MCP release version are declarations about refs that advance without a
//     KDNA release, so they are compared with their live source here rather than
//     left to rot in a rendered statement.
//
// An unreachable registry, API or ref is a failure with the exact HTTP status in
// the message; this gate never passes silently because it could not read.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const matrix = JSON.parse(readFileSync(join(ROOT, 'docs/release-coordinates.json'), 'utf8'));
const checkBytes = process.argv.includes('--bytes');
const failures = [];

// Current-state rows of the matrix: a value that is a statement about a ref that
// moves outside a KDNA release. Each row says which live source answers it.
// `mcpReleaseVersions` is in the releases API's own order (newest first), so the
// newest release is picked by the API's ordering rather than by inventing a
// version comparison. A pure function, so the negative cases run without network.
export function evaluateCurrentState({ matrix, skillsMainCommit, mcpReleaseVersions }) {
  const findings = [];
  for (const row of matrix.git_only ?? []) {
    if (typeof row.main_commit === 'string' && skillsMainCommit !== undefined) {
      if (skillsMainCommit !== row.main_commit) {
        findings.push(
          `${row.name}: declared main_commit ${row.main_commit} but the live main is ${skillsMainCommit}`,
        );
      }
    }
    if (typeof row.mcp_version === 'string' && mcpReleaseVersions !== undefined) {
      const newest = mcpReleaseVersions.filter((version) => typeof version === 'string')[0] ?? null;
      if (newest === null) {
        findings.push(
          `${row.name}: no MCP release was observed to compare with ${row.mcp_version}`,
        );
      } else if (newest !== row.mcp_version) {
        findings.push(
          `${row.name}: declared mcp_version ${row.mcp_version} but the newest MCP release is ${newest}`,
        );
      }
    }
  }
  return findings;
}

function githubHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'aikdna-coordinate-check',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

async function githubJson(url) {
  const response = await fetch(url, {
    headers: githubHeaders(),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

// The MCP line is delivered through GitHub releases; its version is a
// current-state declaration, so the newest released tag is the live answer.
const MCP_TAG_PREFIX = 'kdna-mcp-server-';

async function readCurrentState(matrix) {
  const row = (matrix.git_only ?? [])[0];
  if (!row) return { skillsMainCommit: undefined, mcpReleaseVersions: undefined };
  const repository = row.name;
  const commit = await githubJson(`https://api.github.com/repos/${repository}/commits/main`);
  const releases = await githubJson(
    `https://api.github.com/repos/${repository}/releases?per_page=100`,
  );
  return {
    skillsMainCommit: commit.sha,
    mcpReleaseVersions: releases
      .filter(
        (release) =>
          release.draft === false &&
          typeof release.tag_name === 'string' &&
          release.tag_name.startsWith(MCP_TAG_PREFIX),
      )
      .map((release) => release.tag_name.slice(MCP_TAG_PREFIX.length)),
  };
}

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

try {
  const observed = await readCurrentState(matrix);
  failures.push(...evaluateCurrentState({ matrix, ...observed }));
} catch (error) {
  failures.push(`current-state fields unreadable: ${error.message}`);
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
