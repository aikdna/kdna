#!/usr/bin/env node
/**
 * kdna — Unified CLI for KDNA domain cognition assets.
 *
 * Commands:
 *   kdna validate <path>       Validate a domain directory or .kdna file
 *   kdna pack <path>           Pack a domain folder into .kdna container (ZIP)
 *   kdna unpack <path>         Unpack .kdna container to domain folder
 *   kdna preview <path>        Preview .kdna or domain folder in browser
 *   kdna install <domain-id>   Install a domain from registry
 *   kdna inspect <path>        Inspect a domain directory or .kdna file
 *   kdna list                  List installed domains
 *   kdna setup                   One-command setup: install CLI + skills + data root
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

  --- Domain authors ---
  kdna init <name>              Scaffold a new KDNA domain from template
  kdna validate <path>          Validate a domain directory
  kdna validate --schema <path>   ...with JSON Schema
  kdna pack <path>              Pack a domain folder into a .kdna container
  kdna pack --output <dir> <path>   Output .kdna to specific directory
  kdna unpack <path>            Unpack a .kdna container to a folder
  kdna inspect <path>           Inspect a domain directory or .kdna file
  kdna publish <path>           Pack + sign + output registry patch
  kdna publish <path> --release-tag <tag> --repo <o/r>   ...also upload to GitHub
  kdna publish --check <path>   Run quality gate only (no pack/upload)
  kdna version bump <patch|minor|major> [path]   Bump domain version
  kdna cluster lint <path>      Validate a cluster manifest

  --- Domain consumers ---
  kdna install <name>           Install official domain: @aikdna/<name>
  kdna install @scope/name      Install any scoped domain
  kdna install @aikdna/animation    Install a cluster (installs all sub-domains)
  kdna install ./file.kdna      Install from a local .kdna file
  kdna install ./folder         Install from a local directory (dev)
  kdna remove <name>            Uninstall a domain
  kdna update <name>            Update an installed domain
  kdna update --all             Update all installed domains
  kdna info <name>              Show version, signature, governance, risks
  kdna list                     List installed domains
  kdna list --available         List available domains from registry
  kdna search <keyword>         Search registry by name/keywords/insight
  kdna registry refresh         Refresh the canonical registry cache

  --- Quality + judgment ---
  kdna verify <name>            Quality check: structure + trust + judgment
  kdna compare <name> --input "<text>"   With/without KDNA reasoning diff
  kdna diff <name>@<v1> <name>@<v2>      Judgment-level diff between versions

  --- Agent-facing (called by the kdna-loader skill) ---
  kdna available [--json]                List installed domains + v2.1 fields
  kdna match "<task>" [--json]           Hint signals (dropped + weak overlap)
  kdna load <name> [--as=prompt|json|raw]   Emit domain in agent-ready format

  --- Identity ---
  kdna identity init            Generate Ed25519 identity key pair
  kdna identity show            Display public key and buyer ID
  kdna identity export [--out]  Backup private key (passphrase-encrypted)
  kdna identity import <file>   Restore identity from backup

  --- Other ---
  kdna setup                    One-command setup: CLI + skill + data root
  kdna version                  Show kdna CLI version
  kdna help                     Show this help

Examples:
  kdna install writing
  kdna verify @aikdna/writing
  kdna available
  kdna init my_domain
  kdna publish ./my_domain --release-tag v0.1.0 --repo yourname/kdna-my_domain`);
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

function cmdValidate(dir, _schemaOnly) {
  const abs = path.resolve(dir);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    error(`Not a directory: ${abs}`);
  }

  const { lintDomain, validateDomainSchema, validateCrossFile } = require('@aikdna/kdna-core');
  const SCHEMA_DIR = path.join(__dirname, '..', 'packages', 'kdna-core', 'schema');

  // Read all KDNA JSON files
  const files = fs.readdirSync(abs).filter((f) => f.endsWith('.json') && f !== 'kdna.json');
  const dataMap = {};
  const schemaMap = {};

  for (const f of files) {
    try {
      dataMap[f] = JSON.parse(fs.readFileSync(path.join(abs, f), 'utf8'));
    } catch (e) {
      dataMap[f] = null;
      // #24: Report JSON parse errors instead of "Missing required file"
      console.error(`  JSON parse error in ${f}: ${e.message}`);
    }
  }

  // Lint using kdna-core
  const lintResult = lintDomain(dataMap);

  // Schema validation
  const FILE_TO_SCHEMA = {
    'KDNA_Core.json': 'KDNA_Core.schema.json',
    'KDNA_Patterns.json': 'KDNA_Patterns.schema.json',
    'KDNA_Scenarios.json': 'KDNA_Scenarios.schema.json',
    'KDNA_Cases.json': 'KDNA_Cases.schema.json',
    'KDNA_Reasoning.json': 'KDNA_Reasoning.schema.json',
    'KDNA_Evolution.json': 'KDNA_Evolution.schema.json',
  };

  for (const [, schemaFile] of Object.entries(FILE_TO_SCHEMA)) {
    const schemaPath = path.join(SCHEMA_DIR, schemaFile);
    if (fs.existsSync(schemaPath)) {
      try {
        schemaMap[schemaFile] = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
      } catch {
        /* skip */
      }
    }
  }

  const schemaResult = validateDomainSchema(dataMap, schemaMap);
  const crossResult = validateCrossFile(dataMap);

  // Combine results
  const errors = [...lintResult.errors, ...schemaResult.errors, ...crossResult.errors];
  const warnings = [...lintResult.warnings, ...schemaResult.warnings, ...crossResult.warnings];

  if (warnings.length) {
    console.log('Warnings:');
    warnings.forEach((w) => console.log(`  - ${w}`));
  }
  if (errors.length) {
    console.error('Errors:');
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  const validCount = Object.keys(dataMap).filter((k) => dataMap[k]).length;
  console.log(`✓ KDNA domain valid: ${abs} (${validCount} files, schema OK)`);
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
    const jsonCount = fs
      .readdirSync(abs)
      .filter((f) => f.endsWith('.json') && f !== 'kdna.json').length;
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

  // Create ZIP container — try python3, then zip command, then Node.js native
  const outName = `${domainName}.kdna`;
  const outPath = outputDir ? path.join(outputDir, outName) : path.join(process.cwd(), outName);
  if (outputDir && !fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  let packed = false;

  // Strategy 1: python3 zipfile (built-in on macOS, most Linux) — use temp file
  const tmpPyFile = path.join(
    fs.existsSync('/tmp') ? '/tmp' : require('os').tmpdir(),
    `kdna-pack-${Date.now()}.py`,
  );
  try {
    const pyScript = `import zipfile, os
src = ${JSON.stringify(abs)}
out = ${JSON.stringify(outPath)}
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as zf:
    for f in sorted(os.listdir(src)):
        fp = os.path.join(src, f)
        if os.path.isfile(fp) and (f.endswith('.json') or f in ('README.md', 'LICENSE', 'kdna.json')):
            zf.write(fp, f)
`;
    fs.writeFileSync(tmpPyFile, pyScript);
    execSync(`python3 ${tmpPyFile}`, { stdio: 'pipe' });
    packed = true;
  } catch {
    /* Strategy 1 failed, try next */
  } finally {
    try {
      fs.unlinkSync(tmpPyFile);
    } catch {
      /* cleanup */
    }
  }

  // Strategy 2: system zip command
  if (!packed) {
    const cwd = process.cwd();
    try {
      process.chdir(abs);
      execSync(
        `zip -q -r "${outPath}" *.json README.md LICENSE 2>/dev/null || zip -q -r "${outPath}" *.json`,
        { stdio: 'pipe' },
      );
      process.chdir(cwd);
      packed = true;
    } catch {
      process.chdir(cwd);
    }
  }

  // #22: Strategy 3 — Node.js native ZIP (no external dependencies)
  if (!packed) {
    try {
      createNodeZip(abs, outPath);
      packed = true;
    } catch {
      /* last attempt failed */
    }
  }

  if (!packed) {
    const platform = process.platform;
    const hints = {
      darwin: 'macOS includes python3 — ensure it is in PATH.',
      linux: 'Install python3 or zip: apt install python3 / yum install python3 / apk add python3',
      win32: 'Install python3 from python.org, or use WSL.',
    };
    error(`Cannot create ZIP.\n${hints[platform] || 'Install python3 or zip command.'}`);
  }

  const fileCount = manifest.file_count || 0;
  console.log(`✓ Packed: ${outPath}`);
  console.log(`  Domain: ${domainName} v${manifest.version}`);
  console.log(`  Files: ${fileCount} KDNA JSONs`);
  console.log(`  Container: ZIP (DEFLATE)`);
}

// #22: Node.js-native ZIP creator (zero dependencies, fallback when python3/zip unavailable)
function createNodeZip(srcDir, outPath) {
  const zlib = require('zlib');
  const files = fs
    .readdirSync(srcDir)
    .filter((f) => f.endsWith('.json'))
    .concat(['README.md', 'LICENSE'].filter((f) => fs.existsSync(path.join(srcDir, f))));

  const centralDir = [];
  const fileData = [];
  let offset = 0;

  for (const f of files) {
    const raw = fs.readFileSync(path.join(srcDir, f));
    const crc = crc32(raw);
    const compressed = zlib.deflateRawSync(raw);
    const useStore = compressed.length >= raw.length;

    const nameBytes = Buffer.from(f, 'utf8');
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // local file header signature
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0x0800, 6); // general purpose bit flag (UTF-8)
    localHeader.writeUInt16LE(useStore ? 0 : 8, 8); // compression method: stored or deflated
    // skip mod time, mod date
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(useStore ? raw.length : compressed.length, 18); // compressed size
    localHeader.writeUInt32LE(raw.length, 22); // uncompressed size
    localHeader.writeUInt16LE(nameBytes.length, 26);

    const stored = useStore ? raw : compressed;

    fileData.push(Buffer.concat([localHeader, nameBytes, stored]));
    offset += localHeader.length + nameBytes.length + stored.length;

    // Central directory entry
    const cdEntry = Buffer.alloc(46);
    cdEntry.writeUInt32LE(0x02014b50, 0); // central dir signature
    cdEntry.writeUInt16LE(20, 4); // version made by
    cdEntry.writeUInt16LE(20, 6); // version needed
    cdEntry.writeUInt16LE(0x0800, 8); // UTF-8
    cdEntry.writeUInt16LE(useStore ? 0 : 8, 10);
    cdEntry.writeUInt32LE(crc, 16);
    cdEntry.writeUInt32LE(useStore ? raw.length : compressed.length, 20);
    cdEntry.writeUInt32LE(raw.length, 24);
    cdEntry.writeUInt16LE(nameBytes.length, 28);
    cdEntry.writeUInt32LE(offset - stored.length - nameBytes.length - localHeader.length, 42);
    centralDir.push(Buffer.concat([cdEntry, nameBytes]));
  }

  const cdOffset = offset;
  const cdSize = centralDir.reduce((s, e) => s + e.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
  eocd.writeUInt16LE(0, 4); // disk number
  eocd.writeUInt16LE(0, 6); // disk with CD
  eocd.writeUInt16LE(files.length, 8); // entries on disk
  eocd.writeUInt16LE(files.length, 10); // total entries
  eocd.writeUInt32LE(cdSize, 12); // CD size
  eocd.writeUInt32LE(cdOffset, 16); // CD offset
  eocd.writeUInt16LE(0, 20); // comment length

  const all = Buffer.concat([...fileData, ...centralDir, eocd]);
  fs.writeFileSync(outPath, all);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
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

  // Unzip using python3 zipfile (built-in) — use temp file to avoid -c multiline escaping issues
  const tmpUnpackPy = path.join(
    fs.existsSync('/tmp') ? '/tmp' : require('os').tmpdir(),
    `kdna-unpack-${Date.now()}.py`,
  );
  try {
    const script = `import zipfile, os
zf = zipfile.ZipFile(${JSON.stringify(abs)}, 'r')
zf.extractall(${JSON.stringify(outDir)})
zf.close()
`;
    fs.writeFileSync(tmpUnpackPy, script);
    execSync(`python3 ${tmpUnpackPy}`, { stdio: 'pipe' });
  } catch {
    // Fallback: use system unzip
    try {
      execSync(`unzip -q -o "${abs}" -d "${outDir}"`, { stdio: 'pipe' });
    } catch {
      error('Cannot unpack ZIP. Install python3 or unzip command.');
    }
  } finally {
    try {
      fs.unlinkSync(tmpUnpackPy);
    } catch {
      /* cleanup */
    }
  }

  console.log(`✓ Unpacked: ${outDir}`);
  const files = fs.readdirSync(outDir);
  console.log(`  Files: ${files.length}`);
  files.forEach((f) => console.log(`    ${f}`));
}

// ─── Inspect .kdna file (ZIP container or legacy merged JSON) ────────────

// ─── Inspect .kdna file (ZIP container or legacy merged JSON) ────────────

function inspectKdnaFile(filePath) {
  const abs = path.resolve(filePath);
  fs.statSync(abs); // verify file exists

  // Detect format: ZIP container (binary header PK\x03\x04) vs text
  const head = Buffer.alloc(4);
  const fd = fs.openSync(abs, 'r');
  fs.readSync(fd, head, 0, 4, 0);
  fs.closeSync(fd);
  const isZip = head[0] === 0x50 && head[1] === 0x4b;

  let core, patterns, manifest;
  const presentFiles = [];

  if (isZip) {
    // ZIP container — extract to temp, read files
    const os = require('os');
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-inspect-'));
    try {
      const tmpInspectPy = path.join(
        fs.existsSync('/tmp') ? '/tmp' : require('os').tmpdir(),
        `kdna-inspect-${Date.now()}.py`,
      );
      try {
        const script = `import zipfile, os
zf = zipfile.ZipFile(${JSON.stringify(abs)}, 'r')
zf.extractall(${JSON.stringify(tmpDir)})
zf.close()
`;
        fs.writeFileSync(tmpInspectPy, script);
        execSync(`python3 ${tmpInspectPy}`, { stdio: 'pipe' });
      } finally {
        try {
          fs.unlinkSync(tmpInspectPy);
        } catch {
          /* cleanup */
        }
      }
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
      }
      if (f === 'README.md' || f === 'LICENSE') presentFiles.push(f);
    }

    fs.rmSync(tmpDir, { recursive: true, force: true });
  } else {
    // Legacy merged JSON/YAML format (deprecated)
    const raw = fs.readFileSync(abs, 'utf8');
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = parseSimpleYaml(raw);
    }

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
    presentFiles.push('.kdna (legacy merged format)');
    if (data.scenarios) {
      presentFiles.push('scenarios (inline)');
    }
    if (data.cases) {
      presentFiles.push('cases (inline)');
    }
    if (data.reasoning) {
      presentFiles.push('reasoning (inline)');
    }
    if (data.evolution) {
      presentFiles.push('evolution (inline)');
    }
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

// ─── List ─────────────────────────────────────────────────────────────

function cmdList(showAvailable) {
  if (showAvailable) {
    const domains = loadRegistry({ allowNetwork: true });
    if (!domains || !domains.length) {
      error('No registry found.');
    }

    console.log('Available KDNA domains:');
    console.log(`Registry: ${REGISTRY_CACHE}`);
    console.log('');
    for (const d of domains) {
      const name = d.name || d.id || '?';
      const [scope, ident] = name.includes('/') ? name.split('/') : [null, name];
      const installedPath = scope ? path.join(INSTALL_DIR, scope, ident) : null;
      const installed = installedPath && fs.existsSync(installedPath) ? '[installed]' : '';
      const yanked = d.yanked ? '[yanked] ' : '';
      const dep = d.deprecated ? '[deprecated] ' : '';
      console.log(
        `  ${name.padEnd(36)} ${(d.version || '?').padEnd(8)} ${(d.type || 'domain').padEnd(8)} ${(d.status || '').padEnd(14)} ${yanked}${dep}${installed}`,
      );
      if (d.description) console.log(`    ${d.description}`);
      console.log('');
    }
    return;
  }

  if (!fs.existsSync(INSTALL_DIR)) {
    console.log('No domains installed.');
    console.log(`Installation directory: ${INSTALL_DIR}`);
    return;
  }

  // v0.7 layout: ~/.kdna/domains/@scope/name/
  const scopes = fs.readdirSync(INSTALL_DIR).filter((d) => {
    if (!d.startsWith('@')) return false;
    try {
      return fs.statSync(path.join(INSTALL_DIR, d)).isDirectory();
    } catch {
      return false;
    }
  });

  const installed = [];
  for (const scope of scopes) {
    const sd = path.join(INSTALL_DIR, scope);
    for (const ident of fs.readdirSync(sd)) {
      if (ident.startsWith('.')) continue;
      const full = path.join(sd, ident);
      try {
        if (!fs.statSync(full).isDirectory()) continue;
      } catch {
        continue;
      }
      installed.push({ scope, ident, full });
    }
  }

  // Detect and warn about legacy (un-scoped) installs
  const legacy = fs.readdirSync(INSTALL_DIR).filter((d) => {
    if (d.startsWith('@') || d.startsWith('.')) return false;
    try {
      return fs.statSync(path.join(INSTALL_DIR, d)).isDirectory();
    } catch {
      return false;
    }
  });
  if (legacy.length) {
    console.log('⚠ Legacy (un-scoped) directories detected — please remove + re-install:');
    legacy.forEach((d) => console.log(`    ~/.kdna/domains/${d}/`));
    console.log('');
  }

  if (!installed.length) {
    console.log('No v0.7 domains installed.');
    console.log(`Run: kdna install <name>      # e.g. kdna install writing`);
    return;
  }

  console.log('Installed KDNA domains:');
  console.log('');
  for (const { scope, ident, full } of installed) {
    const core = readJson(path.join(full, 'KDNA_Core.json'));
    const manifest = readJson(path.join(full, 'kdna.json'));
    const cluster = readJson(path.join(full, 'cluster.json'));
    const name = `${scope}/${ident}`;
    const version = manifest?.version || manifest?._source?.version || core?.meta?.version || '?';
    const kind = cluster ? '[cluster]' : '';
    const desc = manifest?.description || core?.meta?.purpose || '';
    console.log(`  ${name.padEnd(36)} v${version} ${kind}`);
    if (desc) console.log(`    ${desc}`);
  }
  console.log('');
  console.log(`Location: ${INSTALL_DIR}`);
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

// ─── Main ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
if (!args.length || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
  usage();
  process.exit(0);
}

const cmd = args[0];

switch (cmd) {
  case 'validate': {
    const schemaFlag = args.includes('--schema');
    const target = args.filter((a, i) => i > 0 && a !== '--schema')[0];
    if (!target) error('Usage: kdna validate <path>');
    cmdValidate(target, schemaFlag);
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
  case 'preview': {
    // Removed in v0.9 — no real user scenario for browser preview.
    // To inspect a .kdna file, use: kdna inspect <path>
    error(
      'kdna preview was removed in v0.9.\n' +
        'Use: kdna inspect <path>  to view a .kdna file or domain directory.',
    );
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
      cmdInstallExtended(`github:${url}`, args);
    } else {
      cmdInstallExtended(domainId, args);
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
  case 'verify': {
    const { cmdVerify } = require('./verify');
    const target = args.filter((a) => !a.startsWith('--'))[1];
    if (!target) {
      error(
        'Usage:\n' +
          '  kdna verify <name>             Run all three layers (structure / trust / judgment)\n' +
          '  kdna verify <name> --structure  Files + schema only\n' +
          '  kdna verify <name> --trust      Signature + scope + Ed25519 only\n' +
          '  kdna verify <name> --judgment   v2.1 governance fields + eval cases only',
      );
    }
    cmdVerify(target, args);
    break;
  }
  case 'compare': {
    const { cmdCompare } = require('./compare');
    const target = args.filter((a) => !a.startsWith('--'))[1];
    if (!target || !args.includes('--input')) {
      error(
        'Usage:\n' +
          '  kdna compare <name> --input "<text>"\n' +
          '\n' +
          'Runs your input through the LLM twice (with/without KDNA loaded),\n' +
          'then diffs the reasoning trajectory. Requires ANTHROPIC_API_KEY or\n' +
          'OPENAI_API_KEY in the environment.',
      );
    }
    (async () => {
      try {
        await cmdCompare(target, args);
      } catch (e) {
        console.error(`Error: ${e.message}`);
        process.exit(1);
      }
    })();
    break;
  }
  case 'diff': {
    const { cmdDiff } = require('./diff');
    const positional = args.filter((a) => !a.startsWith('--'));
    const a = positional[1];
    const b = positional[2];
    if (!a) {
      error(
        'Usage:\n' +
          '  kdna diff <name>@<v1> <name>@<v2>   Compare two versions\n' +
          '  kdna diff <name>                     Installed vs registry-current\n' +
          '\n' +
          'Surfaces judgment-level diff: added/removed/changed axioms,\n' +
          'misunderstandings, banned terms, stances.',
      );
    }
    (async () => {
      try {
        await cmdDiff(a, b);
      } catch (e) {
        console.error(`Error: ${e.message}`);
        process.exit(1);
      }
    })();
    break;
  }
  case 'search': {
    const { cmdSearch } = require('./search');
    const query = args.slice(1).join(' ').trim();
    cmdSearch(query);
    break;
  }
  case 'available': {
    const { cmdAvailable } = require('./agent');
    cmdAvailable(args);
    break;
  }
  case 'match': {
    const { cmdMatch } = require('./agent');
    // Collect everything after 'match' up to (but not including) any flag
    // as the task text. Then pass the flags separately.
    const positional = [];
    const flags = [];
    for (let i = 1; i < args.length; i++) {
      if (args[i].startsWith('--')) flags.push(args[i]);
      else positional.push(args[i]);
    }
    cmdMatch(positional.join(' ').trim(), flags);
    break;
  }
  case 'load': {
    const { cmdLoad } = require('./agent');
    const target = args.filter((a) => !a.startsWith('--'))[1];
    if (!target) error('Usage: kdna load <name> [--as=prompt|json|raw]');
    cmdLoad(target, args);
    break;
  }
  case 'project': {
    // Removed in v0.9 — project-level .kdna/config.json violated the
    // "install ≠ load" safety model. KDNA loading is now a per-task
    // decision made by the agent (via kdna-loader skill), not a
    // project-level whitelist.
    error(
      'kdna project was removed in v0.9. The .kdna/config.json file is no\n' +
        'longer read by the kdna-loader skill — it would have forced KDNA\n' +
        'loading on tasks where the user did not ask for it.\n\n' +
        'The agent now discovers KDNA on demand by reading ~/.kdna/domains/\n' +
        'and matching the task against v2.1 applies_when fields.\n\n' +
        'If you have stale .kdna/config.json files in your projects, you\n' +
        'can delete them — nothing reads them anymore.',
    );
    break;
  }
  case 'eval': {
    // Removed in v0.9 — overlapped with kdna compare without adding
    // distinct value, and the agent-facing match/load commands cover
    // the discovery path.
    error(
      'kdna eval was removed in v0.9.\n' +
        'To compare with/without KDNA reasoning, use:\n' +
        '  kdna compare <name> --input "<task>"\n' +
        'To inspect a domain, use:\n' +
        '  kdna info <name>',
    );
    break;
  }
  case 'select': {
    // Removed in v0.9 — replaced by the agent-facing kdna-loader skill.
    // The skill discovers KDNA via 'kdna available' and decides fit
    // using v2.1 applies_when fields. The agent makes the selection.
    error(
      'kdna select was removed in v0.9.\n' +
        'KDNA selection is now done by the kdna-loader skill (installed\n' +
        'into your agent at ~/.claude/skills/kdna-loader/ etc.).\n\n' +
        'To inspect what an agent would see, use:\n' +
        '  kdna available --json\n' +
        '  kdna match "<task>" --json',
    );
    break;
  }
  case 'export': {
    // Removed in v0.9 — was an alias for `kdna pack`.
    error(
      'kdna export was removed in v0.9 (it was an alias for pack).\n' +
        'Use: kdna pack <path> [--output <dir>]',
    );
    break;
  }
  case 'list': {
    cmdList(args.includes('--available'));
    break;
  }
  case 'demo': {
    // Removed in v0.9 — internal demo, not a user feature. To see
    // before/after on a real input, use:
    //   kdna compare <name> --input "<task>"   (requires LLM API key)
    error(
      'kdna demo was removed in v0.9.\n' +
        'To see KDNA before/after on a real input, use:\n' +
        '  kdna compare @aikdna/writing --input "<your task>"\n' +
        '(requires ANTHROPIC_API_KEY, OPENAI_API_KEY, or an OpenAI-compatible\n' +
        'endpoint in ~/.kdna/config.json)',
    );
    break;
  }
  case 'setup': {
    const { cmdSetup } = require('./setup');
    cmdSetup();
    break;
  }
  case 'cluster': {
    const { cmdClusterLint } = require('./cluster');
    const sub = args[1];
    const target = args[2];
    if (sub === 'lint') {
      if (!target) error('Usage: kdna cluster lint <path>');
      cmdClusterLint(target);
    } else if (sub === 'apply') {
      // Removed in v0.9 — overlapped with install. To install a
      // cluster's sub-domains: kdna install @scope/cluster-name
      error(
        'kdna cluster apply was removed in v0.9.\n' +
          'To install a cluster (which installs all its sub-domains):\n' +
          '  kdna install @aikdna/animation',
      );
    } else {
      error(`Unknown cluster subcommand: ${sub || '(none)'}\nUsage: kdna cluster lint <path>`);
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
      const { cmdPublish } = require('./publish');
      const target = args.filter((a) => !a.startsWith('--'))[1];
      if (!target) {
        error(
          'Usage:\n' +
            '  kdna publish <path>                      Pack + sign, output patch JSON\n' +
            '  kdna publish <path> --release-tag <tag> --repo <owner/name>\n' +
            '                                           ...also upload to GitHub Release\n' +
            '  kdna publish --check <path>              Quality gate only',
        );
      }
      cmdPublish(target, args);
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
