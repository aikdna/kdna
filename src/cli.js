#!/usr/bin/env node
/**
 * kdna — Unified CLI for KDNA domain cognition assets.
 *
 * Commands:
 *   kdna validate <path>       Validate a domain directory or .kdna file
 *   kdna pack <path>           Generate kdna.json manifest and package
 *   kdna install <domain-id>   Install a domain from registry
 *   kdna inspect <path>        Inspect a domain and show summary
 *   kdna list                  List installed domains
 *   kdna help                  Show help
 *   kdna cluster lint <path>    Validate a cluster manifest
 *   kdna cluster apply <path> [input]  Simulate cluster routing for a task
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const USER_KDNA_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.kdna');
const INSTALL_DIR = path.join(USER_KDNA_DIR, 'domains');
const REGISTRY_CACHE = path.join(USER_KDNA_DIR, 'registry', 'domains.json');

function usage() {
  console.log(`kdna — KDNA domain cognition asset tool

Usage:
  kdna validate <path>        Validate a domain directory
  kdna validate --schema <path>  Validate with JSON Schema
  kdna pack <path>            Generate kdna.json manifest and create package
  kdna pack --output <dir> <path>  Pack to specific output directory
  kdna install <domain-id>    Install a domain from registry
  kdna install --from-git <url>   Install from a git repository
  kdna inspect <path>         Inspect a domain directory or .kdna file
  kdna eval <path>            Evaluate domain test cases (before/after score)
  kdna eval --benchmark <file>  Evaluate a judgment benchmark file
  kdna eval --cluster <file>    Evaluate a cluster manifest
  kdna select "<task>"         Select the right KDNA packages for a task
  kdna export <path> [--out <file>]  Export domain to single .kdna file
  kdna list                   List installed domains
  kdna list --available        List available domains from registry
  kdna demo                    Show no-KDNA vs with-KDNA judgment difference
  kdna demo --trace           Output judgment trace as JSON
  kdna cluster lint <path>     Validate a cluster manifest
  kdna cluster apply <path> [input]  Simulate cluster routing for a task
  kdna init <name>             Scaffold a new KDNA domain from template
  kdna publish --check <path>  Run quality gate before publishing
  kdna version bump <patch|minor|major> [path]  Bump domain version
  kdna version                 Show kdna CLI version
  kdna help                   Show this help

Examples:
  kdna validate ./sales
  kdna validate ./sales --schema
  kdna pack ./sales
  kdna install sales
  kdna inspect ./sales
  kdna list`);
}

function error(msg) {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

function loadRegistry() {
  // Check local cache first
  if (fs.existsSync(REGISTRY_CACHE)) {
    const data = readJson(REGISTRY_CACHE);
    if (data) {
      if (Array.isArray(data)) return data;
      if (data.domains) return data.domains;
    }
  }
  // Fall back to repo registry
  const repoRegistry = path.join(__dirname, '..', 'registry', 'domains.json');
  if (fs.existsSync(repoRegistry)) {
    const data = readJson(repoRegistry);
    if (data) {
      if (Array.isArray(data)) return data;
      if (data.domains) return data.domains;
    }
  }
  return null;
}

// ─── Validate ────────────────────────────────────────────────────────

function cmdValidate(dir, schemaOnly) {
  const abs = path.resolve(dir);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    error(`Not a directory: ${abs}`);
  }

  const requiredFiles = ['KDNA_Core.json', 'KDNA_Patterns.json'];
  const warnings = [];
  const lintErrors = [];

  for (const f of requiredFiles) {
    if (!fs.existsSync(path.join(abs, f))) {
      lintErrors.push(`Missing required file: ${f}`);
    }
  }

  const jsonFiles = fs.readdirSync(abs).filter((f) => f.endsWith('.json') && f !== 'kdna.json');
  if (jsonFiles.length > 6) {
    lintErrors.push(`Domain has ${jsonFiles.length} JSON files; KDNA allows at most 6.`);
  }

  const parsed = {};
  for (const f of jsonFiles) {
    const data = readJson(path.join(abs, f));
    if (!data) {
      lintErrors.push(`${f}: invalid JSON`);
      continue;
    }
    parsed[f] = data;

    if (!data.meta) {
      lintErrors.push(`${f}: missing meta object`);
    } else {
      for (const field of ['version', 'domain', 'created', 'purpose', 'load_condition']) {
        if (!data.meta[field] || data.meta[field] === '') {
          lintErrors.push(`${f}.meta: missing "${field}"`);
        }
      }
    }
  }

  const core = parsed['KDNA_Core.json'];
  if (core) {
    for (const field of ['axioms', 'ontology', 'frameworks', 'core_structure', 'stances']) {
      if (!core[field]) lintErrors.push(`KDNA_Core.json: missing "${field}"`);
    }
    for (const a of core.axioms || []) {
      for (const f of ['id', 'one_sentence', 'full_statement', 'why']) {
        if (!a[f]) lintErrors.push(`KDNA_Core.json axiom ${a.id || '?'}: missing "${f}"`);
      }
    }
    for (const c of core.ontology || []) {
      for (const f of ['id', 'one_sentence', 'essence', 'boundary', 'trigger_signal']) {
        if (!c[f]) lintErrors.push(`KDNA_Core.json ontology ${c.id || '?'}: missing "${f}"`);
      }
    }
  }

  const pat = parsed['KDNA_Patterns.json'];
  if (pat) {
    for (const field of ['terminology', 'misunderstandings', 'self_check']) {
      if (!pat[field]) lintErrors.push(`KDNA_Patterns.json: missing "${field}"`);
    }
    for (const b of (pat.terminology || {}).banned_terms || []) {
      for (const f of ['term', 'why', 'replace_with']) {
        if (!b[f]) lintErrors.push(`KDNA_Patterns.json banned_term: missing "${f}"`);
      }
    }
    for (const m of pat.misunderstandings || []) {
      for (const f of ['id', 'wrong', 'correct', 'key_distinction', 'why']) {
        if (!m[f])
          lintErrors.push(`KDNA_Patterns.json misunderstanding ${m.id || '?'}: missing "${f}"`);
      }
    }
    for (const s of pat.self_check || []) {
      const t = String(s).trim();
      if (
        !t.endsWith('?') &&
        !t.endsWith('？') &&
        !t.endsWith('吗') &&
        !t.includes('是否') &&
        !/^(have|has|can|does|do|is|are|能不能|会不会|有没有|要不要|是不是)/i.test(t)
      ) {
        warnings.push(`self_check item should be yes/no answerable: "${t.substring(0, 60)}"`);
      }
    }
  }

  const seen = new Set();
  function collectIds(obj) {
    if (Array.isArray(obj)) obj.forEach(collectIds);
    else if (obj && typeof obj === 'object') {
      if (typeof obj.id === 'string') {
        if (seen.has(obj.id)) lintErrors.push(`Duplicate ID: "${obj.id}"`);
        seen.add(obj.id);
      }
      Object.values(obj).forEach(collectIds);
    }
  }
  for (const [, data] of Object.entries(parsed)) collectIds(data);

  const manifest = readJson(path.join(abs, 'kdna.json'));
  if (!manifest) {
    warnings.push('No kdna.json manifest found. Run `kdna pack` to generate one.');
  }

  let schemaOk = true;
  if (schemaOnly || process.argv.includes('--schema')) {
    const SCHEMA_DIR = path.join(__dirname, '..', 'schema');
    const schemaMap = {
      'KDNA_Core.json': 'KDNA_Core.schema.json',
      'KDNA_Patterns.json': 'KDNA_Patterns.schema.json',
      'KDNA_Scenarios.json': 'KDNA_Scenarios.schema.json',
      'KDNA_Cases.json': 'KDNA_Cases.schema.json',
      'KDNA_Reasoning.json': 'KDNA_Reasoning.schema.json',
      'KDNA_Evolution.json': 'KDNA_Evolution.schema.json',
    };

    let ajv, addFormats;
    try {
      ajv = require('ajv');
      try {
        addFormats = require('ajv-formats');
      } catch {
        addFormats = null;
      }
    } catch {
      warnings.push(
        'ajv not available. Schema validation skipped. Install: npm install ajv ajv-formats',
      );
      schemaOk = null;
    }

    if (schemaOk !== null) {
      for (const [file, schemaFile] of Object.entries(schemaMap)) {
        const filePathVal = path.join(abs, file);
        const schemaPath = path.join(SCHEMA_DIR, schemaFile);
        if (!fs.existsSync(filePathVal) || !fs.existsSync(schemaPath)) continue;

        const data = readJson(filePathVal);
        if (!data) continue;

        const schema = readJson(schemaPath);
        if (!schema) continue;
        delete schema.$schema;

        const ajvInstance = new ajv({ allErrors: true, strict: false });
        if (addFormats) addFormats(ajvInstance);
        try {
          ajvInstance.addMetaSchema(require('ajv/dist/refs/json-schema-2020-12.json'));
        } catch {
          /* meta-schema not available */
        }

        const validate = ajvInstance.compile(schema);
        if (!validate(data)) {
          for (const err of validate.errors || []) {
            lintErrors.push(`${file}${err.instancePath || '/'}: ${err.message}`);
          }
          schemaOk = false;
        }
      }
    }
  }

  if (warnings.length) {
    console.log('Warnings:');
    warnings.forEach((w) => console.log(`  - ${w}`));
  }
  if (lintErrors.length) {
    console.error('Errors:');
    lintErrors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  const count = Object.keys(parsed).length;
  const schemaMsg = schemaOk !== null ? (schemaOk ? ', schema OK' : ', schema issues') : '';
  console.log(`✓ KDNA domain valid: ${abs} (${count} file${count !== 1 ? 's' : ''}${schemaMsg})`);
}

