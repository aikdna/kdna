/**
 * KDNA Loader — Runtime library for loading KDNA domain cognition into agent context.
 *
 * Usage:
 *   const { loadDomain, loadCorePatterns } = require('@knowledge-dna/kdna');
 *   const context = loadDomain('examples/communication');
 *   // Inject context into agent system prompt
 */

const fs = require('fs');
const path = require('path');

const FILE_MAP = {
  core: 'KDNA_Core.json',
  patterns: 'KDNA_Patterns.json',
  scenarios: 'KDNA_Scenarios.json',
  cases: 'KDNA_Cases.json',
  reasoning: 'KDNA_Reasoning.json',
  evolution: 'KDNA_Evolution.json',
};

/**
 * Read and parse a KDNA JSON file.
 * Returns null if the file does not exist.
 */
function readFile(domainDir, filename) {
  const filePath = path.join(domainDir, filename);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Load the minimum required KDNA files (Core + Patterns).
 * Always load these. They form the cognition baseline.
 */
function loadCorePatterns(domainDir) {
  const core = readFile(domainDir, FILE_MAP.core);
  const patterns = readFile(domainDir, FILE_MAP.patterns);
  if (!core || !patterns) return null;
  return { core, patterns };
}

/**
 * Determine which optional files to load based on user input text.
 * Returns an array of file keys ('scenarios', 'cases', 'reasoning', 'evolution').
 */
function classifyInput(text) {
  const lower = (text || '').toLowerCase();
  const optional = [];

  // Scenario signals: concrete situation, conflict, case, specific scenario
  if (
    /\b(situation|scenario|conflict|happened|tell\s+me\s+about|describe|instance|specific)\b/.test(
      lower,
    ) ||
    /(情况|场景|冲突|发生了什么|具体|描述一下|谈谈|说说看)/.test(text || '')
  ) {
    optional.push('scenarios');
  }

  // Case signals: example requested, demonstration, full case, show me
  if (
    /\b(example|demonstrat|full\s+case|show\s+me|sample|illustrate|walk\s+through|case)\b/.test(
      lower,
    ) ||
    /(案例|示例|演示|展示一下|完整案例|示范|讲解|举例|举个)/.test(text || '')
  ) {
    optional.push('cases');
  }

  // Reasoning signals: why, rationale, principle, explain, reason, logic
  if (
    /\b(why|rationale|principle|explain|reason|logic|how\s+come|cause)\b/.test(lower) ||
    /(为什么|原理|逻辑|解释|理由|原因|推理|依据)/.test(text || '')
  ) {
    optional.push('reasoning');
  }

  // Evolution signals: practice, improve, learn, grow, level, progress, measure
  if (
    /\b(practice|improv|learn|grow|level|progress|measur|assess|evaluat|benchmark)\b/.test(lower) ||
    /(练习|提高|学习|成长|水平|进度|评估|测量|改进|提升|训练)/.test(text || '')
  ) {
    optional.push('evolution');
  }

  return [...new Set(optional)];
}

/**
 * Load a complete KDNA domain.
 *
 * @param {string} domainDir — path to the domain folder
 * @param {object} [options]
 * @param {string} [options.input] — user input text for conditional loading
 * @param {'all'|'minimum'|'auto'} [options.mode='auto'] — 'all' loads everything, 'minimum' loads Core+Patterns only, 'auto' uses input classification
 * @returns {object|null} loaded KDNA files keyed by type, or null if minimum files are missing
 */
function loadDomain(domainDir, options = {}) {
  const { input = '', mode = 'auto' } = options;

  const base = loadCorePatterns(domainDir);
  if (!base) return null;

  const result = { ...base };

  if (mode === 'minimum') return result;

  const toLoad =
    mode === 'all' ? ['scenarios', 'cases', 'reasoning', 'evolution'] : classifyInput(input);

  for (const key of toLoad) {
    const data = readFile(domainDir, FILE_MAP[key]);
    if (data) result[key] = data;
  }

  return result;
}

/**
 * Format a loaded KDNA domain into a context string suitable for
 * inclusion in an agent's system prompt.
 *
 * @param {object} domain — result from loadDomain()
 * @returns {string} formatted context string
 */
function formatContext(domain) {
  if (!domain || !domain.core || !domain.patterns) return '';

  const parts = [];
  const core = domain.core;
  const pat = domain.patterns;

  parts.push('## Domain Cognition (KDNA)');
  parts.push(`Domain: ${core.meta.domain}`);
  parts.push('');

  // Stances (load first — they set the posture)
  if (core.stances && core.stances.length) {
    parts.push('### Stances');
    for (const s of core.stances) {
      parts.push(`- ${s}`);
    }
    parts.push('');
  }

  // Axioms
  if (core.axioms && core.axioms.length) {
    parts.push('### Axioms');
    for (const a of core.axioms) {
      parts.push(`- **${a.one_sentence}** ${a.full_statement}`);
      parts.push(`  *Why:* ${a.why}`);
    }
    parts.push('');
  }

  // Ontology
  if (core.ontology && core.ontology.length) {
    parts.push('### Key Concepts');
    for (const c of core.ontology) {
      parts.push(`- **${c.id.replace(/_/g, ' ')}** — ${c.one_sentence}`);
      parts.push(`  Boundary: ${c.boundary}`);
    }
    parts.push('');
  }

  // Frameworks
  if (core.frameworks && core.frameworks.length) {
    parts.push('### Frameworks');
    for (const fw of core.frameworks) {
      parts.push(`- **${fw.name}**: ${fw.when_to_use}`);
    }
    parts.push('');
  }

  // Banned terms
  if (pat.terminology && pat.terminology.banned_terms && pat.terminology.banned_terms.length) {
    parts.push('### Avoid These Terms');
    for (const b of pat.terminology.banned_terms) {
      parts.push(`- Avoid "${b.term}". ${b.why} Use "${b.replace_with}" instead.`);
    }
    parts.push('');
  }

  // Misunderstandings
  if (pat.misunderstandings && pat.misunderstandings.length) {
    parts.push('### Watch For These Misunderstandings');
    for (const m of pat.misunderstandings) {
      parts.push(`- **Wrong:** ${m.wrong}`);
      parts.push(`  **Correct:** ${m.correct}`);
    }
    parts.push('');
  }

  // Self checks
  if (pat.self_check && pat.self_check.length) {
    parts.push('### Before Responding, Check');
    for (const s of pat.self_check) {
      parts.push(`- [ ] ${s}`);
    }
    parts.push('');
  }

  // Optional: Scenarios
  if (domain.scenarios && domain.scenarios.scenes) {
    parts.push('### Relevant Scenarios');
    for (const scene of domain.scenarios.scenes) {
      parts.push(`- **${scene.name}**: ${scene.trigger_signal}`);
    }
    parts.push('');
  }

  // Optional: Reasoning
  if (domain.reasoning && domain.reasoning.reasoning_chains) {
    parts.push('### Reasoning Chains');
    for (const r of domain.reasoning.reasoning_chains) {
      parts.push(`- **${r.one_sentence}** → ${r.so_what}`);
    }
    parts.push('');
  }

  // Optional: Cases
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

  // Optional: Evolution
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

module.exports = { loadDomain, loadCorePatterns, classifyInput, formatContext, FILE_MAP };
