/**
 * KDNA Lint — Pure structural and content validation.
 *
 * Operates on in-memory data maps. No fs, no path, no Node.js dependencies.
 * Input: { 'KDNA_Core.json': parsedObj, 'KDNA_Patterns.json': parsedObj, ... }
 * Output: { errors: string[], warnings: string[] }
 */

/**
 * Map of old/informal field names → correct v0.4 spec field names.
 * Used to give helpful error messages when users write from scratch without the template.
 */
const OLD_FIELD_HINTS = {
  statement: 'one_sentence or full_statement',
  description: 'one_sentence',
  summary: 'one_sentence',
  claim: 'wrong',
  misreading: 'wrong',
  reality: 'correct',
  definition: 'essence or one_sentence (on ontology entries)',
  brief: 'title or context',
  bad_pattern: 'what_happened',
  master_pattern: 'structural_pattern',
  conclusion: 'one_sentence',
  capability_layers: 'stages',
  name: 'id (on ontology entries — use id instead of name)',
  input: 'from',
  output: 'to',
  judgment: 'via',
};

const KDNA_DOMAIN_FILES = new Set([
  'KDNA_Core.json',
  'KDNA_Patterns.json',
  'KDNA_Scenarios.json',
  'KDNA_Cases.json',
  'KDNA_Reasoning.json',
  'KDNA_Evolution.json',
]);

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
      // Check for common old field name and suggest the correct one
      if (o && typeof o === 'object') {
        for (const [oldName, newName] of Object.entries(OLD_FIELD_HINTS)) {
          if (has(o, oldName)) {
            msg += `\n    → Found field "${oldName}" — this looks like an old/informal field name. Use "${newName}" instead.`;
            break;
          }
        }
      }
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
  const kdnaFiles = Object.keys(dataMap).filter((f) => KDNA_DOMAIN_FILES.has(f));
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

/**
 * Canonical enum tables for manifest validation.
 * Single source of truth — keep in sync with schema/kdna-manifest-v1rc.json and specs/enum-tables.md.
 */
const VALID_STATUS = new Set(['draft', 'experimental', 'stable', 'deprecated', 'staging']);
const VALID_BADGE = new Set(['untested', 'tested', 'validated', 'expert_reviewed', 'production_ready']);
const VALID_ACCESS = new Set(['public', 'licensed', 'remote']);
const VALID_RISK = new Set(['R0', 'R1', 'R2', 'R3']);
const VALID_I18N = new Set(['L0', 'L1', 'L2', 'L3']);
const VALID_PRIVACY = new Set(['public', 'private', 'sensitive', 'regulated']);
const VALID_ASSET_TYPE = new Set([
  'domain_judgment',
  'personal_judgment',
  'organization_standard',
  'team_policy',
  'creator_style',
  'risk_guard',
  'bundle',
]);

const MANIFEST_REQUIRED = [
  'format', 'format_version', 'spec_version', 'name', 'version',
  'judgment_version', 'description', 'author', 'license', 'status',
  'quality_badge', 'access', 'languages', 'default_language',
];

/**
 * Validate a kdna.json manifest against the canonical v1.0-rc schema.
 *
 * @param {Object} manifest — parsed kdna.json
 * @returns {{ errors: string[], warnings: string[] }}
 */
