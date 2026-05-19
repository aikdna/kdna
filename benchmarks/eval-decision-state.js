/**
 * Decision State Benchmark Eval Runner
 * Generates no-KDNA / with-KDNA model outputs for comparison.
 *
 * Usage:
 *   node eval-decision-state.js [--model claude-sonnet-4-6] [--limit 5] [--kdna]
 *
 * Outputs:
 *   - raw/ directory with timestamped JSONL files
 *   - summary report with scores
 */

const fs = require('fs');
const path = require('path');
const { loadDomain, formatContext } = require('../src/loader');

const BENCHMARK_PATH = path.join(__dirname, 'decision-state-benchmark.json');
const RAW_DIR = path.join(__dirname, 'raw');
const DOMAIN_DIR = path.join(__dirname, '..', 'examples', 'decision_state');

// Load benchmark
const benchmark = JSON.parse(fs.readFileSync(BENCHMARK_PATH, 'utf8'));

// Load KDNA domain (for with-KDNA runs)
const domain = loadDomain(DOMAIN_DIR, { mode: 'all' });
const kdnaContext = formatContext(domain);

function buildPromptNoKDNA(scenario) {
  return `You are analyzing a meeting or discussion transcript to determine whether it produced an actionable decision.

Read the following scenario carefully:

---
${scenario.input}
---

Classify the decision state of this meeting into ONE of these four categories:
- UNRESOLVED: Missing choice, owner, action, or timing. Discussion without commitment.
- CONDITIONAL: All four elements present but gated by an external condition.
- INTENTIONAL_DEFERRAL: Explicit, structured decision to decide later with conditions and checkpoint.
- EXECUTABLE_DECISION: All four elements present, no blockers, owner has authority to begin immediately.

Respond in this exact format:
STATE: <one of the four states>
MISSING: <list any missing elements, or "none">
REASONING: <one sentence explaining your classification>
`;
}

function buildPromptWithKDNA(scenario, context) {
  return `${context}

---

TASK: Analyze the following meeting transcript and classify its decision state.

SCENARIO:
${scenario.input}

Apply the Decision State Detection framework from the loaded domain cognition. Check for:
1. Specific choice among alternatives
2. Named owner with accepted accountability
3. Concrete next action (not just discussion)
4. Deadline or checkpoint
5. External conditions or blockers
6. Whether deferral language has specific condition, date, and decision owner

Classify into ONE of these four states:
- UNRESOLVED
- CONDITIONAL
- INTENTIONAL_DEFERRAL
- EXECUTABLE_DECISION

Respond in this exact format:
STATE: <state>
MISSING: <missing elements or "none">
REASONING: <one sentence>
TRIGGERED: <which domain axioms or frameworks you used>
`;
}

async function callClaude(prompt, model = 'claude-sonnet-4-6') {
  // Support both standard Anthropic API and kimi-coding environment
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN;
  const baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
  const apiVersion = process.env.ANTHROPIC_BASE_URL ? '2023-06-01' : '2023-06-01';

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN not set');
  }

  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': apiVersion,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

function parseResponse(text) {
  const lines = text.split('\n');
  const result = { raw: text };
  for (const line of lines) {
    if (line.startsWith('STATE:')) result.state = line.replace('STATE:', '').trim();
    if (line.startsWith('MISSING:')) result.missing = line.replace('MISSING:', '').trim();
    if (line.startsWith('REASONING:')) result.reasoning = line.replace('REASONING:', '').trim();
    if (line.startsWith('TRIGGERED:')) result.triggered = line.replace('TRIGGERED:', '').trim();
  }
  return result;
}

function scoreResult(scenario, parsed) {
  const stateCorrect = parsed.state === scenario.expected_state;
  let missingCorrect = true;
  if (scenario.expected_state === 'UNRESOLVED' && scenario.missing_elements.length > 0) {
    const expected = scenario.missing_elements.sort().join(',');
    const actual = (parsed.missing || 'none').split(/[,;]/).map(s => s.trim()).filter(Boolean).sort().join(',');
    missingCorrect = expected === actual;
  }
  return {
    state_correct: stateCorrect,
    missing_correct: missingCorrect,
    score: stateCorrect && missingCorrect ? 1 : 0,
  };
}