// ─── Pack ────────────────────────────────────────────────────────────

function cmdPack(dir, outputDir) {
  const abs = path.resolve(dir);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    error(`Not a directory: ${abs}`);
  }

  const core = readJson(path.join(abs, 'KDNA_Core.json'));
  const pat = readJson(path.join(abs, 'KDNA_Patterns.json'));
  if (!core) error('KDNA_Core.json not found or invalid');
  if (!pat) error('KDNA_Patterns.json not found or invalid');

  const domainName = core.meta?.domain || path.basename(abs);

  const existing = readJson(path.join(abs, 'kdna.json'));
  const currentVersion = existing?.version || core.meta?.version || '0.1.0';

  const authorName = existing?.author?.name || '';
  const authorId = existing?.author?.id || '';
  const existingLicense = existing?.license || null;
  const existingRegistry = existing?.registry || {};
  const existingKeywords = existing?.keywords || [];
  const existingStatus = existing?.status || 'experimental';

  const jsonCount = fs
    .readdirSync(abs)
    .filter((f) => f.endsWith('.json') && f !== 'kdna.json').length;

  const manifest = {
    kdna_spec: '0.4',
    name: domainName,
    version: currentVersion,
    language: core.meta?.language || 'en',
    languages: [core.meta?.language || 'en'],
    created: core.meta?.created || new Date().toISOString().slice(0, 10),
    updated: new Date().toISOString().slice(0, 10),
    description: core.meta?.description || core.meta?.purpose || `${domainName} domain cognition`,
    keywords: existingKeywords,
    access: 'open',
    author: {
      name: authorName,
      id: authorId,
    },
    license: existingLicense || {
      type: 'CC-BY-4.0',
      url: 'https://creativecommons.org/licenses/by/4.0/',
      allow_agent_use: true,
      allow_redistribution: true,
      allow_training: false,
    },
    status: existingStatus,
    registry: existingRegistry,
    file_count: jsonCount,
  };

  const outPath = outputDir ? path.join(outputDir, 'kdna.json') : path.join(abs, 'kdna.json');
  writeJson(outPath, manifest);
  console.log(`✓ kdna.json manifest created: ${outPath}`);
  console.log(`  Domain: ${manifest.name} v${manifest.version}`);
  console.log(`  Files: ${manifest.file_count}`);
  console.log(`  Status: ${manifest.status}`);
  console.log(`  Access: ${manifest.access}`);

  console.log('');
  cmdValidate(abs, false);
}

