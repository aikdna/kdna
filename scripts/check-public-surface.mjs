#!/usr/bin/env node
// Public-surface check: scan every tracked file in the public @aikdna/kdna
// monorepo for anti-patterns that indicate private-repo leakage.
//
// Two classes of failure:
//   1. REDACTED-literal: any occurrence of the word "REDACTED" (case-sensitive)
//      outside allowlisted paths. REDACTED is a worst-of-both anti-pattern —
//      it tells grep-aware attackers "something was here" while also breaking
//      the contract of "the public repo is the source of truth". The correct
//      remediation is structural deletion: remove the field/line/node entirely
//      (and re-allowlist the consuming schema if a placeholder is genuinely
//      needed).
//   2. Forbidden name: any occurrence of a known private repo name or private
//      domain example outside allowlisted paths. As of 2026-06-27 the
//      forbidden set is sourced from PRIVATE/STATUS/open/kdna.md [BLOCKING]
//      entries: aikdna/kdna-website, atomspeak. Update by appending, not
//      editing history.
//
// Allowlist rationale: RFC files (specs/RFC-*) are technical documents that
// legitimately reference private repos as test fixtures and worked examples.
// CHANGELOG.md is historical and may mention names that have since been
// redacted. This script itself contains the strings it scans for, so it
// self-exempts.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const ALLOWLIST_PATHS = new Set([
  'scripts/check-public-surface.mjs', // self (contains scanned strings)
  'scripts/validate-public-truth.js', // sibling check; references kdna-website in comments + lookup
  'CHANGELOG.md', // historical references
  'specs/RFC-0012-artifact-contract.md', // references kdna-workpack (public) and kdna-lab fixtures
  'specs/RFC-0013-judgment-asset-lifecycle.md', // uses atomspeak as worked example
  'specs/RFC-0017-kdna-card-v2.md', // references kdna-lab PRs as audit anchors
  // PR notes and audit packs are audit-internal; they predate the
  // structural-deletion policy and reference the historical private-repo
  // names. They live under docs/audits/ and docs/rfc-status.md.
  'docs/audits/',
  'docs/rfc-status.md',
]);

const REDACTED_PATTERN = /\bREDACTED\b/;
const FORBIDDEN_PATTERNS = [
  { name: 'aikdna/kdna-website', pattern: /\baikdna\/kdna-website\b|kdna-website\b/ },
  { name: 'atomspeak', pattern: /\batomspeak\b|@atomspeak\b/ },
];

function listTrackedFiles() {
  return execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean);
}

function isAllowlisted(relPath) {
  if (ALLOWLIST_PATHS.has(relPath)) return true;
  for (const prefix of ALLOWLIST_PATHS) {
    if (prefix.endsWith('/') && relPath.startsWith(prefix)) return true;
  }
  return false;
}

function scanContent(relPath, content) {
  const failures = [];
  if (REDACTED_PATTERN.test(content)) {
    failures.push({
      file: relPath,
      rule: 'REDACTED-literal',
      detail: 'redact is an anti-pattern; delete the field/line/node structurally instead',
    });
  }
  for (const { name, pattern } of FORBIDDEN_PATTERNS) {
    if (pattern.test(content)) {
      failures.push({
        file: relPath,
        rule: `forbidden-name:${name}`,
        detail: `private repo or domain "${name}" must not appear in public files outside allowlist`,
      });
    }
  }
  return failures;
}

const files = listTrackedFiles();
const allFailures = [];
let scanned = 0;
for (const rel of files) {
  if (isAllowlisted(rel)) continue;
  let content;
  try {
    content = readFileSync(rel, 'utf8');
  } catch {
    continue; // binary or unreadable — skip
  }
  // Skip files larger than 1 MB (likely generated/binary)
  if (content.length > 1_000_000) continue;
  scanned += 1;
  allFailures.push(...scanContent(rel, content));
}

if (allFailures.length > 0) {
  console.error(
    `public-surface check failed: ${allFailures.length} violation(s) across ${scanned} files\n`,
  );
  for (const f of allFailures) {
    console.error(`  ${f.file}`);
    console.error(`    rule: ${f.rule}`);
    console.error(`    ${f.detail}\n`);
  }
  console.error('Remediation:');
  console.error('  - REDACTED literals: remove the field/line/node from the schema entirely.');
  console.error('  - forbidden names:  move references to an allowlisted path (specs/RFC-*,');
  console.error(
    '                       docs/audits/, docs/rfc-status.md, CHANGELOG.md) or delete.',
  );
  console.error('  - To update the forbidden-name set, edit scripts/check-public-surface.mjs.');
  process.exit(1);
}

console.log(`public-surface check passed: ${scanned} files scanned, 0 violations`);
