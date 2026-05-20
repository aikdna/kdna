#!/usr/bin/env node
/**
 * kdna — Unified CLI for KDNA domain cognition assets.
 *
 * Commands:
 *   kdna validate <path>       Validate a domain directory or .kdna file
 *   kdna pack <path>           Pack a domain folder into .kdna container (ZIP)
 *   kdna unpack <path>         Unpack .kdna container to domain folder
 *   kdna install <domain-id>   Install a domain from registry
 *   kdna inspect <path>        Inspect a domain directory or .kdna file
 *   kdna list                  List installed domains
 *   kdna help                  Show help
 *   kdna cluster lint <path>    Validate a cluster manifest
 *   kdna cluster apply <path> [input]  Simulate cluster routing for a task
 *   kdna identity init           Generate Ed25519 identity key pair
 *   kdna identity show           Display public key and buyer ID
 */

const fs = require('fs');
const path = require('path');
const {
  CANONICAL_REGISTRY_URL,
  REGISTRY_CACHE,
  fetchRegistry,
  loadRegistry: loadCanonicalRegistry,
} = require('./registry');

const USER_KDNA_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.kdna');
const INSTALL_DIR = path.join(USER_KDNA_DIR, 'domains');

function usage() {
  console.log(`kdna — KDNA domain cognition asset tool

Usage:
  kdna validate <path>        Validate a domain directory
  kdna validate --schema <path>  Validate with JSON Schema
  kdna pack <path>            Pack a domain folder into a .kdna container (ZIP)
  kdna pack --output <dir> <path>  Output .kdna to specific directory
  kdna unpack <path>          Unpack a .kdna container to a domain folder
  kdna unpack --force <path>  Overwrite existing folder
  kdna install <domain-id>    Install a domain from registry
  kdna install github:user/repo  Install from GitHub
  kdna install github:user/repo@v1.2.0  Install version-pinned
  kdna install ./file.kdna     Install from local .kdna file
  kdna install --from-git <url>   Install from a git repository
  kdna remove <domain>          Uninstall a domain
  kdna info <domain>            Show source, version, trust level
  kdna update <domain>          Update an installed domain
  kdna update --all             Update all installed domains
  kdna inspect <path>         Inspect a domain directory or .kdna file
  kdna eval <path>            Evaluate domain test cases (before/after score)
  kdna eval --benchmark <file>  Evaluate a judgment benchmark file
  kdna eval --cluster <file>    Evaluate a cluster manifest
  kdna select "<task>"         Select the right KDNA packages for a task
  kdna export <path> [--out <file>]  Alias for kdna pack
  kdna list                   List installed domains
  kdna list --available        List available domains from registry
  kdna registry refresh        Refresh the canonical registry cache
  kdna demo                    Show no-KDNA vs with-KDNA judgment difference
  kdna demo --trace           Output judgment trace as JSON
  kdna cluster lint <path>     Validate a cluster manifest
  kdna cluster apply <path> [input]  Simulate cluster routing for a task
  kdna init <name>             Scaffold a new KDNA domain from template
  kdna publish --check <path>  Run quality gate before publishing
  kdna version bump <patch|minor|major> [path]  Bump domain version
  kdna version                 Show kdna CLI version
  kdna identity init            Generate Ed25519 identity key pair
  kdna identity show            Display public key and buyer ID
  kdna identity export [--out]  Backup private key (passphrase-encrypted)
  kdna identity import <file>   Restore identity from backup
  kdna help                   Show this help

Examples:
  kdna validate ./sales
  kdna validate ./sales --schema
  kdna pack ./sales
  kdna install writing
  kdna inspect ./sales
  kdna list`);
}

