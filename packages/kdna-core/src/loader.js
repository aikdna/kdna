/**
 * KDNA Core Loader — Pure logic for loading KDNA domain cognition.
 *
 * No fs, no path, no Node.js dependencies.
 * Data-first API: accepts already-parsed JSON objects.
 */

const FILE_MAP = {
  core: 'KDNA_Core.json',
  patterns: 'KDNA_Patterns.json',
  scenarios: 'KDNA_Scenarios.json',
  cases: 'KDNA_Cases.json',
  reasoning: 'KDNA_Reasoning.json',
  evolution: 'KDNA_Evolution.json',
};

/**
 * Load the minimum required KDNA data from already-parsed objects.
 * @param {object} coreData — parsed KDNA_Core.json
 * @param {object} patternsData — parsed KDNA_Patterns.json
 * @returns {object|null}
 */
function loadCorePatternsFromData(coreData, patternsData) {
  if (!coreData || !patternsData) return null;
  return { core: coreData, patterns: patternsData };
}

/**
 * Load a complete KDNA domain from a map of already-parsed data.
 *
 * @param {Object} dataMap — keyed by file type: { core, patterns, scenarios?, cases?, reasoning?, evolution? }
 * @param {object} [options]
 * @param {string} [options.input] — user input text for conditional loading
 * @param {'all'|'minimum'|'auto'} [options.mode='auto']
 * @returns {object|null}
 */
function loadDomainFromData(dataMap, options = {}) {
  const { input = '', mode = 'auto' } = options;

  const base = loadCorePatternsFromData(dataMap.core, dataMap.patterns);
  if (!base) return null;

  const result = { ...base };

  if (mode === 'minimum') return result;

  const toLoad =
    mode === 'all'
      ? ['scenarios', 'cases', 'reasoning', 'evolution']
      : classifyInput(input);

  for (const key of toLoad) {
    if (dataMap[key]) result[key] = dataMap[key];
  }

  return result;
}

/**
 * Load a KDNA domain from a map keyed by filename.
 * Converts filename keys to type keys, then delegates to loadDomainFromData.
 *
 * @param {Object} fileDataMap — e.g. { 'KDNA_Core.json': parsedObj, 'KDNA_Patterns.json': parsedObj, ... }
 * @param {object} [options] — same as loadDomainFromData
 * @returns {object|null}
 */
function loadDomainFromFiles(fileDataMap, options = {}) {
  const dataMap = {};
  for (const [key, filename] of Object.entries(FILE_MAP)) {
    if (fileDataMap[filename]) dataMap[key] = fileDataMap[filename];
  }
  return loadDomainFromData(dataMap, options);
}

/**
 * Determine which optional files to load based on user input text.
 * Pure function — no side effects.
 *
 * @param {string} text
 * @returns {string[]}
 */
function classifyInput(text) {
  const lower = (text || '').toLowerCase();
  const optional = [];

  if (
    /\b(situation|scenario|conflict|happened|tell\s+me\s+about|describe|instance|specific)\b/.test(
      lower,
    ) ||
    /(情况|场景|冲突|发生了什么|具体|描述一下|谈谈|说说看)/.test(text || '')
  ) {
    optional.push('scenarios');
  }

  if (
    /\b(example|demonstrat|full\s+case|show\s+me|sample|illustrate|walk\s+through|case)\b/.test(
      lower,
    ) ||
    /(案例|示例|演示|展示一下|完整案例|示范|讲解|举例|举个)/.test(text || '')
  ) {
    optional.push('cases');
  }

  if (
    /\b(why|rationale|principle|explain|reason|logic|how\s+come|cause)\b/.test(lower) ||
    /(为什么|原理|逻辑|解释|理由|原因|推理|依据)/.test(text || '')
  ) {
    optional.push('reasoning');
  }

  if (
    /\b(practice|improv|learn|grow|level|progress|measur|assess|evaluat|benchmark)\b/.test(lower) ||
    /(练习|提高|学习|成长|水平|进度|评估|测量|改进|提升|训练)/.test(text || '')
  ) {
    optional.push('evolution');
  }

  return [...new Set(optional)];
}

