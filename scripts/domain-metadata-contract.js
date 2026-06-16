#!/usr/bin/env node
/**
 * domain-metadata-contract — enforce a uniform kdna.json shape across all
 * domain repos so the Registry can publish them without surprising gaps.
 *
 * PR-8 contract (scope: every kdna.json in the workspace):
 *
 *   Required for ALL entries (experimental and official):
 *     - name: @aikdna/<scope>            (must be scoped)
 *     - spec_version: string
 *     - quality_badge: untested|tested|validated|expert_reviewed|production_ready
 *     - risk_level: R0|R1|R2|R3
 *     - default_language: BCP-47 code
 *     - languages: array (must include default_language)
 *     - i18n_level: L0|L1|L2|L3
 *     - author.name: non-empty string
 *     - author.id: non-empty string
 *     - author.pubkey: ed25519:<64 hex>
 *     - license: {type: <SPDX>} | string
 *
 *   Required when not experimental (quality_badge != untested):
 *     - signature: ed25519:<128 hex>
 *     - content_digest: sha256:<64 hex>
 *
 *   Optional but recommended:
 *     - known_limitations (path or inline)
 *     - evals (path or array)
 *     - benchmark (path or url)
 *     - lineage (parent domains)
 *
 *   Forbidden:
 *     - author.pubkey.value == "placeholder-..." (placeholder must be replaced
 *       before any registry promotion)
 *
 * Usage:
 *   node scripts/domain-metadata-contract.js [--strict]
 *   --strict turns WARNs into FAILs.
 */

const fs = require('fs');
const path = require('path');

const REPOS_ROOT = process.env.KDNA_REPOS_ROOT || path.resolve(__dirname, '..', '..');

const VALID_QUALITY = new Set(['untested', 'tested', 'validated', 'expert_reviewed', 'production_ready']);
const VALID_RISK = new Set(['R0', 'R1', 'R2', 'R3']);
const VALID_I18N = new Set(['L0', 'L1', 'L2', 'L3']);

const REQUIRED_FOR_ALL = [
  'name', 'spec_version', 'quality_badge',
];
// Experimental (quality_badge=untested) can skip these.
const REQUIRED_NON_EXPERIMENTAL = [
  'risk_level', 'default_language', 'languages', 'i18n_level',
  'signature', 'content_digest',
];

function flag(sev, repo, msg) {
  return { sev, repo, msg };
}

