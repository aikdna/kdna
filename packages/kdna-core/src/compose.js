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

module.exports = { composeContext, classifySignals, composeChecks, loadAndCompose };