// ─── Install ─────────────────────────────────────────────────────────

function cmdInstall(domainId, fromGit) {
  ensureDir(INSTALL_DIR);

  const domains = loadRegistry();
  if (!domains || !domains.length) {
    error('No registry found. Run `kdna list --available` to see available domains.');
  }

  const entry = domains.find((d) => d.id === domainId);
  if (!entry) {
    error(
      `Domain "${domainId}" not found in registry.\nAvailable: ${domains.map((d) => d.id).join(', ')}`,
    );
  }

  if (entry.access && entry.access !== 'open') {
    error(
      `Domain "${domainId}" requires "${entry.access}" access. Only "open" domains can be installed via CLI.`,
    );
  }

  const dest = path.join(INSTALL_DIR, domainId);
  const repoUrl = fromGit || entry.repo;
  if (!repoUrl) error(`No repository URL found for domain "${domainId}".`);

  // Extract repo org/name for tarball fallback
  const repoMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/.]+)/);
  const tarballUrl = repoMatch
    ? `https://api.github.com/repos/${repoMatch[1]}/${repoMatch[2]}/tarball/main`
    : null;

  if (fs.existsSync(dest)) {
    console.log(`Updating ${domainId}...`);
    let updated = false;

    // Try git pull
    try {
      execSync(`git -C "${dest}" pull`, { stdio: 'inherit' });
      updated = true;
    } catch {
      console.log('Pull failed, re-cloning...');
      fs.rmSync(dest, { recursive: true, force: true });
    }

    if (!updated && !fs.existsSync(dest)) {
      // Re-clone after failed pull
      cloneOrDownload(repoUrl, tarballUrl, dest, domainId);
    }
  } else {
    console.log(`Installing ${domainId} from ${repoUrl}...`);
    cloneOrDownload(repoUrl, tarballUrl, dest, domainId);
  }

  validateInstalledDomain(dest);
}