function checkOne(repoName, kdna) {
  const findings = [];
  if (typeof kdna.name !== 'string' || !/^@aikdna\/[a-z][a-z0-9_-]*$/.test(kdna.name)) {
    findings.push(flag('FAIL', repoName, `name must be @aikdna/<scope> (got: ${kdna.name})`));
  }
  for (const f of REQUIRED_FOR_ALL) {
    if (kdna[f] === undefined || kdna[f] === null) {
      findings.push(flag('FAIL', repoName, `missing required field "${f}"`));
    }
  }
  if (kdna.quality_badge && !VALID_QUALITY.has(kdna.quality_badge)) {
    findings.push(flag('FAIL', repoName, `quality_badge "${kdna.quality_badge}" not in ${[...VALID_QUALITY].join('|')}`));
  }
  if (kdna.risk_level && !VALID_RISK.has(kdna.risk_level)) {
    findings.push(flag('FAIL', repoName, `risk_level "${kdna.risk_level}" not in ${[...VALID_RISK].join('|')}`));
  }
  if (kdna.i18n_level && !VALID_I18N.has(kdna.i18n_level)) {
    findings.push(flag('FAIL', repoName, `i18n_level "${kdna.i18n_level}" not in ${[...VALID_I18N].join('|')}`));
  }
  if (kdna.languages && Array.isArray(kdna.languages) && kdna.default_language) {
    if (!kdna.languages.includes(kdna.default_language)) {
      findings.push(flag('FAIL', repoName, `default_language "${kdna.default_language}" not in languages []`));
    }
  }
  if (!kdna.author) {
    findings.push(flag('FAIL', repoName, `author block missing`));
  } else {
    for (const f of ['name', 'id']) {
      if (typeof kdna.author[f] !== 'string' || kdna.author[f].trim().length === 0) {
        findings.push(flag('FAIL', repoName, `author.${f} is empty or missing`));
      }
    }
    let pubkeyStr = kdna.author.pubkey;
    if (pubkeyStr && typeof pubkeyStr === 'object') pubkeyStr = pubkeyStr.value;
    if (typeof pubkeyStr !== 'string') {
      findings.push(flag('FAIL', repoName, `author.pubkey missing`));
    } else if (/^placeholder-/.test(pubkeyStr)) {
      findings.push(flag('FAIL', repoName, `author.pubkey is a placeholder ("${pubkeyStr}") — must be replaced before registry promotion`));
    } else if (!/^ed25519:[0-9a-f]{64}$/.test(pubkeyStr)) {
      findings.push(flag('FAIL', repoName, `author.pubkey must be ed25519:<64 hex> (got: ${pubkeyStr.slice(0, 20)}...)`));
    }
  }
  if (!kdna.license) {
    findings.push(flag('WARN', repoName, `license missing`));
  }

  if (kdna.quality_badge && kdna.quality_badge !== 'untested') {
    for (const f of REQUIRED_NON_EXPERIMENTAL) {
      const v = kdna[f];
      // Different fields have different shape expectations.
      if (f === 'languages') {
        if (!Array.isArray(v) || v.length === 0) {
          findings.push(flag('FAIL', repoName, `quality_badge=${kdna.quality_badge} requires non-empty languages array`));
        }
        continue;
      }
      if (typeof v !== 'string' || v.length === 0) {
        findings.push(flag('FAIL', repoName, `quality_badge=${kdna.quality_badge} requires ${f} field`));
        continue;
      }
      if (f === 'signature' && !/^ed25519:[0-9a-f]{128}$/.test(v)) {
        findings.push(flag('FAIL', repoName, `signature must be ed25519:<128 hex>`));
      } else if (f === 'content_digest' && !/^sha256:[0-9a-f]{64}$/.test(v)) {
        findings.push(flag('FAIL', repoName, `content_digest must be sha256:<64 hex>`));
      }
    }
  }

  // Experimental-specific guidance: untested should be EXPLICIT and not
  // secretly hiding a tested entry.
  if (kdna.quality_badge === 'untested' && kdna.signature) {
    findings.push(flag('INFO', repoName, `untested but has signature — consider bumping to tested if evals pass`));
  }
  return findings;
}

function main() {
  const strict = process.argv.includes('--strict');
  if (!fs.existsSync(REPOS_ROOT)) {
    console.error(`domain-metadata-contract: ${REPOS_ROOT} does not exist`);
    process.exit(2);
  }

  const allFindings = [];
  for (const entry of fs.readdirSync(REPOS_ROOT)) {
    const repoPath = path.join(REPOS_ROOT, entry);
    if (!fs.statSync(repoPath).isDirectory()) continue;
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    // Internal fixtures are excluded by convention (PR-8 audit scope).
    if (entry === 'test_domain') continue;
    const kdnaPath = path.join(repoPath, 'kdna.json');
    if (!fs.existsSync(kdnaPath)) continue; // not a domain repo
    let kdna;
    try { kdna = JSON.parse(fs.readFileSync(kdnaPath, 'utf8')); }
    catch (e) {
      allFindings.push(flag('FAIL', entry, `kdna.json is not valid JSON: ${e.message}`));
      continue;
    }
    const findings = checkOne(entry, kdna);
    allFindings.push(...findings);
  }

  if (allFindings.length === 0) {
    console.log('domain-metadata-contract: all kdna.json files conform');
    return;
  }

  for (const f of allFindings) {
    const sev = strict && f.sev === 'WARN' ? 'WARN(strict)' : f.sev;
    if (f.sev === 'FAIL' || strict) console.error(`${sev} ${f.repo}: ${f.msg}`);
    else console.warn(`${sev} ${f.repo}: ${f.msg}`);
  }

  const fails = allFindings.filter(f => f.sev === 'FAIL').length;
  if (fails > 0) {
    console.error(`\ndomain-metadata-contract: ${fails} failure(s)`);
    process.exit(1);
  }
  console.log(`\ndomain-metadata-contract: ${allFindings.length} warning(s), no criticals`);
}

if (require.main === module) main();
