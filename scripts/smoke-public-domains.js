#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const cases = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'tests', 'public-domain-smoke.json'), 'utf8'),
);
const domainIds = cases.map((c) => c.id);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function words(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);
}

function score(domain, input) {
  const haystack = words(input);
  const set = new Set(haystack);
  let total = 0;

  for (const kw of domain.keywords || []) {
    const parts = words(kw);
    if (parts.length && parts.every((part) => set.has(part))) total += 8;
    for (const part of parts) if (set.has(part)) total += 2;
  }

  for (const part of words(domain.id)) if (set.has(part)) total += 5;
  for (const part of words(domain.name)) if (set.has(part)) total += 5;
  for (const part of words(domain.description)) if (set.has(part)) total += 1;
  for (const part of words(domain.core_insight)) if (set.has(part)) total += 2;

  return total;
}

function loadDomain(id) {
  const dir = path.join(root, `kdna-${id}`);
  const manifest = readJson(path.join(dir, 'kdna.json'));
  const files = fs.readdirSync(dir).filter((f) => /^KDNA_.*\.json$/.test(f));
  if (files.length !== manifest.file_count) {
    throw new Error(`${id}: manifest file_count=${manifest.file_count}, actual=${files.length}`);
  }
  const text = files
    .map((file) => fs.readFileSync(path.join(dir, file), 'utf8'))
    .join('\n')
    .toLowerCase();
  return { ...manifest, id, dir, text };
}

const domains = domainIds.map(loadDomain);
let failures = 0;

for (const c of cases) {
  const ranked = domains
    .map((domain) => ({ domain, score: score(domain, c.input) }))
    .sort((a, b) => b.score - a.score);
  const winner = ranked[0];

  if (winner.domain.id !== c.id) {
    console.error(
      `${c.id}: expected top match, got ${winner.domain.id} (${winner.score}) for "${c.input}"`,
    );
    failures++;
  }

  const domain = domains.find((d) => d.id === c.id);
  for (const term of c.expected_terms) {
    if (!domain.text.includes(term.toLowerCase())) {
      console.error(`${c.id}: expected term missing from domain files: ${term}`);
      failures++;
    }
  }
}

if (failures) process.exit(1);
console.log(`Public domain smoke tests passed: ${cases.length} cases`);