function cloneOrDownload(repoUrl, tarballUrl, dest, domainId) {
  // Strategy 1: HTTPS git clone
  if (tryClone(repoUrl, dest)) return;

  // Strategy 2: SSH git clone
  const sshUrl = repoUrl.replace(/https:\/\/github\.com\//, 'git@github.com:') + '.git';
  if (tryClone(sshUrl, dest)) return;

  // Strategy 3: Download tarball from GitHub archive
  if (tarballUrl) {
    console.log(`Git clone failed. Trying tarball download...`);
    if (tryTarball(tarballUrl, dest)) return;
  }

  error(
    `Failed to install "${domainId}".\n` +
      `  Tried: HTTPS clone, SSH clone, tarball download.\n` +
      `  Check your network and GitHub authentication.`,
  );
}

function tryClone(url, dest) {
  try {
    execSync(`git clone --depth 1 "${url}" "${dest}"`, {
      stdio: 'pipe',
      timeout: 30000,
    });
    return true;
  } catch {
    return false;
  }
}

function tryTarball(url, dest) {
  try {
    const tarballPath = `${dest}.tar.gz`;
    execSync(`curl -fsSL -o "${tarballPath}" "${url}"`, { stdio: 'pipe', timeout: 60000 });

    // Extract to temp dir first (GitHub wraps in org-repo-commit/ dir)
    const tmpDir = `${dest}.tmp`;
    fs.mkdirSync(tmpDir, { recursive: true });
    execSync(`tar -xzf "${tarballPath}" -C "${tmpDir}"`, { stdio: 'pipe' });
    fs.unlinkSync(tarballPath);

    // Move contents out of the wrapper directory
    const entries = fs.readdirSync(tmpDir);
    if (entries.length === 1) {
      const wrapper = path.join(tmpDir, entries[0]);
      if (fs.statSync(wrapper).isDirectory()) {
        fs.renameSync(wrapper, dest);
      } else {
        fs.renameSync(tmpDir, dest);
      }
    } else {
      fs.renameSync(tmpDir, dest);
    }

    // Cleanup
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    return true;
  } catch {
    return false;
  }
}

function validateInstalledDomain(dest) {
  if (fs.existsSync(path.join(dest, 'KDNA_Core.json'))) {
    console.log('');
    console.log(`Domain installed: ${dest}`);
    cmdValidate(dest, false);
    if (!fs.existsSync(path.join(dest, 'kdna.json'))) {
      console.log('');
      cmdPack(dest);
    }
  } else {
    const dirs = fs.readdirSync(dest).filter((d) => {
      const full = path.join(dest, d);
      return fs.statSync(full).isDirectory();
    });
    for (const d of dirs) {
      if (fs.existsSync(path.join(dest, d, 'KDNA_Core.json'))) {
        const realDest = path.join(dest, d);
        console.log(`Found domain in subdirectory: ${realDest}`);
        cmdValidate(realDest, false);
        if (!fs.existsSync(path.join(realDest, 'kdna.json'))) {
          console.log('');
          cmdPack(realDest);
        }
        return;
      }
    }
    error(`Installed directory does not appear to be a valid KDNA domain: ${dest}`);
  }
}

// ─── Inspect ─────────────────────────────────────────────────────────

function cmdInspect(dir) {
  const abs = path.resolve(dir);
  const stat = fs.existsSync(abs) ? fs.statSync(abs) : null;
  if (!stat) error(`Path not found: ${abs}`);

  const core = readJson(path.join(abs, 'KDNA_Core.json'));
  const manifest = readJson(path.join(abs, 'kdna.json'));

  if (!core) {
    error(`Not a KDNA domain (KDNA_Core.json not found in ${abs})`);
  }

  const m = manifest || {};
  const c = core;

  console.log('═'.repeat(50));
  console.log(`  ${m.name || c.meta?.domain || path.basename(abs)} — KDNA Domain`);
  console.log('═'.repeat(50));
  console.log('');
  console.log(`  Version:     ${m.version || c.meta?.version || '?'}`);
  console.log(`  Status:      ${m.status || 'experimental'}`);
  console.log(`  Access:      ${m.access || 'open'}`);
  console.log(`  Language:    ${m.language || c.meta?.language || '?'}`);
  console.log(`  Author:      ${m.author?.name || '?'}`);
  if (m.author?.id) console.log(`               ${m.author.id}`);
  console.log(`  License:     ${m.license?.type || '?'}`);
  console.log(`  Created:     ${c.meta?.created || '?'}`);
  console.log(`  Description: ${m.description || c.meta?.purpose || '?'}`);
  console.log('');

  const expected = [
    'KDNA_Core.json',
    'KDNA_Patterns.json',
    'KDNA_Scenarios.json',
    'KDNA_Cases.json',
    'KDNA_Reasoning.json',
    'KDNA_Evolution.json',
  ];

  console.log('  ── File Set ──');
  for (const f of expected) {
    const exists = fs.existsSync(path.join(abs, f));
    console.log(`  ${exists ? '✓' : '○'} ${f}`);
  }

  console.log('');
  console.log('  ── Content ──');
  console.log(`  Axioms:             ${(c.axioms || []).length}`);
  console.log(`  Ontology concepts:  ${(c.ontology || []).length}`);
  console.log(`  Frameworks:         ${(c.frameworks || []).length}`);
  console.log(`  Core structures:    ${(c.core_structure || []).length}`);
  console.log(`  Stances:            ${(c.stances || []).length}`);

  const pat = readJson(path.join(abs, 'KDNA_Patterns.json'));
  if (pat) {
    const preferred = pat.terminology?.preferred_terms || pat.terminology?.standard_terms || [];
    console.log(`  Preferred terms:    ${preferred.length}`);
    console.log(`  Banned terms:       ${(pat.terminology?.banned_terms || []).length}`);
    console.log(`  Misunderstandings:  ${(pat.misunderstandings || []).length}`);
    console.log(`  Self-checks:        ${(pat.self_check || []).length}`);
  }

  const sce = readJson(path.join(abs, 'KDNA_Scenarios.json'));
  if (sce) console.log(`  Scenarios:          ${(sce.scenes || []).length}`);

  const cas = readJson(path.join(abs, 'KDNA_Cases.json'));
  if (cas) console.log(`  Cases:              ${(cas.cases || []).length}`);

  const rea = readJson(path.join(abs, 'KDNA_Reasoning.json'));
  if (rea) console.log(`  Reasoning chains:   ${(rea.reasoning_chains || []).length}`);

  const evo = readJson(path.join(abs, 'KDNA_Evolution.json'));
  if (evo) console.log(`  Evolution stages:   ${(evo.stages || []).length}`);

  console.log('');
  console.log('  ── Axioms ──');
  for (const a of c.axioms || []) {
    console.log(`  • ${a.one_sentence}`);
  }

  console.log('');
  console.log('═'.repeat(50));
}

// ─── Eval ────────────────────────────────────────────────────────────

function cmdEval(dir) {
  const abs = path.resolve(dir);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    error(`Not a directory: ${abs}`);
  }

  const core = readJson(path.join(abs, 'KDNA_Core.json'));
  const pat = readJson(path.join(abs, 'KDNA_Patterns.json'));
  if (!core) error('KDNA_Core.json not found');
  if (!pat) error('KDNA_Patterns.json not found');

  const testFile = path.join(abs, 'tests', 'before-after.json');
  if (!fs.existsSync(testFile)) {
    error(`No test cases found. Create: ${abs}/tests/before-after.json`);
  }

  const cases = readJson(testFile);
  if (!Array.isArray(cases) || !cases.length) {
    error('No test cases in before-after.json');
  }

  // Build lookup structures
  const bannedTerms = new Set(
    (pat.terminology?.banned_terms || []).map((b) => b.term.toLowerCase()),
  );
  const axiomKeywords = new Set(
    (core.axioms || []).flatMap((a) =>
      (a.one_sentence + ' ' + a.full_statement)
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3),
    ),
  );
  const ontologyConcepts = new Set((core.ontology || []).map((o) => o.id?.toLowerCase()));
  const selfCheckItems = (pat.self_check || []).map((s) =>
    (typeof s === 'string' ? s : s.question || '').toLowerCase(),
  );

  console.log('═'.repeat(60));
  console.log(`  KDNA Evaluation: ${core.meta?.domain || path.basename(abs)}`);
  console.log('═'.repeat(60));
  console.log('');

  let totalScore = 0;
  const maxScore = cases.length * 5;
  const results = [];

  for (let i = 0; i < cases.length; i++) {
    const tc = cases[i];
    const withKdna = tc.with_kdna || {};
    const withoutKdna = tc.without_kdna || {};
    const kdnaText = JSON.stringify(withKdna).toLowerCase();
    const noKdnaText = JSON.stringify(withoutKdna).toLowerCase();

    const checks = [];

    // 1. Banned term avoidance (weight: 1)
    let bannedHit = false;
    for (const term of bannedTerms) {
      if (kdnaText.includes(term)) {
        checks.push({ pass: false, msg: `Uses banned term: "${term}"` });
        bannedHit = true;
        break;
      }
    }
    if (!bannedHit) {
      checks.push({ pass: true, msg: 'Avoids all banned terms' });
    }

    // 2. Domain concept usage (weight: 1)
    let conceptHit = false;
    for (const concept of ontologyConcepts) {
      if (kdnaText.includes(concept)) {
        conceptHit = true;
        break;
      }
    }
    checks.push({
      pass: conceptHit,
      msg: conceptHit ? 'References domain concepts' : 'Does not reference domain concepts',
    });

    // 3. Axiom alignment (weight: 1)
    let axiomWords = 0;
    for (const word of axiomKeywords) {
      if (kdnaText.includes(word)) axiomWords++;
    }
    const axiomAligned = axiomWords >= 2;
    checks.push({
      pass: axiomAligned,
      msg: axiomAligned
        ? `Axiom-aligned (${axiomWords} keyword matches)`
        : `Weak axiom alignment (${axiomWords} keyword matches, need ≥2)`,
    });

    // 4. Judgement difference from no-KDNA (weight: 1)
    const overlapWords = kdnaText.split(/\s+/).filter((w) => noKdnaText.includes(w)).length;
    const kdnaWords = kdnaText.split(/\s+/).length || 1;
    const overlapRatio = overlapWords / kdnaWords;
    const clearlyDifferent = overlapRatio < 0.5;
    checks.push({
      pass: clearlyDifferent,
      msg: clearlyDifferent
        ? `Clearly different from no-KDNA (${Math.round(overlapRatio * 100)}% overlap)`
        : `Similar to no-KDNA (${Math.round(overlapRatio * 100)}% overlap — should be more distinct)`,
    });

    // 5. Self-check relevance (weight: 1)
    let selfCheckRelevant = 0;
    for (const sc of selfCheckItems) {
      if (kdnaText.includes(sc.substring(0, 20))) selfCheckRelevant++;
    }
    checks.push({
      pass: true,
      msg: `Self-check coverage: ${selfCheckRelevant}/${selfCheckItems.length} items potentially relevant`,
    });

    const caseScore = checks.filter((c) => c.pass).length;
    totalScore += caseScore;

    console.log(`  Case ${i + 1}: "${tc.input?.substring(0, 50)}..."`);
    console.log(`  Score: ${caseScore}/5`);
    for (const c of checks) {
      console.log(`    ${c.pass ? '✓' : '✗'} ${c.msg}`);
    }
    console.log('');

    results.push({ input: tc.input, score: caseScore, checks });
  }

  const finalScore = Math.round((totalScore / maxScore) * 100);
  const grade = finalScore >= 90 ? 'A' : finalScore >= 70 ? 'B' : finalScore >= 50 ? 'C' : 'D';

  console.log('═'.repeat(60));
  console.log(`  Overall: ${finalScore}/100 (Grade: ${grade})`);
  console.log(`  Cases: ${cases.length} | Total score: ${totalScore}/${maxScore}`);
  console.log('═'.repeat(60));

  // Recommendations
  console.log('');
  console.log('  Recommendations:');
  if (finalScore < 90) {
    const weakAreas = results.flatMap((r) => r.checks.filter((c) => !c.pass));
    const uniqueMsgs = [...new Set(weakAreas.map((w) => w.msg))];
    for (const msg of uniqueMsgs.slice(0, 5)) {
      console.log(`    • ${msg}`);
    }
  } else {
    console.log('    • Domain test coverage is strong. Consider adding more edge cases.');
  }
  console.log('');

  return finalScore;
}

