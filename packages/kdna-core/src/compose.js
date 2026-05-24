/**
 * KDNA Compose — Multi-domain composition logic.
 *
 * Merges judgment constraints from multiple domains into a single
 * agent context. Domains contribute independently; conflicts are
 * surfaced, not silently resolved.
 */

const { formatContext } = require('./loader');

/**
 * Compose multiple loaded domains into a single agent context string.
 *
 * Each domain contributes its own section. If two domains define
 * conflicting axioms or banned terms, both are included — the agent
 * must report the conflict, not pick one.
 *
 * @param {Array<{core:object, patterns:object}>} domains
 * @param {object} [options]
 * @param {string} [options.separator] — section separator
 * @returns {string}
 */
function composeContext(domains, options = {}) {
  if (!domains || !domains.length) return '';

  const separator = options.separator || '\n\n---\n\n';

  return domains
    .filter((d) => d && d.core && d.patterns)
    .map((d) => formatContext(d))
    .filter((ctx) => ctx)
    .join(separator);
}

/**
 * Match user input against domain trigger_signals to determine
 * which domains should be activated.
 *
 * Each domain can define trigger_signals in its core (array of
 * keywords or phrases). This function checks if any signal matches
 * the input and returns the list of matching domain indices.
 *
 * @param {string} input — user task description
 * @param {Array<{id:string, core:{trigger_signals?:string[]}}>} domains
 * @returns {number[]} — indices of matching domains
 */
function classifySignals(input, domains) {
  if (!input || !domains || !domains.length) return [];

  const lower = input.toLowerCase();
  const active = [];

  for (let i = 0; i < domains.length; i++) {
    const domain = domains[i];
    const signals = domain.core?.trigger_signals || [];

    if (!signals.length) {
      // No signals defined → domain is primary (always active)
      active.push(i);
      continue;
    }

    const matched = signals.some((signal) => lower.includes(signal.toLowerCase()));
    if (matched) active.push(i);
  }

  return active;
}

/**
 * Compose self-check items from multiple domains into a single
 * checklist. Each domain's checks are prefixed with its domain name
 * so conflicts are visible.
 *
 * @param {Array<{id:string, core:{meta:{domain:string}}, patterns:{self_check:string[]}}>} domains
 * @returns {string[]}
 */
function composeChecks(domains) {
  if (!domains || !domains.length) return [];

  const checks = [];

  for (const domain of domains) {
    const name = domain.core?.meta?.domain || domain.id || 'unknown';
    const items = domain.patterns?.self_check || [];

    if (!items.length) continue;

    if (domains.length === 1) {
      checks.push(...items);
    } else {
      for (const item of items) {
        checks.push(`[${name}] ${item}`);
      }
    }
  }

  return checks;
}

/**
 * Load multiple domains from data maps and compose their context.
 * Convenience function: loads each domain, then composes.
 *
 * @param {Array<object>} dataMaps — array of file data maps
 * @param {object} [options] — passed to loadDomainFromFiles + composeContext
 * @returns {{ domains: Array, context: string, activeIndices: number[] }}
 */
function loadAndCompose(dataMaps, options = {}) {
  const { loadDomainFromFiles } = require('./loader');

  const domains = dataMaps.map((dm) => loadDomainFromFiles(dm, options)).filter(Boolean);

  const { input = '' } = options;
  const activeIndices = classifySignals(input, domains);

  const activeDomains = activeIndices.map((i) => domains[i]);
  const context = composeContext(activeDomains, options);

  return { domains, context, activeIndices };
}

/**
 * Compose context with source attribution — every axiom, misunderstanding,
 * banned term, and self-check is prefixed with its origin domain.
 *
 * @param {Array<{id:string, core:object, patterns:object}>} domains
 * @param {object} [options]
 * @param {string} [options.separator] — section separator
 * @returns {{context: string, attributionMap: object}}
 */
