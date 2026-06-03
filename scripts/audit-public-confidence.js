#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const openSourceRoot = path.resolve(repoRoot, '..');
const allowBlockers = process.argv.includes('--allow-blockers');

const referenceDomains = [
  {
    name: '@aikdna/writing',
    repo: path.join(openSourceRoot, 'kdna-writing'),
  },
  {
    name: '@aikdna/prompt_diagnosis',
    repo: path.join(openSourceRoot, 'kdna-prompt_diagnosis'),
  },
  {
    name: '@aikdna/agent_safety',
    repo: path.join(openSourceRoot, 'kdna-agent_safety'),
  },
];

const checks = [];
const blockers = [];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function countEvalCases(domainRepo) {
  const evalDir = path.join(domainRepo, 'evals');
  if (!exists(evalDir)) return 0;
  return fs.readdirSync(evalDir).filter((file) => /^eval-\d+\.json$/.test(file)).length;
}

function collectRawOutputFiles(domainRepo) {
  const rawDirs = [
    path.join(domainRepo, 'benchmarks', 'raw'),
    path.join(domainRepo, 'evals', 'raw'),
  ];
  const files = [];
  for (const dir of rawDirs) {
    if (!exists(dir)) continue;
    for (const file of fs.readdirSync(dir, { recursive: true })) {
      if (typeof file === 'string' && /\.(json|jsonl)$/i.test(file)) {
        files.push(path.join(dir, file));
      }
    }
  }
  return files;
}

function hasString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasScoreObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function caseHasOutputAndScores(item) {
  return hasString(item?.case_id) && hasString(item?.output) && hasScoreObject(item?.scores);
}

function jsonRunIsValid(payload, domainName, evalCount) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  if (payload.domain !== domainName) return false;
  if (!hasString(payload.run_id) || !hasString(payload.provider) || !hasString(payload.model)) {
    return false;
  }
  if (!Number.isInteger(payload.case_count) || payload.case_count < evalCount) return false;
  if (!Array.isArray(payload.cases) || payload.cases.length < evalCount) return false;
  return payload.cases.every(caseHasOutputAndScores);
}

function jsonlRunIsValid(text, domainName, evalCount) {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  if (rows.length < evalCount) return false;
  return rows.every((row) => row.domain === domainName && caseHasOutputAndScores(row));
}

function rawOutputEvidence(domainRepo, domainName, evalCount) {
  const files = collectRawOutputFiles(domainRepo);
  if (files.length === 0) {
    return { ok: false, detail: 'requires benchmarks/raw/ or evals/raw/' };
  }

  for (const file of files) {
    try {
      const text = fs.readFileSync(file, 'utf8');
      const ok = file.endsWith('.jsonl')
        ? jsonlRunIsValid(text, domainName, evalCount)
        : jsonRunIsValid(JSON.parse(text), domainName, evalCount);
      if (ok) return { ok: true, detail: path.relative(domainRepo, file) };
    } catch {
      // Keep scanning; the final blocker explains the required shape.
    }
  }

  return {
    ok: false,
    detail: 'requires valid benchmark-run-v1 JSON/JSONL with per-case outputs and scores',
  };
}

function hasBenchmarkReport(domainRepo) {
  return (
    exists(path.join(domainRepo, 'benchmarks', 'report.md')) ||
    exists(path.join(domainRepo, 'evals', 'BENCHMARK_REPORT.md'))
  );
}

function hasScoringRubric(domainRepo) {
  return exists(path.join(domainRepo, 'evals', 'scoring.json'));
}

function hasKnownLimitations(domainRepo) {
  return exists(path.join(domainRepo, 'docs', 'known-limitations.md'));
}

function pushCheck(name, ok, detail) {
  checks.push({ name, ok, detail });
  if (!ok) blockers.push(`${name}: ${detail}`);
}

function loadRegistry() {
  const registryPath = path.join(openSourceRoot, 'kdna-registry', 'domains.json');
  if (!exists(registryPath)) return null;
  return readJson(registryPath);
}

const registry = loadRegistry();

for (const domain of referenceDomains) {
  if (!exists(domain.repo)) {
    pushCheck(domain.name, false, `repo missing at ${domain.repo}`);
    continue;
  }

  const manifestPath = path.join(domain.repo, 'kdna.json');
  const manifest = exists(manifestPath) ? readJson(manifestPath) : {};
  const evalCount = countEvalCases(domain.repo);
  const rawOutputs = rawOutputEvidence(domain.repo, domain.name, evalCount);
  const benchmarkReport = hasBenchmarkReport(domain.repo);
  const scoringRubric = hasScoringRubric(domain.repo);
  const knownLimitations = hasKnownLimitations(domain.repo);
  const registryEntry = registry?.domains?.find((entry) => entry.name === domain.name);

  pushCheck(`${domain.name} eval cases`, evalCount >= 30, `${evalCount}/30 eval-*.json cases`);
  pushCheck(`${domain.name} raw outputs`, rawOutputs.ok, rawOutputs.detail);
  pushCheck(
    `${domain.name} benchmark report`,
    benchmarkReport,
    'requires benchmarks/report.md or evals/BENCHMARK_REPORT.md',
  );
  pushCheck(`${domain.name} scoring rubric`, scoringRubric, 'requires evals/scoring.json');
  pushCheck(
    `${domain.name} known limitations`,
    knownLimitations,
    'requires docs/known-limitations.md',
  );

  if (manifest.quality_badge === 'validated') {
    pushCheck(
      `${domain.name} manifest validated claim`,
      evalCount >= 30 && rawOutputs.ok && benchmarkReport && scoringRubric && knownLimitations,
      'validated manifest claim lacks full evidence gate',
    );
  }
  if (registryEntry?.quality_badge === 'validated') {
    pushCheck(
      `${domain.name} registry validated claim`,
      evalCount >= 30 && rawOutputs.ok && benchmarkReport && scoringRubric && knownLimitations,
      'validated registry claim lacks full evidence gate',
    );
  }
  if (registryEntry && registryEntry.test_count !== evalCount) {
    pushCheck(
      `${domain.name} registry test_count`,
      false,
      `registry=${registryEntry.test_count}, eval-*.json=${evalCount}`,
    );
  }
}

const result = {
  ok: blockers.length === 0,
  checked_at: new Date().toISOString(),
  reference_domains: referenceDomains.map((domain) => domain.name),
  checks,
  blockers,
};

console.log(JSON.stringify(result, null, 2));

if (blockers.length > 0 && !allowBlockers) {
  process.exit(1);
}
