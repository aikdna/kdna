#!/usr/bin/env node
// Public-surface check: scan every tracked file in the public @aikdna/kdna
// monorepo for anti-patterns that indicate private-repo leakage.
//
// Three classes of failure:
//   1. REDACTED-literal: any occurrence of the word "REDACTED" (case-sensitive)
//      outside allowlisted paths. REDACTED is a worst-of-both anti-pattern —
//      it tells grep-aware attackers "something was here" while also breaking
//      the contract of "the public repo is the source of truth". The correct
//      remediation is structural deletion: remove the field/line/node entirely
//      (and re-allowlist the consuming schema if a placeholder is genuinely
//      needed).
//   2. Forbidden name: any occurrence of a non-public repository, internal
//      product, or internal domain example outside allowlisted paths. The
//      identifiers themselves are private, so they are stored as SHA-256 hashes
//      and matched against lowercase-normalized candidate tokens (see
//      FORBIDDEN_HASHES below). To add a new forbidden identifier, run:
//        printf '%s' "the-identifier" | shasum -a 256
//   3. Internal workspace path: any literal internal coordination path outside
//      allowlisted audit/history files. Public docs must describe public
//      evidence, not point readers at inaccessible workspace paths.
//
// Historical, audit, fixture, and test files are still public surface. They are
// scanned under the same privacy policy as current documentation. Forbidden
// identifiers are stored as SHA-256 hashes so this scanner does not itself
// leak the names it guards against.
//
// A forbidden identifier that pre-dates this gate inside public narrative prose
// must never be silently allowed. The mechanism for that case is
// FORBIDDEN_EXCEPTIONS: a declared, digest-pinned (path, label, reason) tuple.
// An exception switches off ONLY that one forbidden-name label for that one
// path — REDACTED and internal-workspace-path stay enforced everywhere,
// including in the excepted file — and the gate prints a note on every run so
// the exception is loud. The tuple set is pinned by FORBIDDEN_EXCEPTIONS_DIGEST,
// so adding, removing, or editing an exception is an explicit re-review rather
// than a silent widening.
//
// The set is currently EMPTY: the only pre-existing occurrences were rewritten
// with neutral wording instead of being exempted, so nothing is exempt and the
// pinned digest is the digest of the empty tuple set.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import releaseAuthority from './core-release-authority.js';

const { TRUSTED_GIT, cleanReadOnlyGitEnvironment } = releaseAuthority;
// Use the standard Git for Windows installation without consulting inherited
// PATH. Publishing retains its separate POSIX executable and temp authority.
const READ_ONLY_GIT =
  process.platform === 'win32' ? String.raw`C:\Program Files\Git\bin\git.exe` : TRUSTED_GIT;

const SELF_PATH = fileURLToPath(import.meta.url);
const SUCCESS_LINE = 'public-surface check passed';

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
    hashes: new Set(['3ce236400925c24e9e5416bdc69abe5427b3183e2abe6f848b297334cfdeaa25']),
  },
  {
    label: 'private integration repo',
    hashes: new Set(['67f665abf5cf55ca4d31f9f8228af336c19268db1e98dabf107912adfb0fcacc']),
  },
  {
    label: 'private consumer app',
    hashes: new Set(['61e79d887fa6b41acfebaeee47c2ba816bc76c892b1f72a3c2ba3f34900a22f8']),
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
    hashes: new Set(['b4dd311429383a0df964f510fea4f208531f6e4807ffcef7e70899cefd0d4632']),
  },
  {
    // Internal commercial product name. Added after a 2026-09-13 review found
    // that injecting this name into a tracked file left the gate green: the
    // name was simply absent from the marker set, so only the one copy that sat
    // inside a byte-pinned design input was ever covered. The three
    // pre-existing occurrences in the public RFC were rewritten with neutral
    // wording, so no exception is needed and none is declared.
    label: 'internal product name',
    hashes: new Set(['01381e1bc57c6e79f50a121ffe043d3f0d6a186587cf20ea2c9d9e6a01716ce2']),
  },
];