function composeContextWithAttribution(domains, options = {}) {
  if (!domains || !domains.length) return { context: '', attributionMap: {} };

  const separator = options.separator || '\n\n---\n\n';
  const lines = [];
  const attributionMap = {};
  let axiomIndex = 0;
  let misreadingIndex = 0;
  let termIndex = 0;
  let checkIndex = 0;

  for (const domain of domains) {
    if (!domain || !domain.core) continue;
    const name = domain.id || domain.core.meta?.domain || 'unknown';
    const core = domain.core;
    const patterns = domain.patterns || {};

    lines.push(`## [${name}] Domain cognition`);

    if (core.axioms?.length) {
      lines.push(`### Axioms`);
      for (const a of core.axioms) {
        const tag = `[${name}:axiom.${a.id}]`;
        lines.push(`- ${tag} ${a.one_sentence}`);
        if (a.applies_when?.length) {
          lines.push(`  APPLIES WHEN: ${a.applies_when.join('; ')}`);
        }
        if (a.does_not_apply_when?.length) {
          lines.push(`  DOES NOT APPLY WHEN: ${a.does_not_apply_when.join('; ')}`);
        }
        if (a.failure_risk) lines.push(`  RISK IF MISAPPLIED: ${a.failure_risk}`);
        attributionMap[tag] = { domain: name, type: 'axiom', id: a.id, index: axiomIndex++ };
      }
    }

    if (patterns.misunderstandings?.length) {
      lines.push(`### Misunderstandings`);
      for (const m of patterns.misunderstandings) {
        const tag = `[${name}:misunderstanding.${m.id}]`;
        lines.push(`- ${tag} WRONG: ${m.wrong}`);
        lines.push(`  CORRECT: ${m.correct}`);
        if (m.failure_risk) lines.push(`  RISK: ${m.failure_risk}`);
        attributionMap[tag] = { domain: name, type: 'misunderstanding', id: m.id, index: misreadingIndex++ };
      }
    }

    if (patterns.terminology?.banned_terms?.length) {
      lines.push(`### Banned terms`);
      for (const t of patterns.terminology.banned_terms) {
        const term = typeof t === 'string' ? t : t.term;
        const tag = `[${name}:banned_term.${term}]`;
        const replace = typeof t === 'object' ? t.replace_with : null;
        lines.push(`- ${tag} "${term}"${replace ? ` → use: ${replace}` : ''}`);
        attributionMap[tag] = { domain: name, type: 'banned_term', term, index: termIndex++ };
      }
    }

    if (patterns.self_check?.length) {
      lines.push(`### Self-checks`);
      for (const q of patterns.self_check) {
        const text = typeof q === 'string' ? q : q.question;
        const tag = `[${name}:self_check.${checkIndex}]`;
        if (text) lines.push(`- ${tag} ${text}`);
        attributionMap[tag] = { domain: name, type: 'self_check', index: checkIndex++ };
      }
    }

    lines.push(separator.trimEnd());
  }

  return { context: lines.join('\n'), attributionMap };
}

/**
 * Classify signals across a cluster of domains. Returns which domains
 * matched and which were excluded. Unlike classifySignals (which just
 * returns indices), this provides full diagnostic info.
 *
 * @param {string} input
 * @param {Array<{id:string, name:string, role:string, core:object}>} domainEntries
 * @returns {{selected: Array, excluded: Array}}
 */
function classifySignalsAcrossDomains(input, domainEntries) {
  if (!input || !domainEntries?.length) return { selected: [], excluded: [] };

  const lower = input.toLowerCase();
  const selected = [];
  const excluded = [];

  for (const entry of domainEntries) {
    const signals = entry.core?.trigger_signals || [];
    const negativeSignals = entry.core?.negative_signals || [];
    const doesNotApply = [];
    for (const a of entry.core?.axioms || []) {
      if (Array.isArray(a.does_not_apply_when)) doesNotApply.push(...a.does_not_apply_when);
    }

    // Check negative signals
    const blocked = negativeSignals.some((s) => lower.includes(s.toLowerCase())) ||
      doesNotApply.some((s) => lower.includes(s.toLowerCase()));

    if (blocked) {
      excluded.push({ id: entry.id, name: entry.name, reason: 'blocked by does_not_apply_when', role: entry.role });
      continue;
    }

    // No signals defined → required domain (always active)
    if (!signals.length) {
      selected.push({ id: entry.id, name: entry.name, role: entry.role, reason: 'required' });
      continue;
    }

    // Check positive signals
    const matched = signals.some((s) => lower.includes(s.toLowerCase()));
    if (matched) {
      selected.push({ id: entry.id, name: entry.name, role: entry.role, reason: 'signal_match' });
    } else {
      excluded.push({ id: entry.id, name: entry.name, reason: 'no signal match', role: entry.role });
    }
  }

  return { selected, excluded };
}

