#!/usr/bin/env node
// Builds the zero-dependency single-file KDNA asset inspector by inlining
// docs/inspector/inspector-core.mjs (the repo-local, dependency-free 0.6.0
// container reader) into the page template. No bundler, no node_modules, no
// published-package pin: the page is a pure function of the two source files.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CORE_PATH = path.join(ROOT, 'docs', 'inspector', 'inspector-core.mjs');
const TEMPLATE_PATH = path.join(ROOT, 'docs', 'inspector', 'inspector.template.html');
const OUT_PATH = process.env.KDNA_INSPECTOR_OUT
  ? path.resolve(process.env.KDNA_INSPECTOR_OUT)
  : path.join(ROOT, 'docs', 'inspector', 'index.html');

// The core is spliced into a module <script>, so strip `export` keywords and
// refuse anything that would need a module loader or the network.
const coreSource = fs.readFileSync(CORE_PATH, 'utf8');
if (/^\s*import\s/m.test(coreSource) || /\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(coreSource)) {
  throw new Error('inspector-core.mjs must stay dependency-free and offline');
}
const coreBundle = coreSource.replace(/^export\s+/gm, '');
const digest = createHash('sha256').update(coreBundle).digest('hex');

const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
if (!template.includes('/*__KDNA_INSPECTOR_CORE__*/')) {
  throw new Error('inspector template is missing the core placeholder');
}
const page = template
  .replace('/*__KDNA_INSPECTOR_CORE__*/', () => coreBundle)
  .replaceAll('__KDNA_INSPECTOR_DIGEST__', digest.slice(0, 16));

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, page);
console.log(
  `asset-inspector: wrote ${path.relative(ROOT, OUT_PATH)} ` +
    `(inspector-core sha256:${digest.slice(0, 16)}…, ${fs.statSync(OUT_PATH).size} bytes)`,
);