function validateManifest(manifest) {
  const errors = [];
  const warnings = [];

  if (!manifest || typeof manifest !== 'object') {
    errors.push('kdna.json: missing or empty manifest');
    return { errors, warnings };
  }

  // 1. Check disallowed pre-v1.0 manifest aliases
  if ('kdna_spec' in manifest) {
    errors.push(
      'kdna.json: kdna_spec is not allowed. Use spec_version.',
    );
  }
  if ('language' in manifest) {
    errors.push('kdna.json: language is not allowed. Use default_language and languages.');
  }

  // 2. Check required fields
  for (const field of MANIFEST_REQUIRED) {
    if (!(field in manifest) || manifest[field] === undefined || manifest[field] === '') {
      errors.push(`kdna.json: missing required field "${field}"`);
    }
  }

  // 3. Validate name format
  if (manifest.name && !/^@[a-z][a-z0-9-]*\/[a-z][a-z0-9_]*$/.test(manifest.name)) {
    errors.push(`kdna.json.name: invalid format "${manifest.name}". Expected @scope/name.`);
  }

  // 4. Validate enum fields
  if (manifest.format && manifest.format !== 'kdna') {
    errors.push(`kdna.json.format: invalid value "${manifest.format}". Expected "kdna".`);
  }
  if (manifest.format_version && manifest.format_version !== '2.0') {
    errors.push(
      `kdna.json.format_version: invalid value "${manifest.format_version}". Expected "2.0".`,
    );
  }
  if (manifest.status && !VALID_STATUS.has(manifest.status)) {
    errors.push(
      `kdna.json.status: invalid value "${manifest.status}". ` +
      `Valid: ${[...VALID_STATUS].join(', ')}`,
    );
  }
  if (manifest.quality_badge && !VALID_BADGE.has(manifest.quality_badge)) {
    errors.push(
      `kdna.json.quality_badge: invalid value "${manifest.quality_badge}". ` +
      `Valid: ${[...VALID_BADGE].join(', ')}`,
    );
  }
  if (manifest.access && !VALID_ACCESS.has(manifest.access)) {
    errors.push(
      `kdna.json.access: invalid value "${manifest.access}". ` +
      `Valid: ${[...VALID_ACCESS].join(', ')}`,
    );
  }
  if (manifest.risk_level && !VALID_RISK.has(manifest.risk_level)) {
    errors.push(
      `kdna.json.risk_level: invalid value "${manifest.risk_level}". ` +
      `Valid: ${[...VALID_RISK].join(', ')}`,
    );
  }
  if (manifest.i18n_level && !VALID_I18N.has(manifest.i18n_level)) {
    warnings.push(
      `kdna.json.i18n_level: non-standard value "${manifest.i18n_level}". ` +
      `Valid: ${[...VALID_I18N].join(', ')}`,
    );
  }
  if (manifest.privacy_level && !VALID_PRIVACY.has(manifest.privacy_level)) {
    warnings.push(
      `kdna.json.privacy_level: non-standard value "${manifest.privacy_level}". ` +
      `Valid: ${[...VALID_PRIVACY].join(', ')}`,
    );
  }
  if (manifest.asset_type && !VALID_ASSET_TYPE.has(manifest.asset_type)) {
    warnings.push(
      `kdna.json.asset_type: non-standard value "${manifest.asset_type}". ` +
      `Valid: ${[...VALID_ASSET_TYPE].join(', ')}`,
    );
  }

  // 5. Deprecated status must have replaced_by
  if (manifest.status === 'deprecated' && !manifest.replaced_by) {
    errors.push('kdna.json: status is "deprecated" but replaced_by is missing');
  }

  // 6. Tested+ badge must have signature
  const needsSig = ['tested', 'validated', 'expert_reviewed', 'production_ready'];
  if (needsSig.includes(manifest.quality_badge) && !manifest.signature) {
    warnings.push(
      `kdna.json: quality_badge "${manifest.quality_badge}" should have a signature`,
    );
  }

  // 7. Validate author
  if (manifest.author) {
    if (!manifest.author.name) errors.push('kdna.json.author: missing "name"');
    if (!manifest.author.id) errors.push('kdna.json.author: missing "id"');
    if (manifest.author.pubkey && !/^ed25519:[0-9a-f]{64}$/.test(manifest.author.pubkey)) {
      warnings.push('kdna.json.author.pubkey: non-standard format. Expected ed25519:<64 hex chars>.');
    }
  }

  // 8. Validate license
  if (manifest.license && !manifest.license.type) {
    errors.push('kdna.json.license: missing "type"');
  }

  // 9. Validate spec_version value
  if (manifest.spec_version && manifest.spec_version !== '1.0-rc') {
    warnings.push(
      `kdna.json.spec_version: non-standard value "${manifest.spec_version}". Expected "1.0-rc".`,
    );
  }

  // 10. Validate version format
  if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
    warnings.push(
      `kdna.json.version: non-semver format "${manifest.version}". Expected MAJOR.MINOR.PATCH.`,
    );
  }

  // 11. Check for removed fields
  const removedFields = ['release_status', 'domain_field', 'judgment_patterns', 'files', 'registry'];
  for (const field of removedFields) {
    if (field in manifest) {
      warnings.push(
        `kdna.json: field "${field}" is not in the canonical domain manifest and should be removed`,
      );
    }
  }

  // 12. Check removed license sub-fields
  if (manifest.license && typeof manifest.license === 'object') {
    for (const field of ['commercial', 'allow_agent_use', 'allow_redistribution', 'allow_training']) {
      if (field in manifest.license) {
        warnings.push(
          `kdna.json.license.${field}: license-type-specific field, not universal. Consider removing.`,
        );
      }
    }
  }

  return { errors, warnings };
}

module.exports = { lintDomain, validateManifest };