/**
 * Load a cluster from its manifest.
 *
 * @param {string} clusterManifestPath — path to kdna.cluster.json
 * @param {function} domainLoader — fn(domainId) → {core, patterns} or null
 * @returns {{manifest:object, domains:Array, errors:Array}}
 */
function loadCluster(clusterManifestPath, domainLoader) {
  const fs = require('fs');
  const manifest = JSON.parse(fs.readFileSync(clusterManifestPath, 'utf8'));
  const domains = [];
  const errors = [];

  if (!manifest.domains || !Array.isArray(manifest.domains)) {
    return { manifest, domains, errors: ['No domains defined in cluster manifest'] };
  }

  for (const entry of manifest.domains) {
    try {
      const loaded = domainLoader(entry.id);
      if (loaded) {
        domains.push({ id: entry.id, name: loaded.core?.meta?.domain || entry.id, role: entry.role || 'advisor', required: entry.required !== false, core: loaded.core, patterns: loaded.patterns });
      } else {
        errors.push(`Domain ${entry.id}: not found or failed to load`);
      }
    } catch (e) {
      errors.push(`Domain ${entry.id}: ${e.message}`);
    }
  }

  return { manifest, domains, errors };
}

/**
 * Detect conflicts between loaded domains in a cluster.
 *
 * @param {Array<{id:string, core:object, patterns:object}>} domains
 * @returns {Array<{type:string, domains:string[], description:string}>}
 */
function detectDomainConflicts(domains) {
  if (!domains || domains.length < 2) return [];

  const conflicts = [];
  const bannedTermMap = new Map();

  // Check banned term conflicts — same term banned by one, preferred by another
  for (const d of domains) {
    const terms = d.patterns?.terminology?.banned_terms || [];
    for (const t of terms) {
      const term = typeof t === 'string' ? t : t.term;
      if (bannedTermMap.has(term)) {
        conflicts.push({
          type: 'term_conflict',
          domains: [bannedTermMap.get(term), d.id],
          description: `Banned term "${term}" appears in multiple domains`,
        });
      }
      bannedTermMap.set(term, d.id);
    }
  }

  // Check stance conflicts — contradictory stances
  for (let i = 0; i < domains.length; i++) {
    for (let j = i + 1; j < domains.length; j++) {
      const sA = (domains[i].core?.stances || []).map((s) => (typeof s === 'string' ? s : s.stance));
      const sB = (domains[j].core?.stances || []).map((s) => (typeof s === 'string' ? s : s.stance));
      for (const sa of sA) {
        for (const sb of sB) {
          // Simple negation check — can be extended
if (sa && sb && (/\bnot\b/.test(sa) && sb.toLowerCase().includes(sa.toLowerCase().replace('not ', ''))) ||
    (/\bnot\b/.test(sb) && sa.toLowerCase().includes(sb.toLowerCase().replace('not ', '')))) {
            conflicts.push({
              type: 'stance_conflict',
              domains: [domains[i].id, domains[j].id],
              description: `Potential stance conflict: "${sa.slice(0, 60)}" vs "${sb.slice(0, 60)}"`,
            });
          }
        }
      }
    }
  }

  return conflicts;
}

/**
 * Generate a judgment trace for a cluster operation.
 *
 * @param {object} params
 * @param {string} params.input — the original user input
 * @param {Array} params.loadedDomains — all domains in the cluster
 * @param {Array} params.activeDomains — domains that were activated
 * @param {Array} params.conflicts — detected conflicts
 * @returns {object}
 */
function generateClusterTrace({ input, loadedDomains, activeDomains, conflicts }) {
  return {
    input: (input || '').slice(0, 200),
    timestamp: new Date().toISOString(),
    loaded_domains: (loadedDomains || []).map((d) => d.id || d.name || '?'),
    active_domains: (activeDomains || []).map((d) => d.id || d.name || '?'),
    active_count: (activeDomains || []).length,
    domains_excluded: (loadedDomains || []).length - (activeDomains || []).length,
    conflicts: (conflicts || []).map((c) => ({
      type: c.type,
      domains: c.domains,
      description: c.description,
    })),
  };
}

module.exports = {
  composeContext,
  composeContextWithAttribution,
  classifySignals,
  classifySignalsAcrossDomains,
  composeChecks,
  loadAndCompose,
  loadCluster,
  detectDomainConflicts,
  generateClusterTrace,
};