function error(msg) {
  console.error(`Error: ${msg}`);
  process.exit(1);
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
  return loadCanonicalRegistry({ allowNetwork: true });
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

// ─── Pack / Unpack (.kdna ZIP container) ──────────────────────────────────

const { execSync } = require('child_process');

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

  // Ensure kdna.json manifest exists (generate if missing)
  let manifest = readJson(path.join(abs, 'kdna.json'));
  if (!manifest) {
    const jsonCount = fs.readdirSync(abs).filter((f) => f.endsWith('.json') && f !== 'kdna.json').length;
    manifest = {
      kdna_spec: '0.4',
      name: domainName,
      version: core.meta?.version || '0.1.0',
      status: 'experimental',
      access: 'open',
      language: 'en',
      author: { name: '', id: '' },
      license: { type: 'CC-BY-4.0' },
      description: core.meta?.purpose || `${domainName} domain cognition`,
      file_count: jsonCount,
      created: core.meta?.created || new Date().toISOString().slice(0, 10),
      updated: new Date().toISOString().slice(0, 10),
    };
    writeJson(path.join(abs, 'kdna.json'), manifest);
  }

  // Create ZIP container
  const outName = `${domainName}.kdna`;
  const outPath = outputDir ? path.join(outputDir, outName) : path.join(process.cwd(), outName);

  // Use python3 zipfile (built-in, no dependency) for cross-platform ZIP
  const script = `
import zipfile, os, json, sys
src = ${JSON.stringify(abs)}
out = ${JSON.stringify(outPath)}
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as zf:
    for f in sorted(os.listdir(src)):
        fp = os.path.join(src, f)
        if os.path.isfile(fp) and (f.endswith('.json') or f in ('README.md', 'LICENSE')):
            zf.write(fp, f)
print('ok')
`;
  try {
    execSync(`python3 -c ${JSON.stringify(script)}`, { stdio: 'pipe' });
  } catch {
    // Fallback: use Node.js built-in zlib + manual ZIP (limited)
    const { createWriteStream } = require('fs');
    // Try using system zip command
    try {
      const cwd = process.cwd();
      process.chdir(abs);
      execSync(`zip -q -r "${outPath}" *.json README.md LICENSE 2>/dev/null || zip -q -r "${outPath}" *.json`, { stdio: 'pipe' });
      process.chdir(cwd);
    } catch {
      error('Cannot create ZIP. Install python3 or zip command.');
    }
  }

  const fileCount = manifest.file_count || 0;
  console.log(`✓ Packed: ${outPath}`);
  console.log(`  Domain: ${domainName} v${manifest.version}`);
  console.log(`  Files: ${fileCount} KDNA JSONs`);
  console.log(`  Container: ZIP (DEFLATE)`);
}

function cmdUnpack(filePath, force) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    error(`Not a file: ${abs}`);
  }
  if (!abs.endsWith('.kdna')) {
    error(`Not a .kdna file: ${abs}`);
  }

  const domainName = path.basename(abs, '.kdna');
  const outDir = path.join(path.dirname(abs), domainName);

  if (fs.existsSync(outDir)) {
    if (!force) error(`Directory already exists: ${outDir}\nUse --force to overwrite.`);
    fs.rmSync(outDir, { recursive: true, force: true });
  }

  fs.mkdirSync(outDir, { recursive: true });

  // Unzip using python3 zipfile (built-in)
  const script = `
import zipfile, os
zf = zipfile.ZipFile(${JSON.stringify(abs)}, 'r')
zf.extractall(${JSON.stringify(outDir)})
zf.close()
print('ok')
`;
  try {
    execSync(`python3 -c ${JSON.stringify(script)}`, { stdio: 'pipe' });
  } catch {
    // Fallback: use system unzip
    try {
      execSync(`unzip -q -o "${abs}" -d "${outDir}"`, { stdio: 'pipe' });
    } catch {
      error('Cannot unpack ZIP. Install python3 or unzip command.');
    }
  }

  console.log(`✓ Unpacked: ${outDir}`);
  const files = fs.readdirSync(outDir);
  console.log(`  Files: ${files.length}`);
  files.forEach((f) => console.log(`    ${f}`));
}

// ─── Inspect .kdna file (ZIP container or legacy merged JSON) ────────────

