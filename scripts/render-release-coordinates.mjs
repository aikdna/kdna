#!/usr/bin/env node
// Renders the public coordinate block from docs/release-coordinates.json.
//
//   node scripts/render-release-coordinates.mjs --write   # update README + snippet
//   node scripts/render-release-coordinates.mjs --check   # fail on drift
//
// The block is the only place README.md names published versions, so a version
// change happens once in the matrix instead of in prose.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MATRIX_PATH = join(ROOT, 'docs/release-coordinates.json');
const README_PATH = join(ROOT, 'README.md');
const SNIPPET_PATH = join(ROOT, 'docs/release-coordinates.snippet.md');
const BEGIN = '<!-- release-coordinates:begin';
const END = '<!-- release-coordinates:end -->';

const matrix = JSON.parse(readFileSync(MATRIX_PATH, 'utf8'));
if (matrix.schema !== 'kdna-release-coordinates/1') {
  throw new Error('release-coordinates.json schema mismatch');
}

function renderBlock() {
  const rows = matrix.packages.map(
    (entry) =>
      `| \`${entry.name}\` | \`${entry.version}\` | \`${entry.npm_tag}\` | \`${entry.artifact_sha256}\` |`,
  );
  return [
    `**Current publication state (${matrix.updated}).** All five stable coordinates are`,
    'published from their reviewed source commits, and each published tarball was',
    're-downloaded from the registry and matched byte for byte against the retained',
    'artifact:',
    '',
    '| Package | Version | npm tag | Published artifact SHA-256 |',
    '| --- | --- | --- | --- |',
    ...rows,
    '',
    `MCP remains a Git source channel (main \`${matrix.git_only[0].main_commit}\`) and adds no`,
    'npm coordinate in this wave. Exact source commits, release runs, preserved preview',
    'tags and per-package release identities are in [release-coordinates.json](./docs/release-coordinates.json);',
    'earlier `latest` values stay in the',
    '[distribution history](./docs/current-release-support.md#published-channel-history).',
  ].join('\n');
}

function replaceBlock(text, block, label) {
  const start = text.indexOf(BEGIN);
  const end = text.indexOf(END);
  if (start < 0 || end < 0 || end < start) {
    throw new Error(`${label} has no rendered coordinate block`);
  }
  const head = text.slice(0, start);
  const marker = text.slice(start, text.indexOf('\n', start));
  const tail = text.slice(end + END.length);
  return `${head}${marker}\n${block}\n${END}${tail}`;
}

const block = renderBlock();
const mode = process.argv.includes('--write') ? 'write' : 'check';
const readme = readFileSync(README_PATH, 'utf8');
const rendered = replaceBlock(readme, block, 'README.md');
const snippet = `<!-- Generated from docs/release-coordinates.json by scripts/render-release-coordinates.mjs; do not edit by hand. -->\n\n${block}\n`;

if (mode === 'write') {
  writeFileSync(README_PATH, rendered);
  writeFileSync(SNIPPET_PATH, snippet);
  console.log(
    'release coordinates rendered into README.md and docs/release-coordinates.snippet.md',
  );
} else {
  const problems = [];
  if (rendered !== readme) problems.push('README.md coordinate block is stale');
  let currentSnippet = '';
  try {
    currentSnippet = readFileSync(SNIPPET_PATH, 'utf8');
  } catch {
    problems.push('docs/release-coordinates.snippet.md is missing');
  }
  if (currentSnippet && currentSnippet !== snippet) problems.push('snippet is stale');
  if (problems.length) {
    console.error(problems.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('release coordinates are in sync with the matrix');
  }
}
