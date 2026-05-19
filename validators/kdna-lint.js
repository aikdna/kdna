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
function req(o, k, loc, hint) {
  if (!has(o, k) || o[k] === '' || o[k] == null) {
    let msg = `${loc}: missing required field "${k}"`;
    if (hint) msg += `\n    → ${hint}`;
    errors.push(msg);
  }
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
  warnings.push(
    `${loc}: self_check should be answerable with yes/no\n    → Try: "Did the response [do X specific domain check]?"`,
  );
}
if (!fs.existsSync(domainDir) || !fs.statSync(domainDir).isDirectory()) {
  console.error(`Not a directory: ${domainDir}`);
  process.exit(2);
}
for (const f of requiredFiles)
  if (!fs.existsSync(path.join(domainDir, f))) errors.push(`Missing required file: ${f}`);
const files = fs.readdirSync(domainDir).filter((f) => f.endsWith('.json') && f !== 'kdna.json');
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
    [
      ['id', 'Unique identifier like "AX-001". See SPEC.md §5.2'],
      [
        'one_sentence',
        'One-sentence judgment principle. Must be specific enough to change agent behavior. See docs/authoring-guide.md',
      ],
      [
        'full_statement',
        'Full explanation of the axiom — testable and domain-specific. See SPEC.md §5.2',
      ],
      ['why', 'What the agent would get wrong WITHOUT this axiom. See SPEC.md §5.2'],
    ].forEach(([f, hint]) => req(a, f, `KDNA_Core.json.axioms[${i}]`, hint)),
  );
  (core.ontology || []).forEach((c, i) =>
    [
      ['id', 'Unique identifier like "CON-001". See SPEC.md §5.3'],
      ['one_sentence', 'Name one central concept the agent must distinguish.'],
      [
        'essence',
        'Operational meaning in this domain — not a dictionary definition. See docs/authoring-guide.md',
      ],
      [
        'boundary',
        'What this concept is NOT. Name a specific concept it is often confused with. See docs/authoring-guide.md',
      ],
      [
        'trigger_signal',
        'Observable words or patterns that signal this concept is relevant. See SPEC.md §5.3',
      ],
    ].forEach(([f, hint]) => req(c, f, `KDNA_Core.json.ontology[${i}]`, hint)),
  );
  (core.frameworks || []).forEach((fw, i) =>
    [
      ['id', 'Unique identifier like "FW-001". See SPEC.md §5.4'],
      ['name', 'Descriptive name for this framework.'],
      ['when_to_use', 'Specific condition or context where this framework applies.'],
      [
        'steps',
        'Array of actionable steps. Each step should tell the agent what to do. See SPEC.md §5.4',
      ],
    ].forEach(([f, hint]) => req(fw, f, `KDNA_Core.json.frameworks[${i}]`, hint)),
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
    [
      ['id', 'Unique identifier like "MS-001". See SPEC.md §6.3'],
      [
        'wrong',
        'Common wrong interpretation an agent without domain cognition would make. See docs/authoring-guide.md',
      ],
      ['correct', 'Correct interpretation according to domain principles. See SPEC.md §6.3'],
      [
        'key_distinction',
        'The specific conceptual boundary the agent must preserve. See SPEC.md §6.3',
      ],
      ['why', 'What bad judgment results from the wrong interpretation. See SPEC.md §6.3'],
    ].forEach(([f, hint]) => req(m, f, `KDNA_Patterns.json.misunderstandings[${i}]`, hint)),
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