function cmdEvalBenchmark(benchmarkFile) {
  const abs = path.resolve(benchmarkFile);
  if (!fs.existsSync(abs)) error(`Benchmark file not found: ${abs}`);

  const benchmark = readJson(abs);
  if (!benchmark || !benchmark.patterns) error('Invalid benchmark file');

  console.log('═'.repeat(60));
  console.log(`  KDNA Benchmark: ${benchmark.benchmark || path.basename(abs)}`);
  console.log('═'.repeat(60));
  console.log('');

  let totalCases = 0;
  let totalPassed = 0;

  for (const pattern of benchmark.patterns) {
    console.log(`  ${pattern.name}`);
    console.log(`  ${pattern.tagline || ''}`);
    let patternPassed = 0;

    for (let i = 0; i < (pattern.cases || []).length; i++) {
      const c = pattern.cases[i];
      const checks = [];

      // 1. Signal identified?
      checks.push({
        pass: Boolean(c.with_kdna && c.with_kdna.length > 20),
        label: 'signal_identified',
      });

      // 2. Different from baseline?
      const noKdna = (c.without_kdna || '').toLowerCase();
      const withKdna = (c.with_kdna || '').toLowerCase();
      const overlapWords = withKdna.split(/\s+/).filter((w) => noKdna.includes(w)).length;
      const kdnaWords = withKdna.split(/\s+/).length || 1;
      checks.push({
        pass: overlapWords / kdnaWords < 0.6,
        label: 'clearly_different',
      });

      // 3. Banned term check (simple heuristic)
      const bannedPatterns = ['offer discount', 'motivate harder', 'just build it', 'wait and see'];
      const hasBanned = bannedPatterns.some((b) => withKdna.includes(b));
      checks.push({ pass: !hasBanned, label: 'avoids_banned_terms' });

      const casePassed = checks.filter((c) => c.pass).length;
      if (casePassed >= 2) patternPassed++;

      totalCases++;
      totalPassed += casePassed >= 2 ? 1 : 0;

      console.log(
        `    Case ${i + 1}: ${casePassed >= 2 ? '✓' : '✗'} (${casePassed}/${checks.length} checks passed)`,
      );
    }

    const rate = Math.round((patternPassed / Math.max(pattern.cases.length, 1)) * 100);
    console.log(`    Score: ${patternPassed}/${pattern.cases.length} (${rate}%)`);
    console.log('');
  }

  const finalRate = Math.round((totalPassed / Math.max(totalCases, 1)) * 100);
  const grade = finalRate >= 90 ? 'A' : finalRate >= 70 ? 'B' : finalRate >= 50 ? 'C' : 'D';

  console.log('═'.repeat(60));
  console.log(`  Overall: ${totalPassed}/${totalCases} passed (${finalRate}%, Grade: ${grade})`);
  console.log('═'.repeat(60));
  console.log('');
}