// Declared, digest-pinned exceptions for forbidden identifiers that pre-date
// this gate inside a public narrative document. An exception is scoped to one
// path + one label; the other rules still run on that file. The list is EMPTY:
// nothing is exempt, and the pinned digest below is the digest of an empty
// tuple set, so re-introducing any exception requires an explicit re-pin.
const FORBIDDEN_EXCEPTIONS = [];
const FORBIDDEN_EXCEPTIONS_DIGEST =
  '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945';

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
  return execFileSync(READ_ONLY_GIT, ['--no-replace-objects', 'ls-files'], {
    encoding: 'utf8',
    env: cleanReadOnlyGitEnvironment(),
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

function forbiddenExceptionDigest(entries) {
  const tuples = entries
    .map(({ path: entryPath, label, reason }) => [entryPath, label, reason])
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  return createHash('sha256').update(JSON.stringify(tuples)).digest('hex');
}

function validateForbiddenExceptions(entries, trackedFiles) {
  if (!Array.isArray(entries)) throw new Error('forbidden exceptions must be an array');
  for (const [index, entry] of entries.entries()) {
    const keys = Object.keys(entry || {}).sort();
    if (JSON.stringify(keys) !== JSON.stringify(['label', 'path', 'reason'])) {
      throw new Error(`forbidden exception ${index} fields are not exact`);
    }
    for (const key of keys) {
      if (typeof entry[key] !== 'string' || entry[key].trim() !== entry[key] || entry[key] === '') {
        throw new Error(`forbidden exception ${index} ${key} must be a non-empty trimmed string`);
      }
    }
    if (entry.reason.length < 40) {
      throw new Error(`forbidden exception ${index} reason is not specific enough`);
    }
    if (!FORBIDDEN_HASHES.some(({ label }) => label === entry.label)) {
      throw new Error(`forbidden exception ${index} names an unknown label`);
    }
    if (isAllowlisted(entry.path)) {
      throw new Error(`forbidden exception ${index} duplicates a whole-file allowlist entry`);
    }
    if (!trackedFiles.includes(entry.path)) {
      throw new Error(`forbidden exception ${index} path is not a tracked file: ${entry.path}`);
    }
  }
  const digest = forbiddenExceptionDigest(entries);
  if (digest !== FORBIDDEN_EXCEPTIONS_DIGEST) {
    throw new Error(`forbidden exception authority digest mismatch: ${digest}`);
  }
}

function forbiddenExceptionsFor(relPath) {
  const labels = new Set();
  for (const entry of FORBIDDEN_EXCEPTIONS) {
    if (entry.path === relPath) labels.add(entry.label);
  }
  return labels;
}

function scanContent(relPath, content, exceptedLabels = new Set()) {
  const failures = [];
  const notes = [];
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
    if (exceptedLabels.has(label)) {
      notes.push({ file: relPath, label, rule: `forbidden-name:${label}` });
      continue;
    }
    failures.push({
      file: relPath,
      rule: `forbidden-name:${label}`,
      detail: `private repo, internal product, or domain "${label}" must not appear in public files outside allowlist`,
    });
  }
  return { failures, notes };
}

function main(argv = []) {
  if (argv.length > 0) {
    console.error(`public-surface check: unknown argument ${argv[0]}`);
    console.error('usage: check-public-surface.mjs   (takes no arguments by design)');
    return 2;
  }

  const files = listTrackedFiles();
  try {
    validateForbiddenExceptions(FORBIDDEN_EXCEPTIONS, files);
  } catch (error) {
    console.error(`public-surface check failed: ${error.message}`);
    return 1;
  }

  const allFailures = [];
  const allNotes = [];
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
    const { failures, notes } = scanContent(rel, content, forbiddenExceptionsFor(rel));
    allFailures.push(...failures);
    allNotes.push(...notes);
  }

  for (const note of allNotes) {
    console.log(
      `public-surface check note: ${note.file} carries the forbidden label "${note.label}" ` +
        'under a declared, digest-pinned FORBIDDEN_EXCEPTIONS entry (path-scoped and ' +
        'label-scoped; all other rules still apply there).',
    );
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
    return 1;
  }

  const exceptionSuffix =
    allNotes.length > 0
      ? ` (${allNotes.length} declared forbidden-name exception span(s) in force)`
      : '';
  console.log(`${SUCCESS_LINE}: ${scanned} files scanned, 0 violations${exceptionSuffix}`);
  return 0;
}

// Entry guard. Compared through realpath so an invocation through a symlink
// still RUNS the gate (and can never exit 0 silently, which is the failure mode
// this guard exists to prevent). An import — this file is loaded by the
// standing-control test — is not the entry point and must not run the scan.
function entryGuardOutcome() {
  if (!process.argv[1]) return 'import';
  let invokedReal = null;
  try {
    invokedReal = realpathSync(process.argv[1]);
  } catch {
    invokedReal = null;
  }
  let selfReal = null;
  try {
    selfReal = realpathSync(SELF_PATH);
  } catch {
    selfReal = null;
  }
  if (invokedReal && selfReal && invokedReal === selfReal) return 'entry';
  if (resolve(process.argv[1]) === resolve(SELF_PATH)) return 'unresolved-entry';
  return 'import';
}

const guardOutcome = entryGuardOutcome();
if (guardOutcome === 'unresolved-entry') {
  console.error(
    'KDNA_PUBLIC_SURFACE_ENTRY_GUARD_FAILED: refusing to run under an unresolved entry path',
  );
  process.exit(2);
}
if (guardOutcome === 'entry') {
  process.exit(main(process.argv.slice(2)));
}

export {
  ALLOWLIST_PATHS,
  FORBIDDEN_EXCEPTIONS,
  FORBIDDEN_EXCEPTIONS_DIGEST,
  FORBIDDEN_HASHES,
  REDACTED_PATTERN,
  SUCCESS_LINE,
  forbiddenExceptionDigest,
  forbiddenExceptionsFor,
  forbiddenLabelsFor,
  isAllowlisted,
  main,
  scanContent,
  validateForbiddenExceptions,
};
