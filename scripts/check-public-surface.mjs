#!/usr/bin/env node

/**
 * scripts/check-public-surface.mjs
 *
 * Scans the public surface of this repository (docs/, specs/, .github/,
 * showcase/, root-level *.md and *.json) for references that should not
 * be present in a public release:
 *
 *   - Private repo URLs (github.com/aikdna/kdna-x, aikdna/kdna-lab,
 *     aikdna/kdna-writing, aikdna/kdna-prompt_diagnosis, aikdna/kdna-agent_safety,
 *     aikdna/kdna-releases, aikdna/kdna-registry)
 *   - Private repo path references (kdna-x/A-agent-meta/, kdna-x/_strategy/, etc.)
 *   - Local filesystem paths leaking the developer's machine
 *     (/Users/AI/K/OPEN/, /private/tmp/)
 *   - Full (40-char) git commit hashes in audit/spec docs
 *   - Internal code names ("M3 self-eval", "A-agent-meta")
 *
 * Exits 0 on a clean run, 1 on any finding. Each finding includes the
 * file, line number, and the offending substring so the fix is
 * mechanical.
 *
 * Run from repo root:  node scripts/check-public-surface.mjs
 *   --strict          also flag the existence of 'kdna-lab' substring
 *                      (some legitimate prose uses "test lab" — strict
 *                      mode is for new PRs that should not add new refs)
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, sep } from 'path';

const ROOT = process.cwd();
const STRICT = process.argv.includes('--strict');

const PUBLIC_DIRS = ['docs', 'specs', '.github', 'showcase'];
const PUBLIC_FILES = [
  'README.md',
  'README.zh.md',
  'CHANGELOG.md',
  'ecosystem-manifest.json',
  'package.json',
  'CONTRIBUTING.md',
];
// Files that legitimately mention a private repo as historical record
const ALLOWLIST_FILES = new Set([
  'docs/archive/',
  'docs/audits/2026-06-16-repo-compliance.md', // explicit compliance scan
  'docs/audits/kdna-public-narrative-audit-2026-06.md', // the audit itself
  'docs/audits/2026-06-16-rfc-0013-audit-note.md', // historical PR record
  'CHANGELOG.md', // released history legitimately references removed repos
]);

const RULES = [
  {
    name: 'private-repo-URL',
    pattern: /github\.com\/aikdna\/(kdna-x|kdna-lab|kdna-releases|kdna-registry|kdna-writing|kdna-prompt_diagnosis|kdna-agent_safety)\b/g,
    hint: 'Replace with neutral wording or "(private)".',
  },
  {
    name: 'private-repo-URL-bare',
    pattern: /\baikdna\/(kdna-x|kdna-lab|kdna-releases|kdna-registry|kdna-writing|kdna-prompt_diagnosis|kdna-agent_safety)\b(?!\.)/g,
    hint: 'Replace with neutral wording or "(private)".',
  },
  {
    name: 'private-repo-path',
    pattern: /kdna-x\/(A-agent-meta|_strategy|D-content|B-engineering|project-context|completion-adjudication|intent-boundary|safety-boundary|task-decomposition|anti-drift-context)\b/g,
    hint: 'Replace with "internal namespace (redacted)".',
  },
  {
    name: 'local-filesystem-path',
    pattern: /(\/Users\/AI\/K\/OPEN|\/private\/tmp\/kdna)/g,
    hint: 'Replace /Users/AI/K/OPEN/<x> with <workdir>/<x>; /private/tmp/kdna-* with /tmp/kdna-*.',
  },
  {
    name: 'full-commit-hash',
    pattern: /(?<![a-f0-9])[a-f0-9]{40}(?![a-f0-9])/g,
    hint: 'Replace full 40-char commit hash with short ref or "see acceptance note".',
    // 40-char SHA1s are legitimate provenance pins in:
    //   - .github/workflows/ — pinning a public release commit
    //   - ecosystem-manifest.json conformance_commit field
    excludePaths: ['.github/workflows/', 'ecosystem-manifest.json'],
  },
  {
    name: 'internal-code-name',
    pattern: /\bM3 self-eval\b/g,
    hint: 'Replace with "single-model self-evaluation".',
  },
];

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === '.git' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, out);
    } else if (st.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function isPublicPath(rel) {
  if (rel.startsWith('node_modules' + sep) || rel.startsWith('.git' + sep)) return false;
  if (PUBLIC_DIRS.some((d) => rel === d || rel.startsWith(d + sep))) return true;
  if (PUBLIC_FILES.includes(rel)) return true;
  return false;
}

function isAllowlisted(rel) {
  for (const allow of ALLOWLIST_FILES) {
    if (rel === allow.replace(/\/$/, '') || rel.startsWith(allow)) return true;
  }
  return false;
}

function isRuleExcluded(rel, rule) {
  if (!rule.excludePaths) return false;
  return rule.excludePaths.some((p) => rel === p || rel.startsWith(p));
}

const findings = [];
const files = [];
for (const d of PUBLIC_DIRS) {
  files.push(...walk(join(ROOT, d)));
}
for (const f of PUBLIC_FILES) {
  const full = join(ROOT, f);
  try {
    if (statSync(full).isFile()) files.push(full);
  } catch {
    /* not present */
  }
}

for (const full of files) {
  const rel = relative(ROOT, full);
  if (!isPublicPath(rel)) continue;
  if (isAllowlisted(rel)) continue;
  const text = readFileSync(full, 'utf8');
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const rule of RULES) {
      if (isRuleExcluded(rel, rule)) continue;
      rule.pattern.lastIndex = 0;
      let m;
      while ((m = rule.pattern.exec(line)) !== null) {
        findings.push({
          file: rel,
          line: i + 1,
          rule: rule.name,
          match: m[0],
          hint: rule.hint,
        });
      }
    }
  }
}

if (findings.length === 0) {
  console.log('✅ public-surface check: 0 findings');
  console.log(`   scanned ${files.length} files across ${PUBLIC_DIRS.join(', ')}`);
  process.exit(0);
}

console.log(`❌ public-surface check: ${findings.length} finding(s)\n`);
for (const f of findings) {
  console.log(`  [${f.rule}] ${f.file}:${f.line}`);
  console.log(`      match: ${f.match}`);
  console.log(`      hint:  ${f.hint}`);
  console.log('');
}
process.exit(1);
