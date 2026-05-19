/**
 * kdna publish --check <path> — Quality gate for domain publication.
 *
 * Checks beyond structural validity: anti-vagueness, content completeness,
 * and registry readiness.
 */

const fs = require('fs');
const path = require('path');

function error(msg) {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

// ─── Anti-vagueness checks ────────────────────────────────────────────

const VAGUE_PHRASES = [
  'is important',
  'is key',
  'matters',
  'is crucial',
  'is essential',
  'is critical',
  'be helpful',
  'be user-centered',
  'be customer-focused',
  'communicate effectively',
  'think strategically',
  'is vital',
  'plays a role',
  'is fundamental',
];

const SLOGAN_PATTERNS = [
  /^[A-Z][a-z]+ is [a-z]+\.?$/,      // "Trust is important."
  /^Be [a-z]+\.?$/,                    // "Be helpful."
  /^[A-Z][a-z]+ matters\.?$/,         // "Quality matters."
];

function isVague(text) {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  for (const phrase of VAGUE_PHRASES) {
    if (lower.includes(phrase)) return { phrase, text };
  }
  return false;
}

function isSlogan(text) {
  if (!text || typeof text !== 'string') return false;
  for (const pattern of SLOGAN_PATTERNS) {
    if (pattern.test(text.trim())) return true;
  }
  return false;
}

function isNegationOnly(boundary) {
  if (!boundary || typeof boundary !== 'string') return false;
  const trimmed = boundary.toLowerCase().trim();
  return /^not\s/.test(trimmed) && trimmed.split(/\s+/).length <= 3;
}

function isDictionaryDefinition(essence) {
  if (!essence || typeof essence !== 'string') return false;
  // Dictionary-style: starts with "the", follows with "is" or "of"
  return /^the\s+(quality|state|act|process|ability|condition|fact|practice|use)\s+(of|in|to|that)/i.test(essence);
}

function isStrawMan(wrong) {
  if (!wrong || typeof wrong !== 'string') return false;
  const lower = wrong.toLowerCase();
  const strawPatterns = [
    /doesn['']t matter/,
    /isn['']t important/,
    /is useless/,
    /never works/,
    /is a waste/,
    /should never/,
  ];
  for (const p of strawPatterns) {
    if (p.test(lower)) return true;
  }
  return false;
}

function isGenericSelfCheck(question) {
  if (!question || typeof question !== 'string') return false;
  const lower = question.toLowerCase();
  const generic = [
    'is this helpful',
    'is this response good',
    'is this clear',
    'did i do a good job',
    'is this useful',
    'is this correct',
    'is this accurate',
    'did i follow best practices',
  ];
  for (const g of generic) {
    if (lower.includes(g)) return true;
  }
  return false;
}

// ─── Main check function ──────────────────────────────────────────────

function cmdPublishCheck(domainPath) {
  const abs = path.resolve(domainPath);
  if (!fs.existsSync(abs)) error(`Domain not found: ${abs}`);

  console.log('═'.repeat(60));
  console.log(`  Publish Check: ${path.basename(abs)}`);
  console.log('═'.repeat(60));
  console.log('');

  let errors = 0;
  let warnings = 0;
  let passes = 0;

  function fail(file, field, item, reason) {
    console.error(`  ✗ ${file} > ${field}: ${reason}`);
    if (item) console.error(`    "${item.slice(0, 100)}${item.length > 100 ? '...' : ''}"`);
    errors++;
  }

  function warn(file, field, msg) {
    console.warn(`  ⚠ ${file} > ${field}: ${msg}`);
    warnings++;
  }

  function pass(file, field) {
    console.log(`  ✓ ${file} > ${field}`);
    passes++;
  }

  // Load Core
  const core = readJson(path.join(abs, 'KDNA_Core.json'));
  if (!core) error('KDNA_Core.json not found or invalid JSON');

  // Check axioms
  if (core.axioms && Array.isArray(core.axioms)) {
    for (const ax of core.axioms) {
      const label = ax.id || '?';

      if (!ax.one_sentence || ax.one_sentence.length < 20) {
        fail('KDNA_Core.json', `axioms.${label}.one_sentence`, ax.one_sentence, 'Too short (min 20 chars). Axioms must be specific claims, not labels.');
      } else if (isSlogan(ax.one_sentence)) {
        fail('KDNA_Core.json', `axioms.${label}.one_sentence`, ax.one_sentence, 'Reads like a slogan. Axioms must be specific judgment principles.');
      } else if (isVague(ax.one_sentence)) {
        const v = isVague(ax.one_sentence);
        fail('KDNA_Core.json', `axioms.${label}.one_sentence`, ax.one_sentence, `Vague phrase "${v.phrase}". Be specific about what the agent should judge.`);
      } else {
        pass('KDNA_Core.json', `axioms.${label}.one_sentence`);
      }

      if (!ax.full_statement || ax.full_statement.length < 40) {
        fail('KDNA_Core.json', `axioms.${label}.full_statement`, ax.full_statement, 'Too short (min 40 chars). Full statement must be testable and domain-specific.');
      } else if (isVague(ax.full_statement)) {
        warn('KDNA_Core.json', `axioms.${label}.full_statement`, 'Contains vague language. Consider making it more operational.');
      } else {
        pass('KDNA_Core.json', `axioms.${label}.full_statement`);
      }

      if (!ax.why || ax.why.length < 20) {
        fail('KDNA_Core.json', `axioms.${label}.why`, ax.why, 'Too short. Must explain what the agent would get wrong without this axiom.');
      } else {
        pass('KDNA_Core.json', `axioms.${label}.why`);
      }
    }
  }

  // Check ontology
  if (core.ontology && Array.isArray(core.ontology)) {
    for (const con of core.ontology) {
      const label = con.id || '?';

      if (!con.essence || isDictionaryDefinition(con.essence)) {
        fail('KDNA_Core.json', `ontology.${label}.essence`, con.essence,
          'Reads like a dictionary definition. Essence must be operational — what the agent needs to check, not what a dictionary says.');
      } else if (isVague(con.essence)) {
        warn('KDNA_Core.json', `ontology.${label}.essence`, 'Contains vague language.');
      } else {
        pass('KDNA_Core.json', `ontology.${label}.essence`);
      }

      if (!con.boundary || isNegationOnly(con.boundary)) {
        fail('KDNA_Core.json', `ontology.${label}.boundary`, con.boundary,
          'Negation-only boundary. Must name a specific concept this is often confused with, not just "not X".');
      } else {
        pass('KDNA_Core.json', `ontology.${label}.boundary`);
      }

      if (!con.trigger_signal || con.trigger_signal.length < 15) {
        warn('KDNA_Core.json', `ontology.${label}.trigger_signal`, 'Trigger signal too short. Should be observable words or patterns the agent can detect.');
      } else {
        pass('KDNA_Core.json', `ontology.${label}.trigger_signal`);
      }
    }
  }

  // Check stances
  if (core.stances && Array.isArray(core.stances)) {
    if (core.stances.length < 2) {
      warn('KDNA_Core.json', 'stances', `Only ${core.stances.length} stance(s). Recommended: 2-5.`);
    }
    for (let i = 0; i < core.stances.length; i++) {
      const s = core.stances[i];
      if (typeof s !== 'string') {
        fail('KDNA_Core.json', `stances[${i}]`, JSON.stringify(s), 'Must be a string, not an object.');
      } else if (isSlogan(s)) {
        fail('KDNA_Core.json', `stances[${i}]`, s, 'Reads like a slogan. Stances must be prescriptive positions that bias agent behavior.');
      } else if (isVague(s)) {
        warn('KDNA_Core.json', `stances[${i}]`, 'Contains vague language.');
      } else {
        pass('KDNA_Core.json', `stances[${i}]`);
      }
    }
  }

  // Load Patterns
  const patterns = readJson(path.join(abs, 'KDNA_Patterns.json'));
  if (!patterns) error('KDNA_Patterns.json not found or invalid JSON');

  // Check misunderstandings
  if (patterns.misunderstandings && Array.isArray(patterns.misunderstandings)) {
    for (const ms of patterns.misunderstandings) {
      const label = ms.id || '?';

      if (!ms.wrong || isStrawMan(ms.wrong)) {
        fail('KDNA_Patterns.json', `misunderstandings.${label}.wrong`, ms.wrong,
          'Straw-man argument. Must describe a belief a real agent might actually hold, not an absurd position.');
      } else {
        pass('KDNA_Patterns.json', `misunderstandings.${label}.wrong`);
      }

      if (!ms.key_distinction || ms.key_distinction.length < 15) {
        warn('KDNA_Patterns.json', `misunderstandings.${label}.key_distinction`, 'Key distinction too short. Must name the conceptual boundary.');
      } else {
        pass('KDNA_Patterns.json', `misunderstandings.${label}.key_distinction`);
      }
    }
  }

  // Check self-checks
  if (patterns.self_check && Array.isArray(patterns.self_check)) {
    for (let i = 0; i < patterns.self_check.length; i++) {
      const sc = patterns.self_check[i];
      if (typeof sc !== 'string') {
        fail('KDNA_Patterns.json', `self_check[${i}]`, JSON.stringify(sc), 'Must be a string, not an object.');
      } else if (isGenericSelfCheck(sc)) {
        fail('KDNA_Patterns.json', `self_check[${i}]`, sc, 'Generic question. Self-checks must be domain-specific, not "is this helpful?".');
      } else if (!sc.endsWith('?')) {
        warn('KDNA_Patterns.json', `self_check[${i}]`, 'Should end with a question mark.');
        passes++;
      } else {
        pass('KDNA_Patterns.json', `self_check[${i}]`);
      }
    }
  }

  // Check kdna.json completeness
  const manifest = readJson(path.join(abs, 'kdna.json'));
  if (manifest) {
    const emptyFields = [];
    if (!manifest.description || manifest.description.length < 10) emptyFields.push('description');
    if (!manifest.keywords || manifest.keywords.length === 0) emptyFields.push('keywords');
    if (!manifest.author?.name) emptyFields.push('author.name');
    if (!manifest.author?.id) emptyFields.push('author.id');
    if (!manifest.registry?.repo) emptyFields.push('registry.repo');

    if (emptyFields.length > 0) {
      warn('kdna.json', 'manifest', `Empty fields: ${emptyFields.join(', ')}`);
    } else {
      pass('kdna.json', 'manifest');
    }
  } else {
    warn('kdna.json', 'manifest', 'Not found. A kdna.json manifest is recommended for registry publication.');
  }

  // Summary
  console.log('');
  console.log('═'.repeat(60));
  const total = errors + warnings + passes;
  console.log(`  ${passes} passed, ${warnings} warnings, ${errors} errors out of ${total} checks`);
  if (errors === 0) {
    console.log(`  ✓ Ready to publish`);
  } else {
    console.log(`  ✗ ${errors} issue(s) must be fixed before publishing`);
  }
  console.log('═'.repeat(60));

  if (errors > 0) process.exit(1);
}

module.exports = { cmdPublishCheck };
