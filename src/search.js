/**
 * kdna search <keyword> — Search registry by keyword.
 *
 * Matches against: name, description, core_insight, keywords[],
 * domain_field, judgment_patterns. Case-insensitive substring search.
 */

const { RegistryResolver } = require('./registry');

function matchScore(d, q) {
  const ql = q.toLowerCase();
  let score = 0;

  // Higher weight for stronger signals
  if ((d.name || '').toLowerCase().includes(ql)) score += 10;
  if ((d.id || '').toLowerCase().includes(ql)) score += 8;
  if ((d.keywords || []).some((k) => (k || '').toLowerCase().includes(ql))) score += 6;
  if ((d.core_insight || '').toLowerCase().includes(ql)) score += 4;
  if ((d.description || '').toLowerCase().includes(ql)) score += 3;
  if ((d.domain_field || []).some((f) => (f || '').toLowerCase().includes(ql))) score += 2;
  if ((d.judgment_patterns || []).some((p) => (p || '').toLowerCase().includes(ql))) score += 2;

  return score;
}

function cmdSearch(query) {
  if (!query) {
    console.error('Usage: kdna search <keyword>');
    console.error('       kdna search "content strategy"');
    process.exit(1);
  }

  const resolver = new RegistryResolver({ allowNetwork: true });
  const domains = resolver.listAllDomains() || [];

  if (!domains.length) {
    console.log('No registry entries found. Run: kdna registry refresh');
    return;
  }

  const matches = domains
    .map((d) => ({ d, score: matchScore(d, query) }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!matches.length) {
    console.log(`No domains match "${query}".`);
    console.log('');
    console.log('Try:');
    console.log('  kdna list --available     # show everything');
    return;
  }

  console.log(`Found ${matches.length} matching domain(s) for "${query}":`);
  console.log('');

  for (const { d, score } of matches) {
    const yanked = d.yanked ? ' [yanked]' : '';
    const dep = d.deprecated ? ' [deprecated]' : '';
    console.log(
      `  ${(d.name || d.id || '?').padEnd(36)} v${d.version || '?'}  ${(d.type || 'domain').padEnd(8)}  score:${score}${yanked}${dep}`,
    );
    if (d.description) console.log(`    ${d.description}`);
    if (d.core_insight) console.log(`    » ${d.core_insight}`);
    console.log('');
  }

  console.log(
    `To install: kdna install <name>     # e.g. kdna install ${matches[0].d.name || matches[0].d.id}`,
  );
}

module.exports = { cmdSearch };