/**
 * Known field name mapping for detecting old/incorrect field names.
 * When a common old name is found, log a warning and suggest the correct name.
 */
const FIELD_ALIASES = {
  statement: 'one_sentence or full_statement',
  description: 'one_sentence',
  summary: 'one_sentence',
  claim: 'wrong',
  misreading: 'wrong',
  reality: 'correct',
  definition: 'essence or one_sentence (on ontology)',
  brief: 'title or context',
  bad_pattern: 'what_happened',
  master_pattern: 'structural_pattern',
  conclusion: 'one_sentence',
  capability_layers: 'stages',
  name: 'id (on ontology entries)',
  input: 'from',
  output: 'to',
  judgment: 'via',
};

/**
 * Deep-scan an object tree for known old field names and return warnings.
 * @param {object} obj
 * @param {string} path
 * @param {string[]} [warnings]
 * @returns {string[]}
 */
function detectOldFieldNames(obj, path = '', warnings = []) {
  if (!obj || typeof obj !== 'object') return warnings;
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => detectOldFieldNames(item, `${path}[${i}]`, warnings));
    return warnings;
  }
  for (const key of Object.keys(obj)) {
    if (FIELD_ALIASES[key]) {
      warnings.push(
        `[KDNA LOADER] ${path}.${key}: field "${key}" is not in spec v0.4. Use "${FIELD_ALIASES[key]}" instead. See docs/authoring-guide.md §0.`,
      );
    }
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      detectOldFieldNames(obj[key], `${path}.${key}`, warnings);
    }
  }
  return warnings;
}

/**
 * Format a loaded KDNA domain into a context string suitable for
 * inclusion in an agent's system prompt.
 *
 * @param {object} domain — result from loadDomainFromData() or loadDomainFromFiles()
 * @returns {string}
 */
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/^#{1,6}\s/gm, '\\# ')     // Escape leading # to prevent fake headers
    .replace(/```/g, '\\`\\`\\`')        // Escape code blocks
    .replace(/<\|/g, '&lt;|')            // Escape special tokens
    .replace(/\b(ignore|forget|disregard)\s+(all\s+)?(previous|prior|above)\s+(instructions?|directives?|rules?|constraints?)\b/gi,
      '[filtered: $&]');                 // Filter prompt injection patterns
}

