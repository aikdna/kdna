#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { currentPublishedPackages } = require('./ecosystem-manifest');

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

console.log('── Agent entry batch route');

const agentEntry = fs.readFileSync(path.join(DOCS_DIR, 'agent-entry.md'), 'utf8');
check(
  'agent-entry.md links the complete multi-select session request example',
  agentEntry.includes('multi.requests.jsonl'),
);
check(
  'agent-entry.md names selection.judgment_ids for multi-judgment requests',
  agentEntry.includes('selection.judgment_ids'),
);
check(
  'agent-entry.md explains that whole_asset may defer judgment bodies',
  agentEntry.includes('zero judgment bodies inline'),
);
check(
  'agent-entry.md shows the published CLI install coordinate',
  agentEntry.includes('@aikdna/kdna-cli@0.43.2'),
);
check(
  'agent-entry.md shows the same-session multi-select route',
  agentEntry.includes('multi.requests.jsonl') && agentEntry.includes('--session --allow-read'),
);
check(
  'agent-entry.md provides generic 2-line session template with inspect tuple and catalog placeholders',
  agentEntry.includes('<tuple-object-from-kdna-inspect>') &&
    agentEntry.includes('<asset-id-from-catalog>') &&
    agentEntry.includes('<asset-version-from-catalog>') &&
    agentEntry.includes('"judgment_ids": ["<needed-id-1>", "<needed-id-2>"]'),
);
check(
  'agent-entry.md provides step-by-step route inspect -> catalog -> session read',
  agentEntry.includes('inspect --json') &&
    agentEntry.includes('catalog') &&
    agentEntry.includes('kdna read --session --allow-read'),
);
check(
  'agent-entry.md documents minimal selection rule for judgment_ids',
  agentEntry.includes('Minimal selection rule') &&
    agentEntry.includes('never blindly copy all catalog IDs into `judgment_ids`'),
);

const multiRequestsPath = path.resolve(
  __dirname,
  '..',
  'examples',
  'native-team-update',
  'multi.requests.jsonl',
);
const multiRequests = fs
  .readFileSync(multiRequestsPath, 'utf8')
  .trim()
  .split('\n')
  .map((line) => JSON.parse(line));
const multiSelection = multiRequests.find((request) => request.mode === 'exact_selection');
check(
  'multi.requests.jsonl has one catalog and one exact_selection request',
  multiRequests.length === 2 &&
    multiRequests.filter((request) => request.mode === 'catalog').length === 1 &&
    Boolean(multiSelection),
);
check(
  'multi.requests.jsonl selects two judgment ids in one request',
  Array.isArray(multiSelection?.selection?.judgment_ids) &&
    multiSelection.selection.judgment_ids.length === 2,
);

console.log('── Roadmap and maturity alignment');

const publicRoadmap = fs.readFileSync(path.join(DOCS_DIR, 'public-roadmap.md'), 'utf8');
check(
  'public-roadmap.md aligns with repository boundaries and does not claim private web/remote repos are public',
  !publicRoadmap.includes('| Web ecosystem | `kdna-web-client`') &&
    publicRoadmap.includes('private repositories'),
);

const maturityDoc = fs.readFileSync(path.join(DOCS_DIR, 'maturity.md'), 'utf8');
check(
  'maturity.md documents 0.43.2 primary route inspect -> validate -> read and marks plan-load / Runtime Capsule as retired 0.36.1',
  maturityDoc.includes('inspect → validate → read') &&
    maturityDoc.includes('Retired `0.36.1` loading workflow'),
);

console.log('── Package published and reachable');

const ecosystemManifest = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', 'ecosystem-manifest.json'), 'utf8'),
);
const packages = currentPublishedPackages(ecosystemManifest).map(({ packageRecord }) => ({
  name: packageRecord.npm_package,
  version: packageRecord.version,
}));

for (const { name, version } of packages) {
  try {
    const actual = execFileSync('npm', ['view', name, 'version'], {
      encoding: 'utf8',
      timeout: 15000,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    check(
      `${name} manifest=${version} npm=${actual}`,
      actual === version,
      'registry latest must equal the manifest version',
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
    const lines = block.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'));
    for (const line of lines) {
      check(`${rel}: \`${line.slice(0, 60)}\``, line.trim().length > 0);
    }
  }
}

console.log('── No internal workspace paths');

for (const file of docsFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(DOCS_DIR, file);
  const internalRefs = content.match(/\/Users\/(AI|zhangling)\/K\/(OPEN|PRIVATE)\//g);
  const leaked = internalRefs ? internalRefs.length : 0;
  check(`${rel}: no internal workspace paths`, leaked === 0, `found ${leaked} reference(s)`);
}

console.log('── Active single-format vocabulary');

const publicDocRoots = [
  path.resolve(__dirname, '..', 'README.md'),
  path.resolve(__dirname, '..', 'README.zh.md'),
  path.resolve(__dirname, '..', 'SPEC.md'),
  path.resolve(__dirname, '..', 'docs'),
  path.resolve(__dirname, '..', 'specs'),
  path.resolve(__dirname, '..', 'rfcs'),
  path.resolve(__dirname, '..', 'templates'),
];
const driftPatterns = [
  { label: 'removed media type', regex: /application\/vnd\.aikdna\.kdna\+zip/g },
];

function activeMarkdownFiles(root) {
  const stat = fs.statSync(root);
  if (stat.isFile()) return [root];
  return walkDocs(root);
}

for (const root of publicDocRoots) {
  for (const file of activeMarkdownFiles(root)) {
    const content = fs.readFileSync(file, 'utf8');
    const rel = path.relative(path.resolve(__dirname, '..'), file);
    for (const pattern of driftPatterns) {
      pattern.regex.lastIndex = 0;
      const matches = content.match(pattern.regex) || [];
      check(`${rel}: no ${pattern.label}`, matches.length === 0, `found ${matches.length}`);
    }
  }
}

console.log(`\n${failures === 0 ? 'All docs checks passed.' : `${failures} check(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);
