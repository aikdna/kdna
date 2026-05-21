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
  kdna validate <path>        Validate a domain directory
  kdna validate --schema <path>  Validate with JSON Schema
  kdna pack <path>            Pack a domain folder into a .kdna container (ZIP)
  kdna pack --output <dir> <path>  Output .kdna to specific directory
  kdna unpack <path>          Unpack a .kdna container to a domain folder
  kdna unpack --force <path>  Overwrite existing folder
  kdna preview <path>         Preview a .kdna or domain folder in browser
  kdna install <name>          Install official domain: @aikdna/<name>
  kdna install @scope/name     Install any scoped domain
  kdna install @aikdna/animation   Install a cluster (installs all sub-domains)
  kdna install ./file.kdna     Install from a local .kdna file
  kdna install ./folder        Install from a local directory (dev)
  kdna remove <name>           Uninstall a domain (accepts bare or @scope/name)
  kdna info <name>             Show source, version, trust info
  kdna update <name>           Update an installed domain
  kdna update --all            Update all installed domains
  kdna inspect <path>         Inspect a domain directory or .kdna file
  kdna verify <name>           Quality check: structure + trust + judgment (v2.1)
  kdna eval <path>            Evaluate domain test cases (before/after score)
  kdna eval --delta <path>    Delta comparison: With KDNA vs Without KDNA
  kdna eval --benchmark <file>  Evaluate a judgment benchmark file
  kdna eval --cluster <file>    Evaluate a cluster manifest
  kdna select "<task>"         Select the right KDNA packages for a task
  kdna export <path> [--out <file>]  Alias for kdna pack
  kdna list                   List installed domains
  kdna list --available        List available domains from registry
  kdna registry refresh        Refresh the canonical registry cache
  kdna demo                    Show no-KDNA vs with-KDNA (default: decision_state)
  kdna demo writing            Show writing judgment demo
  kdna demo code_review        Show code review judgment demo
  kdna demo --trace           Output judgment trace as JSON
  kdna setup                   One-command setup: install CLI + skills + data root
  kdna cluster lint <path>     Validate a cluster manifest
  kdna cluster apply <path> [input]  Simulate cluster routing for a task
  kdna init <name>             Scaffold a new KDNA domain from template
  kdna publish <path>          Pack + sign + output registry patch
  kdna publish <path> --release-tag <tag> --repo <o/r>   ...also upload to GitHub
  kdna publish --check <path>  Run quality gate only (no pack/upload)
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

  for (const [file, schemaFile] of Object.entries(FILE_TO_SCHEMA)) {
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

  let packed = false;

  // Strategy 1: python3 zipfile (built-in on macOS, most Linux) — use temp file
  const tmpPyFile = path.join(fs.existsSync('/tmp') ? '/tmp' : require('os').tmpdir(), `kdna-pack-${Date.now()}.py`);
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
    try { fs.unlinkSync(tmpPyFile); } catch { /* cleanup */ }
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
  eocd.writeUInt32LE(0x06054b50, 0);  // EOCD signature
  eocd.writeUInt16LE(0, 4);           // disk number
  eocd.writeUInt16LE(0, 6);           // disk with CD
  eocd.writeUInt16LE(files.length, 8); // entries on disk
  eocd.writeUInt16LE(files.length, 10); // total entries
  eocd.writeUInt32LE(cdSize, 12);     // CD size
  eocd.writeUInt32LE(cdOffset, 16);   // CD offset
  eocd.writeUInt16LE(0, 20);          // comment length

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

// ─── Preview (.kdna → browser) ──────────────────────────────────────────

function cmdPreview(filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) error(`File not found: ${abs}`);

  let core, patterns, manifest;
  let scenarios, cases, reasoning, evolution;
  const presentFiles = [];
  const isKdna = abs.endsWith('.kdna');

  if (isKdna) {
    const os = require('os');
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-preview-'));
    try {
      const script = `import zipfile,os\nzf=zipfile.ZipFile(${JSON.stringify(abs)},'r')\nzf.extractall(${JSON.stringify(tmpDir)})\nzf.close()`;
      execSync(`python3 -c ${JSON.stringify(script)}`, { stdio: 'pipe' });
    } catch {
      try {
        execSync(`unzip -q -o "${abs}" -d "${tmpDir}"`, { stdio: 'pipe' });
      } catch {
        error('Cannot read .kdna container. Install python3 or unzip.');
      }
    }
    core = readJson(path.join(tmpDir, 'KDNA_Core.json'));
    patterns = readJson(path.join(tmpDir, 'KDNA_Patterns.json'));
    manifest = readJson(path.join(tmpDir, 'kdna.json'));
    scenarios = readJson(path.join(tmpDir, 'KDNA_Scenarios.json'));
    cases = readJson(path.join(tmpDir, 'KDNA_Cases.json'));
    reasoning = readJson(path.join(tmpDir, 'KDNA_Reasoning.json'));
    evolution = readJson(path.join(tmpDir, 'KDNA_Evolution.json'));
    for (const f of fs.readdirSync(tmpDir)) {
      if (f.startsWith('KDNA_') && f.endsWith('.json')) presentFiles.push(f);
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } else if (fs.statSync(abs).isDirectory()) {
    core = readJson(path.join(abs, 'KDNA_Core.json'));
    patterns = readJson(path.join(abs, 'KDNA_Patterns.json'));
    manifest = readJson(path.join(abs, 'kdna.json'));
    scenarios = readJson(path.join(abs, 'KDNA_Scenarios.json'));
    cases = readJson(path.join(abs, 'KDNA_Cases.json'));
    reasoning = readJson(path.join(abs, 'KDNA_Reasoning.json'));
    evolution = readJson(path.join(abs, 'KDNA_Evolution.json'));
  } else {
    error('Must be a .kdna file or domain folder');
  }

  if (!core) error('KDNA_Core.json not found');

  const name = manifest?.name || core.meta?.domain || path.basename(abs, '.kdna');
  const version = manifest?.version || core.meta?.version || '?';
  const status = manifest?.status || 'experimental';
  const desc = manifest?.description || core.meta?.purpose || '';
  const fileCount = presentFiles.length || (core ? 2 : 0);

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${escHtml(name)} — KDNA Preview</title>
<style>
:root{--bg:#08100d;--bg2:#0d1713;--border:#24352b;--text:#f0ead7;--dim:#c3baa0;--muted:#8b836c;--accent:#d1ad63;--green:#76b987;--red:#df806d;--blue:#8fa7d7;--sans:Inter,system-ui,sans-serif;--mono:SF Mono,monospace}
*{box-sizing:border-box;margin:0;padding:0}body{background:var(--bg);color:var(--text);font-family:var(--sans);line-height:1.6;max-width:960px;margin:0 auto;padding:40px 24px}
.meta{display:flex;flex-wrap:wrap;gap:16px;align-items:center;padding:20px 24px;border:1px solid var(--border);border-radius:10px;background:var(--bg2);margin-bottom:24px}
.meta .name{font-size:24px;font-weight:700}
.meta .ver{color:var(--muted);font-size:14px}
.meta .badge{padding:3px 12px;border-radius:999px;font-size:11px;font-weight:700}
.badge-ok{background:rgba(118,185,135,.15);color:var(--green)}
.badge-warn{background:rgba(209,173,99,.15);color:var(--accent)}
.desc{color:var(--dim);margin:16px 0 24px;font-size:15px;line-height:1.7}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:14px}
.card{border:1px solid var(--border);border-radius:10px;background:var(--bg2);padding:20px}
.card h3{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:14px;display:flex;justify-content:space-between}
.card h3 span{color:var(--dim);font-weight:400}
.card .item{padding:10px 0;border-bottom:1px solid rgba(36,53,43,.5)}
.card .item:last-child{border-bottom:0}
.card .item strong{display:block;font-size:14px;margin-bottom:2px}
.card .item .detail{font-size:13px;color:var(--dim);line-height:1.5}
.card .item .meta{font-size:11px;color:var(--muted);margin-top:2px;padding:0;border:0;background:transparent;margin-bottom:0}
.card .item .why{color:var(--red);font-size:12px}
.card .item .replace{color:var(--green);font-size:12px}
.footer{text-align:center;color:var(--muted);margin-top:40px;font-size:13px}
.footer a{color:var(--accent)}
@media(max-width:680px){.cards{grid-template-columns:1fr}}
</style></head><body>
<h1 style="font-size:14px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:16px">KDNA Domain Preview</h1>
<div class="meta">
  <span class="name">${escHtml(name)}</span>
  <span class="ver">v${escHtml(version)}</span>
  <span class="badge badge-${status === 'validated' ? 'ok' : 'warn'}">${escHtml(status)}</span>
  <span style="color:var(--dim);font-size:13px">${presentFiles.length || '?'} files</span>
</div>
${desc ? `<p class="desc">${escHtml(desc)}</p>` : ''}
<div class="cards">
${renderCard('Axioms', core.axioms?.length, (core.axioms || []).map((a) => `<div class="item"><strong>${escHtml(a.one_sentence || '')}</strong><div class="detail">${escHtml(a.full_statement || a.why || '')}</div></div>`).join(''))}
${renderCard('Concepts', core.ontology?.length, (core.ontology || []).map((o) => `<div class="item"><strong>${escHtml(o.one_sentence || o.id || '')}</strong><div class="detail">${escHtml(o.essence || '')}</div><div class="meta">Boundary: ${escHtml(o.boundary || '')}</div></div>`).join(''))}
${renderCard('Frameworks', core.frameworks?.length, (core.frameworks || []).map((f) => `<div class="item"><strong>${escHtml(f.name || '')}</strong><div class="detail">When: ${escHtml(f.when_to_use || '')}</div><div class="detail">Steps: ${(f.steps || []).map((s) => escHtml(s)).join(' → ')}</div></div>`).join(''))}
${renderCard('Stances', core.stances?.length, (core.stances || []).map((s) => `<div class="item"><strong>${escHtml(typeof s === 'string' ? s : s.one_sentence || '')}</strong></div>`).join(''))}
${renderCard('Banned Terms', patterns?.terminology?.banned_terms?.length, (patterns?.terminology?.banned_terms || []).map((bt) => `<div class="item"><strong>${escHtml(bt.term)} <span class="replace">→ ${escHtml(bt.replace_with || '')}</span></strong><div class="why">${escHtml(bt.why || '')}</div></div>`).join(''))}
${renderCard('Misunderstandings', patterns?.misunderstandings?.length, (patterns?.misunderstandings || []).map((mu) => `<div class="item"><strong>Wrong: ${escHtml(mu.wrong || '')}</strong><div class="detail">Correct: ${escHtml(mu.correct || '')}</div><div class="meta">${escHtml(mu.key_distinction || '')}</div></div>`).join(''))}
${renderCard('Self-Checks', patterns?.self_check?.length, (patterns?.self_check || []).map((sc) => `<div class="item"><strong>✓ ${escHtml(typeof sc === 'string' ? sc : sc.one_sentence || '')}</strong></div>`).join(''))}
${scenarios ? renderCard('Scenarios', scenarios.scenes?.length || 0, (scenarios.scenes || []).map((s) => `<div class="item"><strong>${escHtml(s.name || s.id || '')}</strong><div class="detail">${escHtml(s.trigger_signal || '')}</div></div>`).join('')) : ''}
${cases ? renderCard('Cases', cases.cases?.length || 0, (cases.cases || []).map((c) => `<div class="item"><strong>${escHtml(c.title || c.id || '')}</strong><div class="detail">${escHtml((c.what_was_learned || '').substring(0, 150))}</div></div>`).join('')) : ''}
${reasoning ? renderCard('Reasoning', reasoning.reasoning_chains?.length || 0, (reasoning.reasoning_chains || []).map((r) => `<div class="item"><strong>${escHtml(r.one_sentence || r.id || '')}</strong><div class="detail">${escHtml(r.so_what || '')}</div></div>`).join('')) : ''}
${evolution ? renderCard('Evolution', evolution.stages?.length || 0, (evolution.stages || []).map((s) => `<div class="item"><strong>${escHtml(s.name || s.id || '')}</strong><div class="detail">${escHtml(s.description || '')}</div></div>`).join('')) : ''}
</div>
<div class="footer">Generated: ${new Date().toISOString().slice(0, 10)} · <a href="https://aikdna.com">aikdna.com</a></div>
</body></html>`;

  const os = require('os');
  const outPath = path.join(os.tmpdir(), `kdna-preview-${name}.html`);
  fs.writeFileSync(outPath, html);
  console.log(`✓ Preview: ${outPath}`);

  const platform = process.platform;
  try {
    if (platform === 'darwin') execSync(`open "${outPath}"`);
    else if (platform === 'win32') execSync(`start "" "${outPath}"`);
    else execSync(`xdg-open "${outPath}"`);
    console.log('  Browser opened');
  } catch {
    console.log(`  Open manually: file://${outPath}`);
  }
}