function formatContext(domain) {
  if (!domain || !domain.core || !domain.patterns) return '';

  const parts = [];
  const core = domain.core;
  const pat = domain.patterns;

  // Scan for old field names and warn
  const warnings = detectOldFieldNames(domain, domain.core?.meta?.domain || 'domain');
  if (warnings.length) {
    parts.push('<!-- KDNA FIELD NAME WARNINGS:');
    for (const w of warnings) parts.push(`  ${w}`);
    parts.push('  These fields will be SILENTLY IGNORED by the loader.');
    parts.push('  See: docs/authoring-guide.md §0 (Field Name Reference)');
    parts.push('-->');
    parts.push('');
  }

  parts.push('## Domain Cognition (KDNA)');
  parts.push(`Domain: ${sanitize(core.meta.domain)}`);
  parts.push('');

  if (core.stances && core.stances.length) {
    parts.push('### Stances');
    for (const s of core.stances) {
      parts.push(`- ${sanitize(s)}`);
    }
    parts.push('');
  }

  if (core.axioms && core.axioms.length) {
    parts.push('### Axioms');
    for (const a of core.axioms) {
      parts.push(`- **${sanitize(a.one_sentence)}** ${sanitize(a.full_statement)}`);
      parts.push(`  *Why:* ${sanitize(a.why)}`);
    }
    parts.push('');
  }

  if (core.ontology && core.ontology.length) {
    parts.push('### Key Concepts');
    for (const c of core.ontology) {
      parts.push(`- **${sanitize(c.id.replace(/_/g, ' '))}** — ${sanitize(c.one_sentence)}`);
      parts.push(`  Boundary: ${sanitize(c.boundary)}`);
    }
    parts.push('');
  }

  if (core.frameworks && core.frameworks.length) {
    parts.push('### Frameworks');
    for (const fw of core.frameworks) {
      parts.push(`- **${sanitize(fw.name)}**: ${sanitize(fw.when_to_use)}`);
    }
    parts.push('');
  }

  if (pat.terminology && pat.terminology.banned_terms && pat.terminology.banned_terms.length) {
    parts.push('### Avoid These Terms');
    for (const b of pat.terminology.banned_terms) {
      parts.push(`- Avoid "${sanitize(b.term)}". ${sanitize(b.why)} Use "${sanitize(b.replace_with)}" instead.`);
    }
    parts.push('');
  }

  if (pat.misunderstandings && pat.misunderstandings.length) {
    parts.push('### Watch For These Misunderstandings');
    for (const m of pat.misunderstandings) {
      parts.push(`- **Wrong:** ${sanitize(m.wrong)}`);
      parts.push(`  **Correct:** ${sanitize(m.correct)}`);
    }
    parts.push('');
  }

  if (pat.self_check && pat.self_check.length) {
    parts.push('### Before Responding, Check');
    for (const s of pat.self_check) {
      parts.push(`- [ ] ${sanitize(s)}`);
    }
    parts.push('');
  }

  if (domain.scenarios && domain.scenarios.scenes) {
    parts.push('### Relevant Scenarios');
    for (const scene of domain.scenarios.scenes) {
      parts.push(`- **${sanitize(scene.name)}**: ${sanitize(scene.trigger_signal)}`);
    }
    parts.push('');
  }

  if (domain.reasoning && domain.reasoning.reasoning_chains) {
    parts.push('### Reasoning Chains');
    for (const r of domain.reasoning.reasoning_chains) {
      parts.push(`- **${sanitize(r.one_sentence)}** → ${sanitize(r.so_what)}`);
    }
    parts.push('');
  }

  if (domain.cases && domain.cases.cases && domain.cases.cases.length) {
    parts.push('### Cases');
    for (const c of domain.cases.cases) {
      parts.push(`- **${sanitize(c.title)}**`);
      parts.push(`  Context: ${sanitize(c.context)}`);
      parts.push(`  What happened: ${sanitize(c.what_happened)}`);
      parts.push(`  Learned: ${sanitize(c.what_was_learned)}`);
      parts.push(`  Pattern: ${sanitize(c.structural_pattern)}`);
    }
    parts.push('');
  }

  if (domain.evolution) {
    const evo = domain.evolution;
    if (evo.stages && evo.stages.length) {
      parts.push('### Growth Stages');
      for (const stage of evo.stages) {
        parts.push(`- **${sanitize(stage.name)}**: ${sanitize(stage.description)}`);
      }
      parts.push('');
    }
    if (evo.evolution_layers && evo.evolution_layers.length) {
      parts.push('### Capability Layers');
      for (const layer of evo.evolution_layers) {
        parts.push(
          `- **${sanitize(layer.name)}**: ${sanitize(layer.capability)} (${sanitize(layer.from_stage)} → ${sanitize(layer.to_stage)})`,
        );
      }
      parts.push('');
    }
    if (evo.measurement && evo.measurement.length) {
      parts.push('### Measurement');
      for (const m of evo.measurement) {
        parts.push(`- **${m.what}**: ${m.how} (threshold: ${m.threshold})`);
      }
      parts.push('');
    }
  }

  return parts.join('\n').trim();
}

module.exports = {
  FILE_MAP,
  loadCorePatternsFromData,
  loadDomainFromData,
  loadDomainFromFiles,
  classifyInput,
  formatContext,
};