function inspectKdnaFile(filePath) {
  const abs = path.resolve(filePath);
  const stat = fs.statSync(abs);

  // Detect format: ZIP container (binary header PK\x03\x04) vs text
  const head = Buffer.alloc(4);
  const fd = fs.openSync(abs, 'r');
  fs.readSync(fd, head, 0, 4, 0);
  fs.closeSync(fd);
  const isZip = head[0] === 0x50 && head[1] === 0x4b;

  let core, patterns, manifest;
  let fileCount = 0;
  const presentFiles = [];

  if (isZip) {
    // ZIP container — extract to temp, read files
    const os = require('os');
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-inspect-'));
    try {
      const script = `
import zipfile, os
zf = zipfile.ZipFile(${JSON.stringify(abs)}, 'r')
zf.extractall(${JSON.stringify(tmpDir)})
zf.close()
`;
      execSync(`python3 -c ${JSON.stringify(script)}`, { stdio: 'pipe' });
    } catch {
      try {
        execSync(`unzip -q -o "${abs}" -d "${tmpDir}"`, { stdio: 'pipe' });
      } catch {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        error('Cannot read .kdna container. Install python3 or unzip.');
      }
    }

    core = readJson(path.join(tmpDir, 'KDNA_Core.json'));
    patterns = readJson(path.join(tmpDir, 'KDNA_Patterns.json'));
    manifest = readJson(path.join(tmpDir, 'kdna.json'));

    for (const f of fs.readdirSync(tmpDir)) {
      if (f.startsWith('KDNA_') && f.endsWith('.json')) {
        presentFiles.push(f);
        fileCount++;
      }
      if (f === 'README.md' || f === 'LICENSE') presentFiles.push(f);
    }

    fs.rmSync(tmpDir, { recursive: true, force: true });
  } else {
    // Legacy merged JSON/YAML format (deprecated)
    const raw = fs.readFileSync(abs, 'utf8');
    let data;
    try { data = JSON.parse(raw); } catch { data = parseSimpleYaml(raw); }

    if (!data || !data.meta) error(`Invalid .kdna file: missing meta section`);

    const m = data.meta || {};
    manifest = {
      name: m.name || m.domain,
      version: m.version || '?',
      status: data.status || '?',
      access: data.access || '?',
      language: data.language || '?',
      author: data.author || { name: '?' },
      license: data.license || { type: '?' },
      description: data.description || m.purpose || '?',
      spec_version: m.spec_version || data.kdna_spec || '?',
    };
    core = data.core || {};
    patterns = data.patterns || {};
    fileCount = 1;
    presentFiles.push('.kdna (legacy merged format)');
    if (data.scenarios) { presentFiles.push('scenarios (inline)'); fileCount++; }
    if (data.cases) { presentFiles.push('cases (inline)'); fileCount++; }
    if (data.reasoning) { presentFiles.push('reasoning (inline)'); fileCount++; }
    if (data.evolution) { presentFiles.push('evolution (inline)'); fileCount++; }
  }

  if (!core) error('KDNA_Core.json not found in container');

  const m = manifest || {};
  const c = core;
  const p = patterns || {};

  console.log('═'.repeat(50));
  console.log(`  ${m.name || c.meta?.domain || path.basename(abs, '.kdna')} — KDNA Domain`);
  console.log('═'.repeat(50));
  console.log('');
  console.log(`  Format:      .kdna ${isZip ? '(ZIP container)' : '(legacy merged)'}`);
  console.log(`  Spec:        ${m.spec_version || m.kdna_spec || '0.4'}`);
  console.log(`  Version:     ${m.version || '?'}`);
  console.log(`  Status:      ${m.status || 'experimental'}`);
  console.log(`  Access:      ${m.access || 'open'}`);
  console.log(`  Author:      ${m.author?.name || '?'}`);
  console.log(`  License:     ${m.license?.type || '?'}`);
  console.log(`  Created:     ${m.created || c.meta?.created || '?'}`);
  console.log(`  Description: ${m.description || c.meta?.purpose || '?'}`);
  console.log('');
  console.log('  ── Content ──');
  console.log(`  Axioms:             ${(c.axioms || []).length}`);
  console.log(`  Ontology concepts:  ${(c.ontology || []).length}`);
  console.log(`  Frameworks:         ${(c.frameworks || []).length}`);
  console.log(`  Stances:            ${(c.stances || []).length}`);
  console.log(`  Banned terms:       ${(p.terminology?.banned_terms || []).length}`);
  console.log(`  Misunderstandings:  ${(p.misunderstandings || []).length}`);
  console.log(`  Self-checks:        ${(p.self_check || []).length}`);
  console.log('');
  console.log('  ── Files ──');
  presentFiles.forEach((f) => console.log(`    ${f}`));
  console.log('');
  console.log('═'.repeat(50));
}

// ─── Install (legacy, now delegates to src/install.js) ──────────────

