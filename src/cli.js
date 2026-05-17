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
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const USER_KDNA_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || '.',
  '.kdna',
);
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
  kdna list                   List installed domains
  kdna list --available        List available domains from registry
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
  } catch (e) {
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

  const jsonFiles = fs
    .readdirSync(abs)
    .filter((f) => f.endsWith('.json') && f !== 'kdna.json');
  if (jsonFiles.length > 6) {
    lintErrors.push(
      `Domain has ${jsonFiles.length} JSON files; KDNA allows at most 6.`,
    );
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
      for (const field of [
        'version',
        'domain',
        'created',
        'purpose',
        'load_condition',
      ]) {
        if (!data.meta[field] || data.meta[field] === '') {
          lintErrors.push(`${f}.meta: missing "${field}"`);
        }
      }
    }
  }

  const core = parsed['KDNA_Core.json'];
  if (core) {
    for (const field of [
      'axioms',
      'ontology',
      'frameworks',
      'core_structure',
      'stances',
    ]) {
      if (!core[field]) lintErrors.push(`KDNA_Core.json: missing "${field}"`);
    }
    for (const a of core.axioms || []) {
      for (const f of ['id', 'one_sentence', 'full_statement', 'why']) {
        if (!a[f])
          lintErrors.push(
            `KDNA_Core.json axiom ${a.id || '?'}: missing "${f}"`,
          );
      }
    }
    for (const c of core.ontology || []) {
      for (const f of [
        'id',
        'one_sentence',
        'essence',
        'boundary',
        'trigger_signal',
      ]) {
        if (!c[f])
          lintErrors.push(
            `KDNA_Core.json ontology ${c.id || '?'}: missing "${f}"`,
          );
      }
    }
  }

  const pat = parsed['KDNA_Patterns.json'];
  if (pat) {
    for (const field of ['terminology', 'misunderstandings', 'self_check']) {
      if (!pat[field])
        lintErrors.push(`KDNA_Patterns.json: missing "${field}"`);
    }
    for (const b of (pat.terminology || {}).banned_terms || []) {
      for (const f of ['term', 'why', 'replace_with']) {
        if (!b[f])
          lintErrors.push(`KDNA_Patterns.json banned_term: missing "${f}"`);
      }
    }
    for (const m of pat.misunderstandings || []) {
      for (const f of ['id', 'wrong', 'correct', 'key_distinction', 'why']) {
        if (!m[f])
          lintErrors.push(
            `KDNA_Patterns.json misunderstanding ${m.id || '?'}: missing "${f}"`,
          );
      }
    }
    for (const s of pat.self_check || []) {
      const t = String(s).trim();
      if (
        !t.endsWith('?') &&
        !t.endsWith('？') &&
        !t.endsWith('吗') &&
        !t.includes('是否') &&
        !/^(have|has|can|does|do|is|are|能不能|会不会|有没有|要不要|是不是)/i.test(
          t,
        )
      ) {
        warnings.push(
          `self_check item should be yes/no answerable: "${t.substring(0, 60)}"`,
        );
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
    warnings.push(
      'No kdna.json manifest found. Run `kdna pack` to generate one.',
    );
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
          ajvInstance.addMetaSchema(
            require('ajv/dist/refs/json-schema-2020-12.json'),
          );
        } catch {}

        const validate = ajvInstance.compile(schema);
        if (!validate(data)) {
          for (const err of validate.errors || []) {
            lintErrors.push(
              `${file}${err.instancePath || '/'}: ${err.message}`,
            );
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
  const schemaMsg =
    schemaOk !== null ? (schemaOk ? ', schema OK' : ', schema issues') : '';
  console.log(
    `✓ KDNA domain valid: ${abs} (${count} file${count !== 1 ? 's' : ''}${schemaMsg})`,
  );
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
    kdna_spec: '0.2',
    name: domainName,
    version: currentVersion,
    language: core.meta?.language || 'en',
    languages: [core.meta?.language || 'en'],
    created: core.meta?.created || new Date().toISOString().slice(0, 10),
    updated: new Date().toISOString().slice(0, 10),
    description:
      core.meta?.description ||
      core.meta?.purpose ||
      `${domainName} domain cognition`,
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

  const outPath = outputDir
    ? path.join(outputDir, 'kdna.json')
    : path.join(abs, 'kdna.json');
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

  if (fs.existsSync(dest)) {
    console.log(`Updating ${domainId}...`);
    try {
      execSync(`git -C "${dest}" pull`, { stdio: 'inherit' });
    } catch {
      console.log('Pull failed, re-cloning...');
      fs.rmSync(dest, { recursive: true, force: true });
      execSync(`git clone "${repoUrl}" "${dest}"`, { stdio: 'inherit' });
    }
  } else {
    console.log(`Installing ${domainId} from ${repoUrl}...`);
    try {
      execSync(`git clone --depth 1 "${repoUrl}" "${dest}"`, {
        stdio: 'inherit',
      });
    } catch {
      error(
        `Failed to clone ${repoUrl}. Check the URL and your network connection.`,
      );
    }
  }

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
    error(
      `Installed directory does not appear to be a valid KDNA domain: ${dest}`,
    );
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
  console.log(
    `  ${m.name || c.meta?.domain || path.basename(abs)} — KDNA Domain`,
  );
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
    const preferred =
      pat.terminology?.preferred_terms ||
      pat.terminology?.standard_terms ||
      [];
    console.log(`  Preferred terms:    ${preferred.length}`);
    console.log(
      `  Banned terms:       ${(pat.terminology?.banned_terms || []).length}`,
    );
    console.log(
      `  Misunderstandings:  ${(pat.misunderstandings || []).length}`,
    );
    console.log(`  Self-checks:        ${(pat.self_check || []).length}`);
  }

  const sce = readJson(path.join(abs, 'KDNA_Scenarios.json'));
  if (sce) console.log(`  Scenarios:          ${(sce.scenes || []).length}`);

  const cas = readJson(path.join(abs, 'KDNA_Cases.json'));
  if (cas) console.log(`  Cases:              ${(cas.cases || []).length}`);

  const rea = readJson(path.join(abs, 'KDNA_Reasoning.json'));
  if (rea)
    console.log(
      `  Reasoning chains:   ${(rea.reasoning_chains || []).length}`,
    );

  const evo = readJson(path.join(abs, 'KDNA_Evolution.json'));
  if (evo)
    console.log(`  Evolution stages:   ${(evo.stages || []).length}`);

  console.log('');
  console.log('  ── Axioms ──');
  for (const a of c.axioms || []) {
    console.log(`  • ${a.one_sentence}`);
  }

  console.log('');
  console.log('═'.repeat(50));
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
      const installed = fs.existsSync(path.join(INSTALL_DIR, d.id))
        ? '[installed]'
        : '';
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

    const dirs = fs
      .readdirSync(INSTALL_DIR)
      .filter((d) => {
        const full = path.join(INSTALL_DIR, d);
        return (
          fs.statSync(full).isDirectory() &&
          fs.existsSync(path.join(full, 'KDNA_Core.json'))
        );
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

// ─── Main ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
if (
  !args.length ||
  args[0] === 'help' ||
  args[0] === '--help' ||
  args[0] === '-h'
) {
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
  case 'list': {
    cmdList(args.includes('--available'));
    break;
  }
  default:
    error(`Unknown command: ${cmd}\nRun: kdna help`);
}
