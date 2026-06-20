#!/usr/bin/env node

/**
 * KDNA Manifest Migration Script — v1.0-rc
 *
 * Migrates domain kdna.json manifests to the canonical v1.0-rc schema.
 * Run from kdna repo root: node scripts/migrate-manifest-v1rc.js
 *
 * Usage:
 *   node scripts/migrate-manifest-v1rc.js                          # dry-run all domains
 *   node scripts/migrate-manifest-v1rc.js --write                  # write changes
 *   node scripts/migrate-manifest-v1rc.js --domain ../kdna-writing # single domain
 */

const fs = require('fs');
const path = require('path');

const OPEN_SOURCE = path.resolve(__dirname, '..', '..');

const DOMAIN_DIRS = [
  // kdna-writing, kdna-prompt_diagnosis, kdna-agent_safety — repos deleted, artifacts in kdna-x
  'kdna-authoring',
  'kdna-code_review',
  'kdna-open_source_project',
];

// ─── canonical values ───────────────────────────────────────────

const CANONICAL_SPEC = '1.0-rc';

const REQUIRED_FIELDS = [
  'format',
  'format_version',
  'spec_version',
  'name',
  'version',
  'judgment_version',
  'description',
  'author',
  'license',
  'status',
  'quality_badge',
  'access',
  'languages',
  'default_language',
];

const VALID_STATUS = new Set(['draft', 'experimental', 'stable', 'deprecated', 'staging']);
const VALID_BADGE = new Set([
  'untested',
  'tested',
  'validated',
  'expert_reviewed',
  'production_ready',
]);
const VALID_ACCESS = new Set(['public', 'licensed', 'remote']);
const VALID_RISK = new Set(['R0', 'R1', 'R2', 'R3']);
const VALID_I18N = new Set(['L0', 'L1', 'L2', 'L3']);

// Fields that MUST be removed from domain kdna.json
const REMOVED_FIELDS = [
  'kdna_spec',
  'language',
  'release_status',
  'domain_field',
  'judgment_patterns',
  'files',
  'registry',
];

// License sub-fields that MUST be removed
const REMOVED_LICENSE_FIELDS = [
  'commercial',
  'allow_agent_use',
  'allow_redistribution',
  'allow_training',
];

// ─── helpers ────────────────────────────────────────────────────

function migrationReport(domainName, changes, warnings, errors) {
  return {
    domain: domainName,
    ok: errors.length === 0,
    changes,
    warnings,
    errors,
  };
}

