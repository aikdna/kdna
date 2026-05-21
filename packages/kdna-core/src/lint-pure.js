/**
 * KDNA Lint — Pure structural and content validation.
 *
 * Operates on in-memory data maps. No fs, no path, no Node.js dependencies.
 * Input: { 'KDNA_Core.json': parsedObj, 'KDNA_Patterns.json': parsedObj, ... }
 * Output: { errors: string[], warnings: string[] }
 */

/**
 * Lint a KDNA domain from a map of parsed JSON objects.
 *
 * @param {Object} dataMap — keyed by filename, e.g. { 'KDNA_Core.json': {...}, ... }
 * @returns {{ errors: string[], warnings: string[] }}
 */
function lintDomain(dataMap) {
  const errors = [];
  const warnings = [];

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
      /^(have|has|can|does|do|is|are|did|was|were|should|will|would|could|might|能不能|会不会|有没有|要不要|是不是)/.test(t)
    )
      return;
    warnings.push(
      `${loc}: self_check should be answerable with yes/no\n    → Try: "Did the response [do X specific domain check]?"`,
    );
  }

  // Check required files
  const requiredFiles = ['KDNA_Core.json', 'KDNA_Patterns.json'];
  for (const f of requiredFiles) {
    if (!dataMap[f]) errors.push(`Missing required file: ${f}`);
  }

  // Check file count
  const kdnaFiles = Object.keys(dataMap).filter(
    (f) => f.endsWith('.json') && f !== 'kdna.json',
  );
  if (kdnaFiles.length > 6) errors.push(`Domain has ${kdnaFiles.length} JSON files; KDNA allows at most 6.`);

  // Validate meta on all files
  for (const f of kdnaFiles) {
    if (dataMap[f]) meta(dataMap[f], f);
  }

  // Check duplicate IDs
  const seen = new Set();
  for (const f of kdnaFiles) {
    if (dataMap[f]) ids(dataMap[f], f, seen);
  }

  // Validate KDNA_Core.json
  const core = dataMap['KDNA_Core.json'];
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

  // Validate KDNA_Patterns.json
  const pat = dataMap['KDNA_Patterns.json'];
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

  // Anti-vagueness: axioms must be domain-specific, not generic platitudes
  if (core && Array.isArray(core.axioms)) {
    const vaguePhrases = [
      'be helpful', 'be professional', 'be accurate', 'best practices',
      'user-centric', 'customer-focused', 'excellence', 'innovation',
      '以人为本', '用户至上', '最佳实践', '卓越',
    ];
    core.axioms.forEach((a, i) => {
      const text = ((a.one_sentence || '') + ' ' + (a.full_statement || '')).toLowerCase();
      vaguePhrases.forEach((phrase) => {
        if (text.includes(phrase)) {
          warnings.push(
            `KDNA_Core.json.axioms[${i}]: axiom contains vague phrase "${phrase}" — axioms must be testable and domain-specific, not generic platitudes`,
          );
        }
      });
    });
  }

  // Validate KDNA_Reasoning.json
  const rea = dataMap['KDNA_Reasoning.json'];
  if (rea) {
    (rea.reasoning_chains || []).forEach((r, i) =>
      ['id', 'one_sentence', 'logic', 'so_what'].forEach((f) =>
        req(r, f, `KDNA_Reasoning.json.reasoning_chains[${i}]`),
      ),
    );
  }

  // Cross-reference: scene_id in cases
  const scen = dataMap['KDNA_Scenarios.json'];
  const sceneIds = new Set();
  if (scen) (scen.scenes || []).forEach((s) => sceneIds.add(s.id));
  const cases = dataMap['KDNA_Cases.json'];
  if (cases && scen)
    (cases.cases || []).forEach((c, i) => {
      if (c.scene_id && !sceneIds.has(c.scene_id))
        errors.push(
          `KDNA_Cases.json.cases[${i}]: scene_id "${c.scene_id}" not found in KDNA_Scenarios.json`,
        );
    });

  return { errors, warnings };
}

module.exports = { lintDomain };
