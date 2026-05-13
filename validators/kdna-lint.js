#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const domainDir = process.argv[2];
if (!domainDir) {
  console.error('Usage: node validators/kdna-lint.js <domain-folder>');
  process.exit(2);
}
const requiredFiles = ['KDNA_Core.json', 'KDNA_Patterns.json'];
const errors = [],
  warnings = [];
function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(path.join(domainDir, file), 'utf8'));
  } catch (e) {
    errors.push(`${file}: invalid JSON (${e.message})`);
    return null;
  }
}
function has(o, k) {
  return Object.prototype.hasOwnProperty.call(o || {}, k);
}
function req(o, k, loc) {
  if (!has(o, k) || o[k] === '' || o[k] == null)
    errors.push(`${loc}: missing required field "${k}"`);
}
function meta(o, file) {
  req(o, 'meta', file);
  if (!o.meta) return;
  ['version', 'domain', 'created', 'purpose', 'load_condition'].forEach((f) =>
    req(o.meta, f, `${file}.meta`),
  );
}
function ids(v, file, set) {
  if (Array.isArray(v)) return v.forEach((x) => ids(x, file, set));
  if (v && typeof v === 'object') {
    if (typeof v.id === 'string') {
      if (set.has(v.id)) errors.push(`${file}: duplicate id "${v.id}"`);
      set.add(v.id);
    }
    Object.values(v).forEach((x) => ids(x, file, set));
  }
}
function yesno(s, loc) {
  const t = String(s || '')
    .trim()
    .toLowerCase();
  const cn = String(s || '').trim();
  if (
    t.endsWith('?') ||
    cn.endsWith('？') ||
    cn.endsWith('吗') ||
    cn.includes('是否') ||
    /^(have|has|can|does|do|is|are|能不能|会不会|有没有|要不要|是不是)/.test(t)
  )
    return;
  warnings.push(`${loc}: self_check should be answerable with yes/no`);
}
if (!fs.existsSync(domainDir) || !fs.statSync(domainDir).isDirectory()) {
  console.error(`Not a directory: ${domainDir}`);
  process.exit(2);
}
for (const f of requiredFiles)
  if (!fs.existsSync(path.join(domainDir, f))) errors.push(`Missing required file: ${f}`);
const files = fs.readdirSync(domainDir).filter((f) => f.endsWith('.json'));
if (files.length > 6) errors.push(`Domain has ${files.length} JSON files; KDNA allows at most 6.`);
const parsed = {};
for (const f of files) {
  parsed[f] = readJson(f);
  if (parsed[f]) meta(parsed[f], f);
}
const seen = new Set();
Object.entries(parsed).forEach(([f, o]) => ids(o, f, seen));
const core = parsed['KDNA_Core.json'];
if (core) {
  ['axioms', 'ontology', 'frameworks', 'core_structure', 'stances'].forEach((f) =>
    req(core, f, 'KDNA_Core.json'),
  );
  (core.axioms || []).forEach((a, i) =>
    ['id', 'one_sentence', 'full_statement', 'why'].forEach((f) =>
      req(a, f, `KDNA_Core.json.axioms[${i}]`),
    ),
  );
  (core.ontology || []).forEach((c, i) =>
    ['id', 'one_sentence', 'essence', 'boundary', 'trigger_signal'].forEach((f) =>
      req(c, f, `KDNA_Core.json.ontology[${i}]`),
    ),
  );
  (core.frameworks || []).forEach((fw, i) =>
    ['id', 'name', 'when_to_use', 'steps'].forEach((f) =>
      req(fw, f, `KDNA_Core.json.frameworks[${i}]`),
    ),
  );
}
const pat = parsed['KDNA_Patterns.json'];
if (pat) {
  ['terminology', 'misunderstandings', 'self_check'].forEach((f) =>
    req(pat, f, 'KDNA_Patterns.json'),
  );
  ((pat.terminology || {}).banned_terms || []).forEach((b, i) =>
    ['term', 'why', 'replace_with'].forEach((f) =>
      req(b, f, `KDNA_Patterns.json.terminology.banned_terms[${i}]`),
    ),
  );
  (pat.misunderstandings || []).forEach((m, i) =>
    ['id', 'wrong', 'correct', 'key_distinction', 'why'].forEach((f) =>
      req(m, f, `KDNA_Patterns.json.misunderstandings[${i}]`),
    ),
  );
  (pat.self_check || []).forEach((s, i) => yesno(s, `KDNA_Patterns.json.self_check[${i}]`));
}
const rea = parsed['KDNA_Reasoning.json'];
if (rea) {
  (rea.reasoning_chains || []).forEach((r, i) =>
    ['id', 'one_sentence', 'logic', 'so_what'].forEach((f) =>
      req(r, f, `KDNA_Reasoning.json.reasoning_chains[${i}]`),
    ),
  );
}
const scen = parsed['KDNA_Scenarios.json'];
const sceneIds = new Set();
if (scen) (scen.scenes || []).forEach((s) => sceneIds.add(s.id));
const cases = parsed['KDNA_Cases.json'];
if (cases && scen)
  (cases.cases || []).forEach((c, i) => {
    if (c.scene_id && !sceneIds.has(c.scene_id))
      errors.push(
        `KDNA_Cases.json.cases[${i}]: scene_id "${c.scene_id}" not found in KDNA_Scenarios.json`,
      );
  });
if (warnings.length) {
  console.log('Warnings:');
  warnings.forEach((w) => console.log(`  - ${w}`));
}
if (errors.length) {
  console.error('Errors:');
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log(`✓ KDNA domain valid: ${domainDir}`);
