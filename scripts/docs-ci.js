#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const DOCS_DIR = path.resolve(__dirname, '..', 'docs');
let failures = 0;

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  PASS: ${name}`);
    return true;
  }
  console.error(`  FAIL: ${name}${detail ? ' — ' + detail : ''}`);
  failures++;
  return false;
}

function walkDocs(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.')) {
      files.push(...walkDocs(path.join(dir, entry.name)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

console.log('── Link validation');

const docsFiles = walkDocs(DOCS_DIR);
const httpLink = /\]\(https?:\/\/([^)]+)\)/g;
const relativeLink = /\]\((\/[^)]+)\)/g;

for (const file of docsFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(DOCS_DIR, file);

  for (const match of content.matchAll(relativeLink)) {
    const target = match[1];
    check(
      `${rel} → ${target}`,
      /^[a-z0-9/_-]+(#[a-z0-9_-]+)?$/.test(target) && target.startsWith('/'),
      `non-standard relative link`,
    );
  }
}

console.log('── Package version freshness');

const packages = [
  ['@aikdna/kdna-cli', '0.28.35'],
  ['@aikdna/kdna-core', '0.15.10'],
  ['@aikdna/kdna-studio-cli', '0.8.12'],
  ['@aikdna/kdna-studio-core', '1.7.10'],
  ['@aikdna/kdna-web-client', '0.1.0'],
  ['@aikdna/kdna-web-server', '0.1.0'],
  ['@aikdna/kdna-react', '0.1.0'],
  ['create-kdna-web-app', '0.1.1'],
];

for (const [name, expected] of packages) {
  try {
    const actual = execSync(`npm view ${name} version`, {
      encoding: 'utf8',
      timeout: 15000,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    check(
      `${name} latest is ${expected}`,
      actual === expected,
      `npm says ${actual}`,
    );
  } catch (e) {
    check(`${name} is published`, false, e.message.slice(0, 80));
  }
}

console.log('── Code block integrity');

const bashFence = /```bash\n([\s\S]*?)```/g;
for (const file of docsFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(DOCS_DIR, file);
  for (const match of content.matchAll(bashFence)) {
    const block = match[1].trim();
    const lines = block.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
    for (const line of lines) {
      check(
        `${rel}: \`${line.slice(0, 60)}\``,
        line.trim().length > 0,
      );
    }
  }
}

console.log('── No internal workspace paths');

for (const file of docsFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(DOCS_DIR, file);
  const internalRefs = content.match(/\/Users\/(AI|zhangling)\/K\/(OPEN|PRIVATE)\//g);
  const leaked = internalRefs ? internalRefs.length : 0;
  check(
    `${rel}: no internal workspace paths`,
    leaked === 0,
    `found ${leaked} reference(s)`,
  );
}

console.log(`\n${failures === 0 ? 'All docs checks passed.' : `${failures} check(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);