function migrateManifest(original, domainName) {
  const changes = [];
  const warnings = [];
  const errors = [];
  const migrated = JSON.parse(JSON.stringify(original));

  // 1. Normalize v1.0 identity fields
  if (migrated.kdna_spec && !migrated.spec_version) {
    changes.push(`spec_version: "${migrated.kdna_spec}" (from deprecated kdna_spec)`);
    migrated.spec_version = migrated.kdna_spec;
  }
  if (migrated.spec_version !== CANONICAL_SPEC) {
    changes.push(`spec_version: "${migrated.spec_version}" -> "${CANONICAL_SPEC}"`);
    migrated.spec_version = CANONICAL_SPEC;
  }
  if (migrated.format !== 'kdna') {
    changes.push(`format: "${migrated.format}" -> "kdna"`);
    migrated.format = 'kdna';
  }
  if (migrated.format_version !== '1.0') {
    changes.push(`format_version: "${migrated.format_version}" -> "1.0"`);
    migrated.format_version = '1.0';
  }

  // 3. Remove registry-only / deprecated fields
  for (const field of REMOVED_FIELDS) {
    if (field in migrated) {
      changes.push(`REMOVED ${field} (not in canonical domain manifest)`);
      delete migrated[field];
    }
  }

  // 4. Clean up license object
  if (migrated.license && typeof migrated.license === 'object') {
    for (const field of REMOVED_LICENSE_FIELDS) {
      if (field in migrated.license) {
        changes.push(`REMOVED license.${field} (license-type-specific, not universal)`);
        delete migrated.license[field];
      }
    }
  }

  if (!Array.isArray(migrated.languages) || migrated.languages.length === 0) {
    migrated.languages = [original.language || 'en'];
    changes.push(`ADDED languages: ${JSON.stringify(migrated.languages)}`);
  }
  if (!migrated.default_language) {
    migrated.default_language = migrated.languages[0] || 'en';
    changes.push(`ADDED default_language: "${migrated.default_language}"`);
  }

  // 5. Validate required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in migrated) || migrated[field] === undefined || migrated[field] === '') {
      if (field === 'quality_badge') {
        errors.push(`MISSING required field: ${field} — must be set manually`);
      } else {
        errors.push(`MISSING required field: ${field}`);
      }
    }
  }

  // 6. Validate enum values
  if (migrated.status && !VALID_STATUS.has(migrated.status)) {
    errors.push(`INVALID status: "${migrated.status}". Valid: ${[...VALID_STATUS].join(', ')}`);
  }
  if (migrated.quality_badge && !VALID_BADGE.has(migrated.quality_badge)) {
    errors.push(
      `INVALID quality_badge: "${migrated.quality_badge}". Valid: ${[...VALID_BADGE].join(', ')}`,
    );
  }
  if (migrated.access && !VALID_ACCESS.has(migrated.access)) {
    errors.push(`INVALID access: "${migrated.access}". Valid: ${[...VALID_ACCESS].join(', ')}`);
  }
  if (migrated.risk_level && !VALID_RISK.has(migrated.risk_level)) {
    warnings.push(
      `NON-STANDARD risk_level: "${migrated.risk_level}". Valid: ${[...VALID_RISK].join(', ')}`,
    );
  }
  if (migrated.i18n_level && !VALID_I18N.has(migrated.i18n_level)) {
    warnings.push(
      `NON-STANDARD i18n_level: "${migrated.i18n_level}". Valid: ${[...VALID_I18N].join(', ')}`,
    );
  }

  // 7. Validate name format
  if (migrated.name && !/^@[a-z][a-z0-9-]*\/[a-z][a-z0-9_]*$/.test(migrated.name)) {
    warnings.push(`NON-STANDARD name format: "${migrated.name}". Expected @scope/name.`);
  }

  // 8. Validate signature format if present
  if (migrated.signature && !/^ed25519:[0-9a-f]{128}$/.test(migrated.signature)) {
    warnings.push(`NON-STANDARD signature format. Expected ed25519:<128 hex chars>.`);
  }

  // 9. Validate pubkey format if present
  if (
    migrated.author &&
    migrated.author.pubkey &&
    !/^ed25519:[0-9a-f]{64}$/.test(migrated.author.pubkey)
  ) {
    warnings.push(`NON-STANDARD author.pubkey format. Expected ed25519:<64 hex chars>.`);
  }

  // 10. Deprecated status must have replaced_by
  if (migrated.status === 'deprecated' && !migrated.replaced_by) {
    errors.push('DEPRECATED domain missing required field: replaced_by');
  }

  // 11. tested+ badge must have signature
  const needsSig = ['tested', 'validated', 'expert_reviewed', 'production_ready'];
  if (needsSig.includes(migrated.quality_badge) && !migrated.signature) {
    warnings.push(`quality_badge "${migrated.quality_badge}" should have a signature`);
  }

  return { migrated, report: migrationReport(domainName, changes, warnings, errors) };
}

// ─── main ───────────────────────────────────────────────────────

function processDomain(domainDir, write) {
  const manifestPath = path.join(OPEN_SOURCE, domainDir, 'kdna.json');
  if (!fs.existsSync(manifestPath)) {
    return migrationReport(domainDir, [], [], [`FILE NOT FOUND: ${manifestPath}`]);
  }

  let original;
  try {
    original = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    return migrationReport(domainDir, [], [], [`PARSE ERROR: ${e.message}`]);
  }

  const { migrated, report } = migrateManifest(original, domainDir);

  if (write && report.ok) {
    fs.writeFileSync(manifestPath, JSON.stringify(migrated, null, 2) + '\n', 'utf8');
    report.changes.push('WRITTEN to disk');
  }

  return report;
}

// ─── CLI ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const write = args.includes('--write');
const singleDomain = (() => {
  const idx = args.indexOf('--domain');
  return idx >= 0 ? args[idx + 1] : null;
})();

const targets = singleDomain ? [path.basename(singleDomain)] : DOMAIN_DIRS;

console.log(`\nKDNA Manifest Migration — v1.0-rc`);
console.log(`Mode: ${write ? 'WRITE' : 'DRY-RUN'}`);
console.log(`Domains: ${targets.length}\n`);

let totalChanges = 0;
let totalErrors = 0;
const allReports = [];

for (const dir of targets) {
  const report = processDomain(dir, write);
  allReports.push(report);

  const icon = report.errors.length > 0 ? '❌' : report.changes.length > 0 ? '✏️ ' : '✅';
  console.log(`${icon} ${report.domain}`);

  for (const c of report.changes) console.log(`   + ${c}`);
  for (const w of report.warnings) console.log(`   ⚠ ${w}`);
  for (const e of report.errors) console.log(`   ❌ ${e}`);

  totalChanges += report.changes.length;
  totalErrors += report.errors.length;
}

console.log(`\n──────────────────────────────────────────`);
console.log(
  `Total: ${totalChanges} changes, ${totalErrors} errors across ${targets.length} domains`,
);

if (!write) {
  console.log(`\nRun with --write to apply changes.`);
}

// Exit non-zero if any domain has errors
process.exit(totalErrors > 0 ? 1 : 0);
