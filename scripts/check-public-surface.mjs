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
//      domain example outside allowlisted paths. The identifiers themselves
//      are private, so they are stored as SHA-256 hashes and matched against
//      lowercase-normalized candidate tokens (see FORBIDDEN_HASHES below).
//      To add a new forbidden identifier, run:
//        printf '%s' "the-identifier" | shasum -a 256
//   3. Internal workspace path: any literal internal coordination path outside
//      allowlisted audit/history files. Public docs must describe public
//      evidence, not point readers at inaccessible workspace paths.
//
// Historical, audit, fixture, and test files are still public surface. They are
// scanned under the same privacy policy as current documentation. Forbidden
// identifiers are stored as SHA-256 hashes so this scanner does not itself
// leak the names it guards against.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import releaseAuthority from './core-release-authority.js';

const { TRUSTED_GIT, cleanGitEnvironment } = releaseAuthority;

const ALLOWLIST_PATHS = new Set([
  'scripts/check-public-surface.mjs', // self (scanner; identifiers stored as hashes)
]);

const REDACTED_PATTERN = /\bREDACTED\b/;
const PRIVATE_PATH_PATTERN = new RegExp(`\\b${'PRIVATE'}[\\\\/]`);

// Forbidden identifiers are private, so this script must not contain them in
// the clear. Each entry below is a SHA-256 hash of the lowercase identifier.
// Candidates are extracted from scanned content, lowercased, and compared
// against these hashes; hyphen-joined tokens are also checked as every
// contiguous hyphen segment so `name` still matches inside `name-suffix`.
// Labels are deliberately neutral so this file carries no private names.
const FORBIDDEN_HASHES = [
  {
    label: 'private website repo',
    hashes: new Set([
      'febf9788812ada44e18b493ea93e58481d2e9afcbb85d31e924e5639996c2965',
      '6edb9124738357f316804e1c718d1abd625072b6a4d31f7c219f0925c11c89c8',
    ]),
  },
  {
    label: 'private repo name',
    hashes: new Set([
      '3ce236400925c24e9e5416bdc69abe5427b3183e2abe6f848b297334cfdeaa25',
    ]),
  },
  {
    label: 'private consumer app',
    hashes: new Set([
      '61e79d887fa6b41acfebaeee47c2ba816bc76c892b1f72a3c2ba3f34900a22f8',
    ]),
  },
  {
    label: 'private scheduled product',
    hashes: new Set([
      '0d3e180fbb330b1fd685a50c6deb487b7a15a184418f375d7c5a807f7bdfa5a5',
      'fb7a66c59285e4dca8f899fb33c51fa404449b96c9572682862612ea69375c6a',
    ]),
  },
  {
    label: 'private pipeline codename',
    hashes: new Set([
      'b4dd311429383a0df964f510fea4f208531f6e4807ffcef7e70899cefd0d4632',
    ]),
  },
];

const CANDIDATE_PATTERN = /@?[A-Za-z0-9_]+(?:(?:\/|-)[A-Za-z0-9_]+)*/g;

function sha256Hex(text) {
  return createHash('sha256').update(text).digest('hex');
}

function forbiddenLabelsFor(content) {
  const seen = new Set();
  const matched = new Set();
  CANDIDATE_PATTERN.lastIndex = 0;
  let m;
  while ((m = CANDIDATE_PATTERN.exec(content)) !== null) {
    let token = m[0].toLowerCase();
    if (token.startsWith('@')) token = token.slice(1);
    const variants = [token];
    const parts = token.split('-');
    if (parts.length > 1) {
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j <= parts.length; j++) {
          variants.push(parts.slice(i, j).join('-'));
        }
      }
    }
    for (const variant of variants) {
      if (seen.has(variant)) continue;
      seen.add(variant);
      const hash = sha256Hex(variant);
      for (const { label, hashes } of FORBIDDEN_HASHES) {
        if (hashes.has(hash)) matched.add(label);
      }
    }
  }
  return [...matched];
}

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
  for (const label of forbiddenLabelsFor(content)) {
    failures.push({
      file: relPath,
      rule: `forbidden-name:${label}`,
      detail: `private repo or domain "${label}" must not appear in public files outside allowlist`,
    });
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
  console.error(
    '  - To update the forbidden-name set, add a SHA-256 hash of the lowercase identifier in scripts/check-public-surface.mjs.',
  );
  process.exit(1);
}

console.log(`public-surface check passed: ${scanned} files scanned, 0 violations`);