function renderCard(title, count, items) {
  if (!count || !items) return '';
  return `<div class="card"><h3>${title} <span>${count}</span></h3>${items}</div>`;
}

function escHtml(s) {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

// ─── Eval ────────────────────────────────────────────────────────────

function cmdEval(dir, deltaMode) {
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
  const bannedReplacements = {};
  (pat.terminology?.banned_terms || []).forEach((b) => {
    bannedReplacements[b.term.toLowerCase()] = (b.replace_with || '').toLowerCase();
  });
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

  function scoreOutput(text, label) {
    const lower = text.toLowerCase();
    const checks = [];

    // 1. Banned term avoidance
    let bannedHit = false;
    for (const term of bannedTerms) {
      if (lower.includes(term)) {
        checks.push({ pass: false, msg: `Uses banned term: "${term}"` });
        bannedHit = true;
        break;
      }
    }
    if (!bannedHit) checks.push({ pass: true, msg: 'Avoids all banned terms' });

    // 2. Domain concept usage
    let conceptHit = false;
    for (const concept of ontologyConcepts) {
      if (lower.includes(concept)) {
        conceptHit = true;
        break;
      }
    }
    checks.push({
      pass: conceptHit,
      msg: conceptHit ? 'References domain concepts' : 'No domain concepts referenced',
    });

    // 3. Axiom alignment
    let axiomWords = 0;
    for (const word of axiomKeywords) {
      if (lower.includes(word)) axiomWords++;
    }
    const axiomAligned = axiomWords >= 2;
    checks.push({
      pass: axiomAligned,
      msg: axiomAligned
        ? `Axiom-aligned (${axiomWords} matches)`
        : `Weak axiom alignment (${axiomWords} matches)`,
    });

    // 4. Structural indicators
    const hasStructure =
      /^(findings|verified|checked|recommend|classification)/im.test(text) ||
      text.includes('**') ||
      text.includes('triggered') ||
      text.includes('missing');
    checks.push({
      pass: hasStructure,
      msg: hasStructure ? 'Has structured judgment output' : 'Output is unstructured/generic',
    });

    // 5. Self-check relevance
    let selfCheckRelevant = 0;
    for (const sc of selfCheckItems) {
      if (sc && lower.includes(sc.substring(0, Math.min(20, sc.length)))) selfCheckRelevant++;
    }
    checks.push({
      pass: selfCheckRelevant > 0,
      msg:
        selfCheckRelevant > 0
          ? `Self-check coverage: ${selfCheckRelevant}/${selfCheckItems.length}`
          : 'No self-check indicators',
    });

    const score = checks.filter((c) => c.pass).length;
    return { score, max: 5, checks, label };
  }

  const domain = core.meta?.domain || path.basename(abs);
  console.log('═'.repeat(60));
  console.log(`  KDNA Evaluation: ${domain}`);
  if (deltaMode) console.log('  Mode: Delta (With KDNA vs Without KDNA)');
  console.log('═'.repeat(60));
  console.log('');

  let withTotal = 0,
    withoutTotal = 0;
  const maxScore = cases.length * 5;
  const results = [];

  for (let i = 0; i < cases.length; i++) {
    const tc = cases[i];
    const withKdna =
      typeof tc.with_kdna === 'string' ? tc.with_kdna : JSON.stringify(tc.with_kdna || {});
    const withoutKdna =
      typeof tc.without_kdna === 'string' ? tc.without_kdna : JSON.stringify(tc.without_kdna || {});

    const withResult = scoreOutput(withKdna, 'With KDNA');
    const withoutResult = scoreOutput(withoutKdna, 'Without KDNA');

    withTotal += withResult.score;
    withoutTotal += withoutResult.score;

    const delta = withResult.score - withoutResult.score;

    if (deltaMode) {
      console.log(`  Case ${i + 1}: "${(tc.input || '').substring(0, 60)}..."`);
      console.log(
        `  Without KDNA: ${withoutResult.score}/5  |  With KDNA: ${withResult.score}/5  |  Δ +${delta > 0 ? '+' : ''}${delta}`,
      );
      for (const c of withResult.checks) {
        console.log(`    ${c.pass ? '✓' : '✗'} ${c.msg}`);
      }
      console.log('');
    } else {
      console.log(`  Case ${i + 1}: "${(tc.input || '').substring(0, 50)}..."`);
      console.log(`  Score: ${withResult.score}/5`);
      for (const c of withResult.checks) {
        console.log(`    ${c.pass ? '✓' : '✗'} ${c.msg}`);
      }
      console.log('');
    }

    results.push({
      input: tc.input,
      withScore: withResult.score,
      withoutScore: withoutResult.score,
      delta,
      checks: withResult.checks,
    });
  }

  if (deltaMode) {
    const withPct = Math.round((withTotal / maxScore) * 100);
    const withoutPct = Math.round((withoutTotal / maxScore) * 100);
    const deltaPct = withPct - withoutPct;

    console.log('═'.repeat(60));
    console.log(`  Delta Results:`);
    console.log(`    Without KDNA: ${withoutTotal}/${maxScore} (${withoutPct}%)`);
    console.log(`    With KDNA:    ${withTotal}/${maxScore} (${withPct}%)`);
    console.log(`    Δ Improvement: +${deltaPct}%`);
    console.log('═'.repeat(60));
    console.log('');
    console.log(
      `  Cases: ${cases.length} | Average Δ: +${(deltaPct / cases.length).toFixed(1)}% per case`,
    );
    console.log('');
  } else {
    const finalScore = Math.round((withTotal / maxScore) * 100);
    const grade = finalScore >= 90 ? 'A' : finalScore >= 70 ? 'B' : finalScore >= 50 ? 'C' : 'D';
    console.log('═'.repeat(60));
    console.log(`  Overall: ${finalScore}/100 (Grade: ${grade})`);
    console.log(`  Cases: ${cases.length} | Total score: ${withTotal}/${maxScore}`);
    console.log('═'.repeat(60));
  }

  return { withTotal, withoutTotal, maxScore, results };
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
    const target = args[1];
    if (!target) error('Usage: kdna preview <file.kdna | folder>');
    cmdPreview(target);
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
      const delta = args.includes('--delta');
      const target = args.filter((a) => !a.startsWith('--'))[1];
      if (!target) error('Usage: kdna eval <path>');
      cmdEval(target, delta);
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
    const domain = args.filter((a, i) => i > 0 && !a.startsWith('--'))[0] || 'decision_state';
    if (args.includes('--trace') || args.includes('--json')) {
      runDemoJson(domain);
    } else {
      runDemo(domain);
    }
    break;
  }
  case 'setup': {
    const { cmdSetup } = require('./setup');
    cmdSetup();
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
  case 'cluster': {
    if (args[1] === 'init') {
      const { cmdClusterInit } = require('./init');
      cmdClusterInit(args[2]);
    } else {
      error('Usage: kdna cluster init <name>');
    }
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
