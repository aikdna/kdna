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
 * Format a loaded KDNA domain into a context string suitable for
 * inclusion in an agent's system prompt.
 *
 * @param {object} domain — result from loadDomainFromData() or loadDomainFromFiles()
 * @returns {string}
 */
function formatContext(domain) {
  if (!domain || !domain.core || !domain.patterns) return '';

  const parts = [];
  const core = domain.core;
  const pat = domain.patterns;

  parts.push('## Domain Cognition (KDNA)');
  parts.push(`Domain: ${core.meta.domain}`);
  parts.push('');

  if (core.stances && core.stances.length) {
    parts.push('### Stances');
    for (const s of core.stances) {
      parts.push(`- ${s}`);
    }
    parts.push('');
  }

  if (core.axioms && core.axioms.length) {
    parts.push('### Axioms');
    for (const a of core.axioms) {
      parts.push(`- **${a.one_sentence}** ${a.full_statement}`);
      parts.push(`  *Why:* ${a.why}`);
    }
    parts.push('');
  }

  if (core.ontology && core.ontology.length) {
    parts.push('### Key Concepts');
    for (const c of core.ontology) {
      parts.push(`- **${c.id.replace(/_/g, ' ')}** — ${c.one_sentence}`);
      parts.push(`  Boundary: ${c.boundary}`);
    }
    parts.push('');
  }

  if (core.frameworks && core.frameworks.length) {
    parts.push('### Frameworks');
    for (const fw of core.frameworks) {
      parts.push(`- **${fw.name}**: ${fw.when_to_use}`);
    }
    parts.push('');
  }

  if (pat.terminology && pat.terminology.banned_terms && pat.terminology.banned_terms.length) {
    parts.push('### Avoid These Terms');
    for (const b of pat.terminology.banned_terms) {
      parts.push(`- Avoid "${b.term}". ${b.why} Use "${b.replace_with}" instead.`);
    }
    parts.push('');
  }

  if (pat.misunderstandings && pat.misunderstandings.length) {
    parts.push('### Watch For These Misunderstandings');
    for (const m of pat.misunderstandings) {
      parts.push(`- **Wrong:** ${m.wrong}`);
      parts.push(`  **Correct:** ${m.correct}`);
    }
    parts.push('');
  }

  if (pat.self_check && pat.self_check.length) {
    parts.push('### Before Responding, Check');
    for (const s of pat.self_check) {
      parts.push(`- [ ] ${s}`);
    }
    parts.push('');
  }

  if (domain.scenarios && domain.scenarios.scenes) {
    parts.push('### Relevant Scenarios');
    for (const scene of domain.scenarios.scenes) {
      parts.push(`- **${scene.name}**: ${scene.trigger_signal}`);
    }
    parts.push('');
  }

  if (domain.reasoning && domain.reasoning.reasoning_chains) {
    parts.push('### Reasoning Chains');
    for (const r of domain.reasoning.reasoning_chains) {
      parts.push(`- **${r.one_sentence}** → ${r.so_what}`);
    }
    parts.push('');
  }

  if (domain.cases && domain.cases.cases && domain.cases.cases.length) {
    parts.push('### Cases');
    for (const c of domain.cases.cases) {
      parts.push(`- **${c.title}**`);
      parts.push(`  Context: ${c.context}`);
      parts.push(`  What happened: ${c.what_happened}`);
      parts.push(`  Learned: ${c.what_was_learned}`);
      parts.push(`  Pattern: ${c.structural_pattern}`);
    }
    parts.push('');
  }

  if (domain.evolution) {
    const evo = domain.evolution;
    if (evo.stages && evo.stages.length) {
      parts.push('### Growth Stages');
      for (const stage of evo.stages) {
        parts.push(`- **${stage.name}**: ${stage.description}`);
      }
      parts.push('');
    }
    if (evo.evolution_layers && evo.evolution_layers.length) {
      parts.push('### Capability Layers');
      for (const layer of evo.evolution_layers) {
        parts.push(
          `- **${layer.name}**: ${layer.capability} (${layer.from_stage} → ${layer.to_stage})`,
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