async function runBenchmark(options = {}) {
  const { model = 'claude-sonnet-4-6', limit = Infinity, useKDNA = false } = options;
  const scenarios = benchmark.scenarios.slice(0, limit);
  const results = [];

  console.log(`Running ${scenarios.length} scenarios with ${useKDNA ? 'KDNA' : 'no-KDNA'} (${model})...`);

  for (let i = 0; i < scenarios.length; i++) {
    const s = scenarios[i];
    const prompt = useKDNA ? buildPromptWithKDNA(s, kdnaContext) : buildPromptNoKDNA(s);

    try {
      const raw = await callClaude(prompt, model);
      const parsed = parseResponse(raw);
      const scoring = scoreResult(s, parsed);
      results.push({
        scenario_id: s.id,
        expected: s.expected_state,
        predicted: parsed.state,
        missing_expected: s.missing_elements,
        missing_predicted: parsed.missing,
        reasoning: parsed.reasoning,
        triggered: parsed.triggered,
        score: scoring.score,
        state_correct: scoring.state_correct,
        missing_correct: scoring.missing_correct,
        raw_output: raw,
      });
      console.log(`  [${i + 1}/${scenarios.length}] ${s.id}: expected=${s.expected_state} predicted=${parsed.state} score=${scoring.score}`);
    } catch (err) {
      console.error(`  [${i + 1}/${scenarios.length}] ${s.id}: ERROR - ${err.message}`);
      results.push({
        scenario_id: s.id,
        error: err.message,
      });
    }
  }

  // Save raw outputs
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const mode = useKDNA ? 'with-kdna' : 'no-kdna';
  const filename = `decision-state-${mode}-${model}-${timestamp}.jsonl`;
  if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });

  const filepath = path.join(RAW_DIR, filename);
  const stream = fs.createWriteStream(filepath);
  for (const r of results) {
    stream.write(JSON.stringify(r) + '\n');
  }
  stream.end();

  // Summary
  const valid = results.filter(r => !r.error);
  const totalScore = valid.reduce((sum, r) => sum + r.score, 0);
  const maxScore = valid.length;
  const stateCorrect = valid.filter(r => r.state_correct).length;

  const summary = {
    timestamp: new Date().toISOString(),
    model,
    mode: useKDNA ? 'with-kdna' : 'no-kdna',
    total_scenarios: scenarios.length,
    successful_runs: valid.length,
    failed_runs: results.length - valid.length,
    total_score: totalScore,
    max_possible: maxScore,
    accuracy_pct: maxScore > 0 ? ((totalScore / maxScore) * 100).toFixed(1) : 0,
    state_accuracy_pct: maxScore > 0 ? ((stateCorrect / maxScore) * 100).toFixed(1) : 0,
    raw_file: filepath,
  };

  const summaryPath = path.join(RAW_DIR, `summary-${mode}-${timestamp}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  console.log('\n--- Summary ---');
  console.log(`Mode: ${summary.mode}`);
  console.log(`Model: ${summary.model}`);
  console.log(`Scenarios: ${summary.total_scenarios}`);
  console.log(`Score: ${summary.total_score}/${summary.max_possible} (${summary.accuracy_pct}%)`);
  console.log(`State accuracy: ${summary.state_accuracy_pct}%`);
  console.log(`Raw saved: ${filepath}`);

  return summary;
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const model = args.find(a => a.startsWith('--model='))?.split('=')[1] || 'claude-sonnet-4-6';
  const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '30');
  const useKDNA = args.includes('--kdna');

  await runBenchmark({ model, limit, useKDNA });
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runBenchmark, buildPromptNoKDNA, buildPromptWithKDNA, scoreResult };