function cmdEvalCluster(clusterFile) {
  const abs = path.resolve(clusterFile);
  if (!fs.existsSync(abs)) error(`Cluster file not found: ${abs}`);

  const cluster = readJson(abs);
  if (!cluster || !cluster.packages) error('Invalid cluster file');

  console.log('═'.repeat(60));
  console.log(`  KDNA Cluster Eval: ${cluster.name} v${cluster.version}`);
  console.log('═'.repeat(60));
  console.log('');

  let totalScore = 0;
  const maxScore = 5;

  // 1. Valid manifest structure
  const hasName = Boolean(cluster.name);
  const hasVersion = Boolean(cluster.version);
  const hasPackages = Array.isArray(cluster.packages) && cluster.packages.length >= 2;
  console.log(`  ${hasName ? '✓' : '✗'} Has name`);
  console.log(`  ${hasVersion ? '✓' : '✗'} Has version`);
  console.log(`  ${hasPackages ? '✓' : '✗'} Has ≥2 packages (${cluster.packages?.length || 0})`);
  if (hasName && hasVersion && hasPackages) totalScore++;

  // 2. Roles assigned
  const hasPrimary = cluster.packages?.some((p) => p.role === 'primary');
  const allRoles = cluster.packages?.every((p) =>
    ['primary', 'advisor', 'constraint', 'critic'].includes(p.role),
  );
  console.log(`  ${hasPrimary ? '✓' : '✗'} Has primary package`);
  console.log(`  ${allRoles ? '✓' : '✗'} All packages have valid roles`);
  if (hasPrimary && allRoles) totalScore++;

  // 3. Composition rules
  const hasRules = Array.isArray(cluster.composition_rules) && cluster.composition_rules.length > 0;
  console.log(
    `  ${hasRules ? '✓' : '✗'} Has composition rules (${cluster.composition_rules?.length || 0})`,
  );
  if (hasRules) totalScore++;

  // 4. Routing questions
  const hasRouting =
    Array.isArray(cluster.routing_questions) && cluster.routing_questions.length > 0;
  console.log(
    `  ${hasRouting ? '✓' : '✗'} Has routing questions (${cluster.routing_questions?.length || 0})`,
  );
  if (hasRouting) totalScore++;

  // 5. use_when conditions on packages
  const hasUseWhen = cluster.packages?.every(
    (p) => Array.isArray(p.use_when) && p.use_when.length > 0,
  );
  console.log(`  ${hasUseWhen ? '✓' : '✗'} All packages have use_when conditions`);
  if (hasUseWhen) totalScore++;

  console.log('');
  console.log(`  Score: ${totalScore}/${maxScore}`);
  console.log('═'.repeat(60));
}