function parseSimpleYaml(raw) {
  // Parse a simple subset of YAML (no nesting beyond 1 level for sections)
  const result = {};
  let currentSection = null;

  const lines = raw.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Section header: "core:" or "  core:" etc
    if (/^[a-z_]+:$/.test(trimmed)) {
      currentSection = trimmed.slice(0, -1);
      if (!result[currentSection]) result[currentSection] = {};
      continue;
    }

    // Key: value
    const kv = trimmed.match(/^([a-z_]+):\s*(.*)/i);
    if (kv && !kv[1].startsWith('-')) {
      const key = kv[1];
      const val = kv[2].trim().replace(/^["']|["']$/g, '');
      if (currentSection) {
        if (key === 'version' && typeof result[currentSection] === 'object') {
          result[currentSection][key] = val;
        } else if (!result[currentSection][key]) {
          result[currentSection][key] = val;
        }
      } else {
        result[key] = val;
      }
      continue;
    }

    // Array item: "- value"
    if (trimmed.startsWith('- ') && currentSection) {
      // For counts only, we don't parse full arrays
      if (currentSection === 'axioms' || currentSection === 'stances') {
        if (!result.core) result.core = {};
        if (!result.core[currentSection]) result.core[currentSection] = [];
        result.core[currentSection].push({ _parsed: true });
      }
    }
  }

  return result;
}

// ─── Inspect ───────────────────────────────────────────────────────────

function cmdInspect(dir) {
  const abs = path.resolve(dir);
  const stat = fs.existsSync(abs) ? fs.statSync(abs) : null;
  if (!stat) error(`Path not found: ${abs}`);

  // Single .kdna file
  if (stat.isFile() && abs.endsWith('.kdna')) {
    inspectKdnaFile(abs);
    return;
  }

  // Directory — existing logic
  if (!stat.isDirectory()) error(`Not a KDNA domain: ${abs}`);

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
    console.log(`Registry: ${REGISTRY_CACHE}`);
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

function cmdRegistry(subcommand) {
  if (subcommand !== 'refresh') {
    error('Usage: kdna registry refresh');
  }
  const domains = fetchRegistry();
  console.log(`✓ Registry refreshed from ${CANONICAL_REGISTRY_URL}`);
  console.log(`  Cache: ${REGISTRY_CACHE}`);
  console.log(`  Domains: ${domains.length}`);
}

// ─── Export ──────────────────────────────────────────────────────────

// cmdExport is now an alias for cmdPack (deprecated merged format, v0.1-v0.3)
function cmdExport(dir, outFile) {
  cmdPack(dir, outFile);
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
  case 'unpack': {
    const target = args[1];
    if (!target) error('Usage: kdna unpack <file.kdna>');
    cmdUnpack(target, args.includes('--force'));
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
    if (!domainId) error('Usage: kdna install <domain-id|github:user/repo|./folder>');

    const { cmdInstallExtended } = require('./install');
    if (fromGit) {
      // Legacy --from-git: treat as github: URL
      const url = fromGit.replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '');
      cmdInstallExtended(`github:${url}`);
    } else {
      cmdInstallExtended(domainId);
    }
    break;
  }
  case 'registry': {
    cmdRegistry(args[1]);
    break;
  }
  case 'remove': {
    const { cmdRemove } = require('./install');
    const target = args[1];
    if (!target) error('Usage: kdna remove <domain>');
    cmdRemove(target);
    break;
  }
  case 'info': {
    const { cmdInfo } = require('./install');
    const target = args[1];
    if (!target) error('Usage: kdna info <domain>');
    cmdInfo(target);
    break;
  }
  case 'update': {
    const { cmdUpdate, cmdUpdateAll } = require('./install');
    if (args.includes('--all')) {
      cmdUpdateAll();
    } else {
      const target = args[1];
      if (!target) error('Usage: kdna update <domain>');
      cmdUpdate(target);
    }
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
      error(
        `Unknown cluster subcommand: ${sub || '(none)'}\nUsage: kdna cluster lint <path>\n       kdna cluster apply <path> [input]`,
      );
    }
    break;
  }
  case 'identity': {
    const {
      cmdIdentityInit,
      cmdIdentityShow,
      cmdIdentityExport,
      cmdIdentityImport,
    } = require('./identity');
    const sub = args[1];
    if (sub === 'init') {
      cmdIdentityInit();
    } else if (sub === 'show') {
      cmdIdentityShow();
    } else if (sub === 'export') {
      const outIdx = args.indexOf('--out');
      cmdIdentityExport(outIdx >= 0 ? args[outIdx + 1] : null);
    } else if (sub === 'import') {
      const target = args[2];
      if (!target) error('Usage: kdna identity import <file>');
      cmdIdentityImport(target);
    } else {
      error(
        `Usage: kdna identity init\n       kdna identity show\n       kdna identity export [--out <file>]\n       kdna identity import <file>`,
      );
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
      error(
        'Usage: kdna publish --check <path>\n\nRun quality gate checks before publishing a domain.',
      );
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
