/**
 * kdna compare <name> --input "<text>" — Reasoning trajectory diff.
 *
 * Runs the same prompt twice on a real LLM:
 *   1. Without KDNA loaded (baseline)
 *   2. With KDNA injected into the system prompt (treatment)
 * Then asks a third call to diff the two responses along the
 * judgment-trajectory axes the domain claims to change.
 *
 * Config file: ~/.kdna/config.json
 *   {
 *     "llm": {
 *       "provider": "anthropic" | "openai",
 *       "model": "<model-id>",
 *       "api_key_env": "ANTHROPIC_API_KEY"
 *     }
 *   }
 *
 * MVP scope: no caching, no batch, no offline mode. One invocation = 3 API calls.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const USER_KDNA_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.kdna');
const INSTALL_DIR = path.join(USER_KDNA_DIR, 'domains');
const CONFIG_FILE = path.join(USER_KDNA_DIR, 'config.json');

const { parseName } = require('./registry');

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function error(msg) {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

// ─── Config ─────────────────────────────────────────────────────────────

function loadLlmConfig() {
  const cfg = readJson(CONFIG_FILE) || {};
  const llm = cfg.llm || {};
  const provider = llm.provider || 'anthropic';
  const model = llm.model || (provider === 'anthropic' ? 'claude-sonnet-4-5' : 'gpt-4o-mini');
  const envName =
    llm.api_key_env || (provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY');
  const apiKey = process.env[envName] || llm.api_key || null;

  // base_url lets users point the "openai" provider at any OpenAI-compatible
  // endpoint (SiliconFlow, Groq, OpenRouter, local llama.cpp, etc.).
  // Default: official endpoints for each provider.
  const defaultBase =
    provider === 'anthropic' ? 'https://api.anthropic.com' : 'https://api.openai.com';
  const baseUrl = llm.base_url || defaultBase;

  if (!apiKey) {
    error(
      `LLM API key not found. Set ${envName} in your environment, or edit ~/.kdna/config.json:\n` +
        `  {\n` +
        `    "llm": {\n` +
        `      "provider": "anthropic" | "openai",\n` +
        `      "model": "<model-id>",\n` +
        `      "api_key_env": "${envName}",\n` +
        `      "base_url": "https://...   (optional, for OpenAI-compatible endpoints)"\n` +
        `    }\n` +
        `  }`,
    );
  }
  return { provider, model, apiKey, envName, baseUrl };
}

// Parse "https://host[:port]/path/prefix" → { host, port, basePath }
function parseBaseUrl(url) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: u.port ? parseInt(u.port, 10) : 443,
    basePath: u.pathname.replace(/\/$/, ''), // strip trailing slash
  };
}

// ─── HTTP helpers ──────────────────────────────────────────────────────

function httpsPost(host, port, pathPart, headers, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(
      {
        host,
        port: port || 443,
        path: pathPart,
        method: 'POST',
        headers: { ...headers, 'Content-Length': Buffer.byteLength(data) },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${text.slice(0, 500)}`));
            return;
          }
          try {
            resolve(JSON.parse(text));
          } catch {
            reject(new Error(`Bad JSON from ${host}: ${text.slice(0, 500)}`));
          }
        });
      },
    );
    req.on('error', reject);
    req.setTimeout(120000, () => req.destroy(new Error(`timeout after 120s`)));
    req.write(data);
    req.end();
  });
}

async function callLlm(cfg, systemPrompt, userMessage) {
  const { host, port, basePath } = parseBaseUrl(cfg.baseUrl);

  if (cfg.provider === 'anthropic') {
    const resp = await httpsPost(
      host,
      port,
      `${basePath}/v1/messages`,
      {
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': cfg.apiKey,
      },
      {
        model: cfg.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      },
    );
    return resp.content?.map((c) => c.text || '').join('') || '';
  }
  if (cfg.provider === 'openai') {
    // For OpenAI-compatible endpoints the base may already include /v1 (e.g.
    // SiliconFlow: https://api.siliconflow.cn/v1). Append /chat/completions
    // if the basePath doesn't already end with /v1.
    const endpoint = basePath.endsWith('/v1')
      ? `${basePath}/chat/completions`
      : `${basePath}/v1/chat/completions`;
    const resp = await httpsPost(
      host,
      port,
      endpoint,
      {
        'content-type': 'application/json',
        authorization: `Bearer ${cfg.apiKey}`,
      },
      {
        model: cfg.model,
        max_tokens: 4096,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      },
    );
    return resp.choices?.[0]?.message?.content || '';
  }
  error(`Unknown provider: ${cfg.provider}`);
}

// ─── KDNA → system prompt ─────────────────────────────────────────────

function buildKdnaPrompt(destDir) {
  const core = readJson(path.join(destDir, 'KDNA_Core.json'));
  const pat = readJson(path.join(destDir, 'KDNA_Patterns.json'));
  const manifest = readJson(path.join(destDir, 'kdna.json'));

  if (!core || !pat) return '';

  const sections = [];
  sections.push(`# Domain judgment loaded: ${manifest?.name || core?.meta?.domain}`);
  sections.push(`# ${core?.meta?.purpose || ''}`);
  sections.push('');

  if (core.axioms) {
    sections.push('## Axioms (judgment principles)');
    for (const a of core.axioms) {
      sections.push(`- **${a.one_sentence}** ${a.full_statement}`);
      if (a.applies_when?.length) sections.push(`  - APPLIES WHEN: ${a.applies_when.join('; ')}`);
      if (a.does_not_apply_when?.length)
        sections.push(`  - DOES NOT APPLY WHEN: ${a.does_not_apply_when.join('; ')}`);
      if (a.failure_risk) sections.push(`  - FAILURE RISK: ${a.failure_risk}`);
    }
    sections.push('');
  }

  if (pat.misunderstandings) {
    sections.push('## Common misdiagnoses to avoid');
    for (const m of pat.misunderstandings) {
      sections.push(`- WRONG: ${m.wrong}`);
      sections.push(`  CORRECT: ${m.correct}`);
      if (m.key_distinction) sections.push(`  KEY DISTINCTION: ${m.key_distinction}`);
    }
    sections.push('');
  }

  if (pat.self_check?.length) {
    sections.push('## Self-checks before answering');
    pat.self_check.forEach((q, i) => sections.push(`${i + 1}. ${q}`));
    sections.push('');
  }

  if (core.stances) {
    sections.push('## Stances');
    for (const s of core.stances) {
      const txt = typeof s === 'string' ? s : s.stance;
      if (txt) sections.push(`- ${txt}`);
    }
  }

  return sections.join('\n');
}

// ─── Diff prompt ───────────────────────────────────────────────────────

const DIFF_SYSTEM = `You are comparing two AI responses to the same user request. Your job is NOT to judge which is better, but to surface the difference in REASONING TRAJECTORY along these axes:

1. CLASSIFICATION — how each response classifies the task
2. DIAGNOSIS — root cause each response names (surface vs structural)
3. ACTIONS — what each response actually suggests doing
4. BOUNDARY AWARENESS — does either response recognize when something is outside its scope
5. TERMINOLOGY — domain-specific terms one uses but the other doesn't

For each axis, output:
  <axis>: <one-line difference> | SAME if no meaningful difference

End with a single line:
  VERDICT: <one of: trajectory_changed | trajectory_unchanged | trajectory_degraded>

Be terse. Quote at most 8 words from each response.`;

function makeDiffPrompt(input, responseA, responseB) {
  return `INPUT (same for both):
${input}

RESPONSE A (no KDNA loaded):
${responseA}

RESPONSE B (KDNA loaded):
${responseB}

Diff the reasoning trajectory.`;
}

// ─── Main ──────────────────────────────────────────────────────────────

async function cmdCompare(input, args = []) {
  const idxInput = args.indexOf('--input');
  if (idxInput < 0 || !args[idxInput + 1]) {
    error('Usage: kdna compare <name> --input "<text>"');
  }
  const userInput = args[idxInput + 1];

  const parsed = parseName(input);
  if (!parsed) error(`Invalid name "${input}".`);
  const destDir = path.join(INSTALL_DIR, parsed.scope, parsed.ident);
  if (!fs.existsSync(destDir)) {
    error(`${parsed.full} not installed. Run: kdna install ${input}`);
  }

  const llm = loadLlmConfig();

  console.log('═'.repeat(64));
  console.log(`  kdna compare  ${parsed.full}`);
  console.log(`  provider:     ${llm.provider} / ${llm.model}`);
  console.log(`  input length: ${userInput.length} chars`);
  console.log('═'.repeat(64));
  console.log('');

  const BASELINE_SYSTEM =
    'You are a helpful assistant. Respond to the user request concisely and specifically.';
  const kdnaPrompt = buildKdnaPrompt(destDir);
  if (!kdnaPrompt) error('Could not build KDNA prompt — missing KDNA_Core or KDNA_Patterns.');
  const TREATMENT_SYSTEM =
    'You are a helpful assistant. The following domain judgment is loaded and you MUST apply it when relevant.\n\n' +
    kdnaPrompt;

  console.log('[1/3] Running baseline (no KDNA)...');
  const responseA = await callLlm(llm, BASELINE_SYSTEM, userInput);
  console.log(`      ${responseA.length} chars returned`);

  console.log('[2/3] Running with KDNA loaded...');
  const responseB = await callLlm(llm, TREATMENT_SYSTEM, userInput);
  console.log(`      ${responseB.length} chars returned`);

  console.log('[3/3] Diffing reasoning trajectories...');
  const diffPrompt = makeDiffPrompt(userInput, responseA, responseB);
  const diff = await callLlm(llm, DIFF_SYSTEM, diffPrompt);

  console.log('');
  console.log('─'.repeat(64));
  console.log('  WITHOUT KDNA');
  console.log('─'.repeat(64));
  console.log(responseA);
  console.log('');
  console.log('─'.repeat(64));
  console.log('  WITH KDNA');
  console.log('─'.repeat(64));
  console.log(responseB);
  console.log('');
  console.log('─'.repeat(64));
  console.log('  REASONING TRAJECTORY DIFF');
  console.log('─'.repeat(64));
  console.log(diff);
  console.log('');
}

module.exports = { cmdCompare, buildKdnaPrompt };