// ─── List ─────────────────────────────────────────────────────────────

function cmdList(showAvailable) {
  if (showAvailable) {
    const domains = loadRegistry();
    if (!domains || !domains.length) {
      error('No registry found.');
    }

    console.log('Available KDNA domains:');
    console.log('');
    for (const d of domains) {
      const installed = fs.existsSync(path.join(INSTALL_DIR, d.id)) ? '[installed]' : '';
      console.log(
        `  ${(d.id || '?').padEnd(18)} ${(d.version || '?').padEnd(8)} ${(d.status || '').padEnd(14)} ${installed}`,
      );
      if (d.description) console.log(`    ${d.description}`);
      console.log('');
    }
  } else {
    if (!fs.existsSync(INSTALL_DIR)) {
      console.log('No domains installed.');
      console.log(`Installation directory: ${INSTALL_DIR}`);
      return;
    }

    const dirs = fs.readdirSync(INSTALL_DIR).filter((d) => {
      const full = path.join(INSTALL_DIR, d);
      return fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, 'KDNA_Core.json'));
    });

    if (!dirs.length) {
      console.log('No domains installed.');
      console.log(`Run: kdna install <domain-id>`);
      return;
    }

    console.log('Installed KDNA domains:');
    console.log('');
    for (const d of dirs) {
      const core = readJson(path.join(INSTALL_DIR, d, 'KDNA_Core.json'));
      const manifest = readJson(path.join(INSTALL_DIR, d, 'kdna.json'));
      const version = manifest?.version || core?.meta?.version || '?';
      const desc = manifest?.description || core?.meta?.purpose || '';
      console.log(`  ${d.padEnd(18)} v${version}`);
      if (desc) console.log(`    ${desc}`);
    }
    console.log('');
    console.log(`Location: ${INSTALL_DIR}`);
  }
}

// ─── Export ──────────────────────────────────────────────────────────

function cmdExport(dir, outFile) {
  const abs = path.resolve(dir);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    error(`Not a directory: ${abs}`);
  }
  const core = readJson(path.join(abs, 'KDNA_Core.json'));
  if (!core) error('KDNA_Core.json not found');
  const pat = readJson(path.join(abs, 'KDNA_Patterns.json'));
  const manifest = readJson(path.join(abs, 'kdna.json'));
  const kdna = {
    kdna_spec: '0.4',
    meta: {
      name: core.meta?.domain || path.basename(abs),
      version: manifest?.version || core.meta?.version || '0.1.0',
      language: 'en',
      created: core.meta?.created || '',
      description: manifest?.description || core.meta?.purpose || '',
      access: manifest?.access || 'open',
    },
    author: manifest?.author || { name: '', id: '' },
    license: manifest?.license || { type: 'CC-BY-4.0' },
    core: {
      axioms: core.axioms || [],
      ontology: core.ontology || [],
      frameworks: core.frameworks || [],
      core_structure: core.core_structure || [],
      stances: core.stances || [],
    },
    patterns: pat
      ? {
          terminology: pat.terminology || {},
          misunderstandings: pat.misunderstandings || [],
          self_check: pat.self_check || [],
        }
      : { terminology: {}, misunderstandings: [], self_check: [] },
  };
  for (const [key, filename] of [
    ['scenarios', 'KDNA_Scenarios.json'],
    ['cases', 'KDNA_Cases.json'],
    ['reasoning', 'KDNA_Reasoning.json'],
    ['evolution', 'KDNA_Evolution.json'],
  ]) {
    const data = readJson(path.join(abs, filename));
    if (data) {
      delete data.meta;
      kdna[key] = data;
    }
  }
  const name = outFile || `${kdna.meta.name}.kdna`;
  const outPath = path.resolve(name);
  fs.writeFileSync(outPath, JSON.stringify(kdna, null, 2));
  console.log(`✓ Exported: ${outPath}`);
  console.log(`  Domain: ${kdna.meta.name} v${kdna.meta.version}`);
}

