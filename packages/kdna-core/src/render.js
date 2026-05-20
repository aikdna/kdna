/**
 * KDNA Render — Pure HTML rendering for KDNA domain preview.
 *
 * No fs, no path, no Node.js dependencies.
 * Takes a loaded domain object and optional manifest, returns HTML string.
 */

/**
 * Escape HTML special characters.
 * @param {string} s
 * @returns {string}
 */
function escHtml(s) {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Render a card section.
 * @param {string} title
 * @param {number|undefined} count
 * @param {string} items — HTML string of card items
 * @returns {string}
 */
function renderCard(title, count, items) {
  if (!count || !items) return '';
  return `<div class="card"><h3>${title} <span>${count}</span></h3>${items}</div>`;
}

/**
 * Render a full KDNA domain as a preview HTML page.
 *
 * @param {object} domain — loaded domain from loadDomainFromData() / loadDomainFromFiles()
 * @param {object} [manifest] — parsed kdna.json manifest
 * @returns {string} complete HTML document
 */
function renderPreviewHTML(domain, manifest) {
  if (!domain || !domain.core) return '<!DOCTYPE html><html><body><p>No domain data</p></body></html>';

  const core = domain.core;
  const patterns = domain.patterns;
  const scenarios = domain.scenarios;
  const cases = domain.cases;
  const reasoning = domain.reasoning;
  const evolution = domain.evolution;

  const name = manifest?.name || core.meta?.domain || 'Unnamed Domain';
  const version = manifest?.version || core.meta?.version || '?';
  const status = manifest?.status || 'experimental';
  const desc = manifest?.description || core.meta?.purpose || '';

  // Count present files
  const fileCount = ['core', 'patterns', 'scenarios', 'cases', 'reasoning', 'evolution']
    .filter((k) => domain[k])
    .length;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${escHtml(name)} — KDNA Preview</title>
<style>
:root{--bg:#08100d;--bg2:#0d1713;--border:#24352b;--text:#f0ead7;--dim:#c3baa0;--muted:#8b836c;--accent:#d1ad63;--green:#76b987;--red:#df806d;--blue:#8fa7d7;--sans:Inter,system-ui,sans-serif;--mono:SF Mono,monospace}
*{box-sizing:border-box;margin:0;padding:0}body{background:var(--bg);color:var(--text);font-family:var(--sans);line-height:1.6;max-width:960px;margin:0 auto;padding:40px 24px}
.meta{display:flex;flex-wrap:wrap;gap:16px;align-items:center;padding:20px 24px;border:1px solid var(--border);border-radius:10px;background:var(--bg2);margin-bottom:24px}
.meta .name{font-size:24px;font-weight:700}
.meta .ver{color:var(--muted);font-size:14px}
.meta .badge{padding:3px 12px;border-radius:999px;font-size:11px;font-weight:700}
.badge-ok{background:rgba(118,185,135,.15);color:var(--green)}
.badge-warn{background:rgba(209,173,99,.15);color:var(--accent)}
.desc{color:var(--dim);margin:16px 0 24px;font-size:15px;line-height:1.7}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:14px}
.card{border:1px solid var(--border);border-radius:10px;background:var(--bg2);padding:20px}
.card h3{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:14px;display:flex;justify-content:space-between}
.card h3 span{color:var(--dim);font-weight:400}
.card .item{padding:10px 0;border-bottom:1px solid rgba(36,53,43,.5)}
.card .item:last-child{border-bottom:0}
.card .item strong{display:block;font-size:14px;margin-bottom:2px}
.card .item .detail{font-size:13px;color:var(--dim);line-height:1.5}
.card .item .meta{font-size:11px;color:var(--muted);margin-top:2px;padding:0;border:0;background:transparent;margin-bottom:0}
.card .item .why{color:var(--red);font-size:12px}
.card .item .replace{color:var(--green);font-size:12px}
.footer{text-align:center;color:var(--muted);margin-top:40px;font-size:13px}
.footer a{color:var(--accent)}
@media(max-width:680px){.cards{grid-template-columns:1fr}}
</style></head><body>
<h1 style="font-size:14px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:16px">KDNA Domain Preview</h1>
<div class="meta">
  <span class="name">${escHtml(name)}</span>
  <span class="ver">v${escHtml(version)}</span>
  <span class="badge badge-${status === 'validated' || status === 'stable' ? 'ok' : 'warn'}">${escHtml(status)}</span>
  <span style="color:var(--dim);font-size:13px">${fileCount} files</span>
</div>
${desc ? `<p class="desc">${escHtml(desc)}</p>` : ''}
<div class="cards">
${renderCard('Axioms', core.axioms?.length, (core.axioms || []).map((a) => `<div class="item"><strong>${escHtml(a.one_sentence || '')}</strong><div class="detail">${escHtml(a.full_statement || a.why || '')}</div></div>`).join(''))}
${renderCard('Concepts', core.ontology?.length, (core.ontology || []).map((o) => `<div class="item"><strong>${escHtml(o.one_sentence || o.id || '')}</strong><div class="detail">${escHtml(o.essence || '')}</div><div class="meta">Boundary: ${escHtml(o.boundary || '')}</div></div>`).join(''))}
${renderCard('Frameworks', core.frameworks?.length, (core.frameworks || []).map((f) => `<div class="item"><strong>${escHtml(f.name || '')}</strong><div class="detail">When: ${escHtml(f.when_to_use || '')}</div><div class="detail">Steps: ${(f.steps || []).map((s) => escHtml(s)).join(' → ')}</div></div>`).join(''))}
${renderCard('Stances', core.stances?.length, (core.stances || []).map((s) => `<div class="item"><strong>${escHtml(typeof s === 'string' ? s : s.one_sentence || '')}</strong></div>`).join(''))}
${renderCard('Banned Terms', patterns?.terminology?.banned_terms?.length, (patterns?.terminology?.banned_terms || []).map((bt) => `<div class="item"><strong>${escHtml(bt.term)} <span class="replace">→ ${escHtml(bt.replace_with || '')}</span></strong><div class="why">${escHtml(bt.why || '')}</div></div>`).join(''))}
${renderCard('Misunderstandings', patterns?.misunderstandings?.length, (patterns?.misunderstandings || []).map((mu) => `<div class="item"><strong>Wrong: ${escHtml(mu.wrong || '')}</strong><div class="detail">Correct: ${escHtml(mu.correct || '')}</div><div class="meta">${escHtml(mu.key_distinction || '')}</div></div>`).join(''))}
${renderCard('Self-Checks', patterns?.self_check?.length, (patterns?.self_check || []).map((sc) => `<div class="item"><strong>✓ ${escHtml(typeof sc === 'string' ? sc : sc.one_sentence || '')}</strong></div>`).join(''))}
${scenarios ? renderCard('Scenarios', scenarios.scenes?.length || 0, (scenarios.scenes || []).map((s) => `<div class="item"><strong>${escHtml(s.name || s.id || '')}</strong><div class="detail">${escHtml(s.trigger_signal || '')}</div></div>`).join('')) : ''}
${cases ? renderCard('Cases', cases.cases?.length || 0, (cases.cases || []).map((c) => `<div class="item"><strong>${escHtml(c.title || c.id || '')}</strong><div class="detail">${escHtml((c.what_was_learned || '').substring(0, 150))}</div></div>`).join('')) : ''}
${reasoning ? renderCard('Reasoning', reasoning.reasoning_chains?.length || 0, (reasoning.reasoning_chains || []).map((r) => `<div class="item"><strong>${escHtml(r.one_sentence || r.id || '')}</strong><div class="detail">${escHtml(r.so_what || '')}</div></div>`).join('')) : ''}
${evolution ? renderCard('Evolution', evolution.stages?.length || 0, (evolution.stages || []).map((s) => `<div class="item"><strong>${escHtml(s.name || s.id || '')}</strong><div class="detail">${escHtml(s.description || '')}</div></div>`).join('')) : ''}
</div>
<div class="footer">Generated: ${new Date().toISOString().slice(0, 10)} · <a href="https://aikdna.com">aikdna.com</a></div>
</body></html>`;
}

module.exports = { renderPreviewHTML, escHtml, renderCard };
