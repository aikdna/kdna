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
//   2. Forbidden name: any occurrence of a non-public repository or internal
//      domain example outside allowlisted paths. Keep this public-safe list in
//      the script and update it when repository visibility changes.
//   3. Internal workspace path: any literal internal coordination path outside
//      allowlisted audit/history files. Public docs must describe public
//      evidence, not point readers at inaccessible workspace paths.
//
// Historical, audit, fixture, and test files are still public surface. They are
// scanned under the same privacy policy as current documentation. This script
// contains the strings it scans for, so it self-exempts.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import releaseAuthority from './core-release-authority.js';

const { TRUSTED_GIT, cleanGitEnvironment } = releaseAuthority;

const ALLOWLIST_PATHS = new Set([
  'scripts/check-public-surface.mjs', // self (contains scanned strings)
]);

const REDACTED_PATTERN = /\bREDACTED\b/;
const PRIVATE_PATH_PATTERN = new RegExp(`\\b${'PRIVATE'}[\\\\/]`);
const FORBIDDEN_PATTERNS = [
  { name: 'aikdna/kdna-website', pattern: /\baikdna\/kdna-website\b|kdna-website\b/ },
  { name: 'atomspeak', pattern: /\batomspeak\b|@atomspeak\b/ },
  { name: 'private consumer app', pattern: /\bKDNAChat\b/i },
  { name: 'private scheduled product', pattern: /\bCoachLettersAI\b|\bgvjl\b/i },
  { name: 'private pipeline codename', pattern: /\bxplan\b/i },
];

function listTrackedFiles() {
  return execFileSync(TRUSTED_GIT, ['--no-replace-objects', 'ls-files'], {
    encoding: 'utf8',
    env: cleanGitEnvironment(),
  })
    .split('\n')
    .filter(Boolean);
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
  if (PRIVATE_PATH_PATTERN.test(content)) {
    failures.push({
      file: relPath,
      rule: 'internal-workspace-path',
      detail: 'public docs must not reference inaccessible internal workspace paths',
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
  console.error(
    '  - Internal workspace paths: describe the public evidence or delete the reference.',
  );
  console.error('  - Forbidden names: replace with a public-safe generic example or delete.');
  console.error('  - To update the forbidden-name set, edit scripts/check-public-surface.mjs.');
  process.exit(1);
}

console.log(`public-surface check passed: ${scanned} files scanned, 0 violations`);