// ─── Main ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
if (!args.length || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
  usage();
  process.exit(0);
}

const cmd = args[0];

switch (cmd) {
  case 'validate': {
    const target = args[1];
    if (!target) error('Usage: kdna validate <path>');
    cmdValidate(target, args.includes('--schema'));
    break;
  }
  case 'pack': {
    let output = null;
    let target = null;
    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--output' || args[i] === '-o') {
        output = args[i + 1];
        i++;
      } else if (!target) {
        target = args[i];
      }
    }
    if (!target) error('Usage: kdna pack <path>');
    cmdPack(target, output);
    break;
  }
  case 'install': {
    let domainId = null;
    let fromGit = null;
    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--from-git') {
        fromGit = args[i + 1];
        i++;
      } else if (!domainId) {
        domainId = args[i];
      }
    }
    if (!domainId) error('Usage: kdna install <domain-id>');
    cmdInstall(domainId, fromGit);
    break;
  }
  case 'inspect': {
    const target = args[1];
    if (!target) error('Usage: kdna inspect <path>');
    cmdInspect(target);
    break;
  }
  case 'eval': {
    if (args.includes('--benchmark')) {
      const idx = args.indexOf('--benchmark');
      const target = args[idx + 1] || args.filter((a) => !a.startsWith('--'))[1];
      if (!target || target.startsWith('--')) error('Usage: kdna eval --benchmark <file>');
      cmdEvalBenchmark(target);
    } else if (args.includes('--cluster')) {
      const idx = args.indexOf('--cluster');
      const target = args[idx + 1] || args.filter((a) => !a.startsWith('--'))[1];
      if (!target || target.startsWith('--')) error('Usage: kdna eval --cluster <file>');
      cmdEvalCluster(target);
    } else {
      const target = args[1];
      if (!target) error('Usage: kdna eval <path>');
      cmdEval(target);
    }
    break;
  }
  case 'select': {
    const { cmdSelect } = require('./select');
    cmdSelect(args.slice(1).join(' '));
    break;
  }
  case 'export': {
    const target = args[1];
    if (!target) error('Usage: kdna export <path> [--out <file>]');
    let outFile = null;
    const outIdx = args.indexOf('--out');
    if (outIdx >= 0) outFile = args[outIdx + 1];
    cmdExport(target, outFile);
    break;
  }
  case 'list': {
    cmdList(args.includes('--available'));
    break;
  }
  case 'demo': {
    const { runDemo, runDemoJson } = require('./demo');
    if (args.includes('--trace') || args.includes('--json')) {
      runDemoJson();
    } else {
      runDemo();
    }
    break;
  }
  case 'cluster': {
    const { cmdClusterLint, cmdClusterApply } = require('./cluster');
    const sub = args[1];
    const target = args[2];
    if (sub === 'lint') {
      if (!target) error('Usage: kdna cluster lint <path>');
      cmdClusterLint(target);
    } else if (sub === 'apply') {
      if (!target) error('Usage: kdna cluster apply <path> [input]');
      cmdClusterApply(target, args.slice(3).join(' '));
    } else {
      error(`Unknown cluster subcommand: ${sub || '(none)'}\nUsage: kdna cluster lint <path>\n       kdna cluster apply <path> [input]`);
    }
    break;
  }
  case 'init': {
    const { cmdInit } = require('./init');
    cmdInit(args[1]);
    break;
  }
  case 'publish': {
    if (args.includes('--check')) {
      const { cmdPublishCheck } = require('./publish');
      const idx = args.indexOf('--check');
      const target = args[idx + 1] || args.filter((a) => !a.startsWith('--'))[1] || '.';
      if (!target || target.startsWith('--')) error('Usage: kdna publish --check <path>');
      cmdPublishCheck(target);
    } else {
      error('Usage: kdna publish --check <path>\n\nRun quality gate checks before publishing a domain.');
    }
    break;
  }
  case 'version': {
    const { cmdVersionBump } = require('./version');
    const sub = args[1];
    if (sub === 'bump') {
      const level = args[2];
      const target = args[3] || '.';
      if (!level || !['patch', 'minor', 'major'].includes(level)) {
        error('Usage: kdna version bump <patch|minor|major> [path]');
      }
      cmdVersionBump(level, target);
    } else {
      console.log(`kdna v${require('../package.json').version}`);
      console.log('');
      console.log('Usage: kdna version bump <patch|minor|major> [path]');
    }
    break;
  }
  default:
    error(`Unknown command: ${cmd}\nRun: kdna help`);
}
