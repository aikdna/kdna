#!/usr/bin/env node

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';

import { writeComplexSample } from './read-cost-complex-sample.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const VIEWS = ['body', 'full', 'raw'];
const READY_STATUS = new Set(['ready', 'catalog_only']);

function usage() {
  return [
    'node scripts/read-cost-measure.mjs --cli <kdna> --out <directory> [options]',
    '',
    'Options:',
    '  --manifest <file>          Default: scripts/read-cost-samples.json',
    '  --repeats <count>          Default: manifest repeats or 3',
    '  --tokenizer-module <file>  Optional ESM/CJS module exporting countTokens(text)',
    '  --sample <id>              Restrict the run to one sample (repeatable)',
    '  --help                     Show this help',
  ].join('\n');
}

function parseArgs(argv) {
  const options = {
    manifest: path.join(ROOT, 'scripts/read-cost-samples.json'),
    repeats: null,
    tokenizerModule: null,
    samples: [],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help') return { help: true };
    if (
      arg === '--cli' ||
      arg === '--out' ||
      arg === '--manifest' ||
      arg === '--repeats' ||
      arg === '--tokenizer-module' ||
      arg === '--sample'
    ) {
      const value = argv[index + 1];
      if (value === undefined) throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === '--cli') options.cli = value;
      if (arg === '--out') options.out = value;
      if (arg === '--manifest') options.manifest = path.resolve(value);
      if (arg === '--repeats') options.repeats = Number(value);
      if (arg === '--tokenizer-module') options.tokenizerModule = path.resolve(value);
      if (arg === '--sample') options.samples.push(value);
      continue;
    }
    throw new Error(`unknown argument: ${arg}`);
  }
  if (!options.cli) throw new Error('--cli is required');
  if (!options.out) throw new Error('--out is required');
  if (
    options.repeats !== null &&
    (!Number.isSafeInteger(options.repeats) || options.repeats < 1 || options.repeats > 20)
  ) {
    throw new Error('--repeats must be an integer from 1 to 20');
  }
  return options;
}

function nowStamp() {
  return new Date().toISOString().replaceAll(/[-:.TZ]/g, '');
}

function hashBytes(bytes) {
  return `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;
}

function hashFile(file) {
  return hashBytes(fs.readFileSync(file));
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function latencySummary(values) {
  if (!values.length) return { samples: [], min: null, median: null, max: null };
  return {
    samples: values,
    min: Math.min(...values),
    median: median(values),
    max: Math.max(...values),
  };
}

export function projectionMetadata(responseCount) {
  if (!Number.isSafeInteger(responseCount) || responseCount < 1) {
    throw new Error('responseCount must be a positive integer');
  }
  return {
    response_count: responseCount,
    projection_scope: responseCount === 1 ? 'single_response' : 'sum_of_responses',
    host_model_input: 'NOT_MEASURED',
  };
}

function decimalNumber(value) {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value;
  if (typeof value === 'string' && /^[0-9]+$/.test(value)) {
    const parsed = Number(BigInt(value));
    return Number.isSafeInteger(parsed) ? parsed : null;
  }
  return null;
}

function contentOf(output) {
  if (!output || typeof output !== 'object') return null;
  return output.envelope?.content ?? output.content ?? null;
}

function envelopeOf(output) {
  return output?.envelope ?? (output?.content ? output : null);
}

function selectedJudgmentIds(outputs) {
  const ids = new Set();
  for (const output of outputs) {
    const selected = contentOf(output)?.selected;
    if (Array.isArray(selected?.judgment_ids)) {
      for (const id of selected.judgment_ids) ids.add(id);
    }
    if (typeof selected?.judgment_id === 'string') ids.add(selected.judgment_id);
  }
  return [...ids];
}

function deliveredJudgmentIds(outputs) {
  return [...deliveredJudgmentText(outputs).keys()];
}

function deliveredJudgmentText(outputs) {
  const textById = new Map();
  for (const output of outputs) {
    const content = contentOf(output);
    if (!Array.isArray(content?.closure)) continue;
    for (const entry of content.closure) {
      if (entry?.role !== 'judgment') continue;
      if (entry.value === null || entry.value === undefined) continue;
      const id = entry.target?.id ?? entry.value?.id;
      if (typeof id !== 'string') continue;
      const previous = textById.get(id);
      const current = JSON.stringify(entry.value);
      textById.set(id, previous ? `${previous}\n${current}` : current);
    }
  }
  return textById;
}

function objectSizes(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      Buffer.byteLength(JSON.stringify(child), 'utf8'),
    ]),
  );
}

function outputBreakdown(output) {
  const envelope = envelopeOf(output);
  if (!envelope) return null;
  return {
    envelope: objectSizes(envelope),
    content: objectSizes(envelope.content),
  };
}

function parseOutputs(stdout) {
  const lines = stdout.split('\n').filter((line) => line.length > 0);
  return lines.map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`output line ${index + 1} is not JSON: ${error.message}`);
    }
  });
}

export function extractBudgets(outputs) {
  const rows = [];
  for (const output of outputs) {
    const budget = envelopeOf(output)?.budget;
    if (!budget) continue;
    rows.push({
      limit_bytes: decimalNumber(budget.limit_bytes),
      required_bytes: decimalNumber(budget.required_bytes),
      actual_bytes: decimalNumber(budget.actual_bytes),
    });
  }
  return rows;
}

export function evaluateSemantics(outputs, expectedIds, requirements, allowDeferred) {
  if (!expectedIds.length) {
    return { status: 'not_applicable', details: [] };
  }
  const selected = new Set(selectedJudgmentIds(outputs));
  const delivered = new Set(deliveredJudgmentIds(outputs));
  const deliveredText = deliveredJudgmentText(outputs);
  const requiredById = new Map(requirements.map((row) => [row.judgment_id, row]));
  const details = [];

  for (const id of expectedIds) {
    const requirement = requiredById.get(id) ?? {
      required_terms: [],
      mandatory_dependency_ids: [],
    };
    if (!selected.has(id) && !delivered.has(id)) {
      details.push({
        judgment_id: id,
        state: allowDeferred ? 'deferred' : 'missing',
        missing_terms: requirement.required_terms,
        missing_dependencies: requirement.mandatory_dependency_ids.filter(
          (dependency) => !delivered.has(dependency),
        ),
      });
      continue;
    }
    const judgmentText = deliveredText.get(id) ?? '';
    const missingTerms = requirement.required_terms.filter((term) => !judgmentText.includes(term));
    const missingDependencies = requirement.mandatory_dependency_ids.filter(
      (dependency) => !delivered.has(dependency),
    );
    details.push({
      judgment_id: id,
      state: missingTerms.length || missingDependencies.length ? 'incomplete' : 'complete',
      missing_terms: missingTerms,
      missing_dependencies: missingDependencies,
    });
  }

  if (details.every((row) => row.state === 'complete')) {
    return { status: 'complete', details };
  }
  if (allowDeferred && details.every((row) => row.state === 'deferred')) {
    return { status: 'deferred', details };
  }
  return { status: 'incomplete', details };
}

function normalizeCliPath(cli) {
  return fs.realpathSync(path.resolve(cli));
}

function findCliPackage(cliPath) {
  let current = path.dirname(cliPath);
  for (;;) {
    const packagePath = path.join(current, 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      if (pkg.name === '@aikdna/kdna-cli') return { root: current, pkg };
    }
    const parent = path.dirname(current);
    if (parent === current) throw new Error('could not locate @aikdna/kdna-cli package');
    current = parent;
  }
}

function spawnResult(cli, args, options = {}) {
  const started = process.hrtime.bigint();
  return new Promise((resolve, reject) => {
    let settled = false;
    const child = spawn(cli, args, {
      cwd: options.cwd ?? ROOT,
      env: { ...process.env, NO_COLOR: '1' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const out = [];
    const err = [];
    const timer = setTimeout(() => {
      if (settled) return;
      child.kill('SIGKILL');
      reject(new Error(`CLI timed out after ${options.timeoutMs ?? 60000} ms`));
    }, options.timeoutMs ?? 60000);
    child.stdout.on('data', (chunk) => out.push(chunk));
    child.stderr.on('data', (chunk) => err.push(chunk));
    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        code,
        stdout: Buffer.concat(out).toString('utf8'),
        stderr: Buffer.concat(err).toString('utf8'),
        elapsed_ms: Number(process.hrtime.bigint() - started) / 1e6,
      });
    });
    if (options.stdin !== undefined) child.stdin.end(options.stdin);
    else child.stdin.end();
  });
}

function makeLineQueue(stream) {
  let buffer = '';
  let ended = false;
  let failure = null;
  const lines = [];
  const waiters = [];

  const flush = () => {
    while (waiters.length && (lines.length || ended || failure)) {
      const waiter = waiters.shift();
      if (lines.length) waiter.resolve(lines.shift());
      else if (failure) waiter.reject(failure);
      else waiter.resolve(null);
    }
  };
  const push = (line) => {
    if (line === '') return;
    const waiter = waiters.shift();
    if (waiter) waiter.resolve(line);
    else lines.push(line);
  };

  stream.setEncoding('utf8');
  stream.on('data', (chunk) => {
    buffer += chunk;
    for (;;) {
      const newline = buffer.indexOf('\n');
      if (newline < 0) break;
      const line = buffer.slice(0, newline);
      buffer = buffer.slice(newline + 1);
      push(line);
    }
  });
  stream.on('error', (error) => {
    failure = error;
    ended = true;
    flush();
  });
  stream.on('end', () => {
    if (buffer.length) push(buffer);
    ended = true;
    flush();
  });

  return {
    next() {
      if (lines.length) return Promise.resolve(lines.shift());
      if (failure) return Promise.reject(failure);
      if (ended) return Promise.resolve(null);
      return new Promise((resolve, reject) => waiters.push({ resolve, reject }));
    },
  };
}

class SessionRunner {
  constructor(cli, asset, binding, budget, options = {}) {
    this.cli = cli;
    this.asset = asset;
    this.binding = binding;
    this.budget = budget;
    this.options = options;
  }

  requestFor(mode, selection, handle, requestId) {
    return {
      request_id: requestId,
      tuple: this.binding.tuple,
      budget_bytes: this.budget,
      mode,
      selection,
      handle,
    };
  }

  async run(groups) {
    const child = spawn(
      this.cli,
      ['read', this.asset, '--session', '--allow-read', '--view', this.options.view],
      {
        cwd: ROOT,
        env: { ...process.env, NO_COLOR: '1' },
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );
    const lines = makeLineQueue(child.stdout);
    const stderr = [];
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    const started = process.hrtime.bigint();
    const requestLatencies = [];
    const outputs = [];
    const stdoutLines = [];
    const requests = groups.map((ids, index) =>
      this.requestFor(
        'exact_selection',
        {
          asset_id: this.options.assetId,
          asset_version: this.options.assetVersion,
          judgment_ids: ids,
        },
        null,
        `read-cost:${this.options.sampleId}:${this.options.operationId}:${this.options.runIndex}:${index}`,
      ),
    );

    try {
      for (const request of requests) {
        const requestStarted = process.hrtime.bigint();
        child.stdin.write(`${JSON.stringify(request)}\n`);
        const line = await lines.next();
        if (line === null) throw new Error('session ended before producing a response');
        requestLatencies.push(Number(process.hrtime.bigint() - requestStarted) / 1e6);
        stdoutLines.push(line);
        outputs.push(JSON.parse(line));
      }
      child.stdin.end();
      const code = await new Promise((resolve, reject) => {
        child.once('error', reject);
        child.once('close', resolve);
      });
      return {
        code,
        stdout: `${stdoutLines.join('\n')}\n`,
        stderr: Buffer.concat(stderr).toString('utf8'),
        elapsed_ms: Number(process.hrtime.bigint() - started) / 1e6,
        request_latencies_ms: requestLatencies,
        outputs,
      };
    } catch (error) {
      child.kill('SIGKILL');
      throw error;
    }
  }

  async runWholeAndExpand(judgmentIds) {
    const child = spawn(
      this.cli,
      ['read', this.asset, '--session', '--allow-read', '--view', 'full'],
      {
        cwd: ROOT,
        env: { ...process.env, NO_COLOR: '1' },
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );
    const lines = makeLineQueue(child.stdout);
    const stderr = [];
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    const started = process.hrtime.bigint();
    const requestLatencies = [];
    const outputs = [];
    const stdoutLines = [];
    const send = async (request) => {
      const requestStarted = process.hrtime.bigint();
      child.stdin.write(`${JSON.stringify(request)}\n`);
      const line = await lines.next();
      if (line === null) throw new Error('session ended before producing a response');
      requestLatencies.push(Number(process.hrtime.bigint() - requestStarted) / 1e6);
      stdoutLines.push(line);
      const output = JSON.parse(line);
      outputs.push(output);
      return output;
    };

    try {
      const whole = await send(
        this.requestFor(
          'whole_asset',
          null,
          null,
          `read-cost:${this.options.sampleId}:${this.options.operationId}:whole`,
        ),
      );
      const handles = whole?.envelope?.content?.expansion_handles ?? [];
      const byTarget = new Map(
        handles
          .filter((handle) => handle?.target?.kind === 'judgment')
          .map((handle) => [handle.target.id, handle]),
      );
      for (const id of judgmentIds) {
        const handle = byTarget.get(id);
        if (!handle) throw new Error(`whole_asset did not issue a handle for ${id}`);
        await send(
          this.requestFor(
            'expand',
            null,
            handle,
            `read-cost:${this.options.sampleId}:${this.options.operationId}:expand:${id}`,
          ),
        );
      }
      child.stdin.end();
      const code = await new Promise((resolve, reject) => {
        child.once('error', reject);
        child.once('close', resolve);
      });
      return {
        code,
        stdout: `${stdoutLines.join('\n')}\n`,
        stderr: Buffer.concat(stderr).toString('utf8'),
        elapsed_ms: Number(process.hrtime.bigint() - started) / 1e6,
        request_latencies_ms: requestLatencies,
        outputs,
      };
    } catch (error) {
      child.kill('SIGKILL');
      throw error;
    }
  }
}

export function buildOperations(sample) {
  const ids = sample.judgment_ids;
  const firstTwo = ids.slice(0, 2);
  return [
    {
      id: 'catalog',
      kind: 'single',
      expected_ids: [],
      args: ['--mode', 'catalog'],
    },
    {
      id: 'exact-single',
      kind: 'single',
      expected_ids: [ids[0]],
      selection: [ids[0]],
      args: ['--mode', 'exact_selection'],
    },
    {
      id: 'exact-2-separate',
      kind: 'session',
      expected_ids: firstTwo,
      groups: firstTwo.map((id) => [id]),
    },
    {
      id: 'exact-2-combined',
      kind: 'session',
      expected_ids: firstTwo,
      groups: [firstTwo],
    },
    {
      id: 'exact-all-separate',
      kind: 'session',
      expected_ids: ids,
      groups: ids.map((id) => [id]),
    },
    {
      id: 'exact-all-combined',
      kind: 'session',
      expected_ids: ids,
      groups: [ids],
    },
    {
      id: 'whole-asset',
      kind: 'single',
      expected_ids: ids,
      allow_deferred: true,
      args: ['--mode', 'whole_asset'],
    },
    {
      id: 'whole-expand-all',
      kind: 'whole-expand-all',
      expected_ids: ids,
      views: ['full'],
      model_input_view: 'full',
    },
  ];
}

function commandArgs(operation, sample, asset, budget, view) {
  const args = ['read', asset, '--allow-read', '--view', view];
  if (operation.kind === 'session' || operation.kind === 'whole-expand-all') {
    args.push('--session');
    return args;
  }
  args.push('--budget', String(budget), ...operation.args);
  if (operation.selection) {
    args.push(
      '--asset-id',
      sample.asset_id,
      '--asset-version',
      sample.asset_version,
      '--judgment-id',
      operation.selection[0],
    );
  }
  return args;
}

async function loadTokenizer(modulePath) {
  if (!modulePath) return null;
  const module = await import(pathToFileURL(modulePath).href);
  const candidate = module.default?.countTokens ?? module.countTokens;
  if (typeof candidate !== 'function') {
    throw new Error('tokenizer module must export countTokens(text) or default.countTokens');
  }
  return {
    label: module.default?.label ?? module.label ?? path.basename(modulePath),
    count: candidate,
    module_sha256: hashFile(modulePath),
  };
}

function tokenCounts(tokenizer, stdoutLines) {
  if (!tokenizer) {
    return {
      status: 'NOT_MEASURED',
      kind: 'computed_tokenizer_count',
      host_model_input: 'NOT_MEASURED',
      counts: [],
      total: null,
    };
  }
  const counts = stdoutLines.map((line) => tokenizer.count(line));
  return {
    status: 'computed',
    kind: 'computed_tokenizer_count',
    host_model_input: 'NOT_MEASURED',
    counts,
    total: counts.reduce((sum, count) => sum + count, 0),
  };
}

function measurementRecord(run, operation, options) {
  const outputs = run.outputs;
  const budgets = extractBudgets(outputs);
  const bodyBytes = Buffer.byteLength(run.stdout, 'utf8');
  const stdoutLines = run.stdout.split('\n').filter((line) => line.length > 0);
  const projectedStdoutBytes = stdoutLines.reduce(
    (sum, line) => sum + Buffer.byteLength(line, 'utf8'),
    0,
  );
  const status = outputs.map((output) => envelopeOf(output)?.status ?? output.status);
  const selected = selectedJudgmentIds(outputs);
  const delivered = deliveredJudgmentIds(outputs);
  return {
    ...projectionMetadata(outputs.length),
    stdout_bytes: bodyBytes,
    projected_stdout_bytes: projectedStdoutBytes,
    stderr_bytes: Buffer.byteLength(run.stderr, 'utf8'),
    exit_code: run.code,
    status,
    selected_judgment_ids: selected,
    delivered_judgment_ids: delivered,
    budgets,
    budget_required_bytes: budgets.reduce((sum, row) => sum + (row.required_bytes ?? 0), 0),
    budget_actual_bytes: budgets.reduce((sum, row) => sum + (row.actual_bytes ?? 0), 0),
    stdout_lines: stdoutLines,
    latency_ms: run.elapsed_ms,
    request_latencies_ms: run.request_latencies_ms ?? [],
    breakdown: outputBreakdown(outputs[0]),
    semantic: evaluateSemantics(
      outputs,
      operation.expected_ids,
      options.sample.semantic_requirements,
      operation.allow_deferred === true,
    ),
  };
}

function assertSuccessful(record, label) {
  const failedStatus = record.status.filter((status) => !READY_STATUS.has(status));
  if (record.exit_code !== 0 || failedStatus.length) {
    throw new Error(
      `${label} failed (exit ${record.exit_code}, statuses ${JSON.stringify(record.status)})`,
    );
  }
}

async function runMeasurement(
  cli,
  operation,
  sample,
  asset,
  binding,
  budget,
  view,
  repeat,
  tokenizer,
  options,
) {
  let run;
  if (operation.kind === 'session') {
    const session = new SessionRunner(cli, asset, binding, budget, {
      view,
      assetId: sample.asset_id,
      assetVersion: sample.asset_version,
      sampleId: sample.id,
      operationId: operation.id,
      runIndex: repeat,
    });
    run = await session.run(operation.groups);
  } else if (operation.kind === 'whole-expand-all') {
    const session = new SessionRunner(cli, asset, binding, budget, {
      view,
      assetId: sample.asset_id,
      assetVersion: sample.asset_version,
      sampleId: sample.id,
      operationId: operation.id,
      runIndex: repeat,
    });
    run = await session.runWholeAndExpand(operation.expected_ids);
  } else {
    const args = commandArgs(operation, sample, asset, budget, view);
    run = await spawnResult(cli, args, { cwd: ROOT });
    run.outputs = parseOutputs(run.stdout);
  }

  const record = measurementRecord(run, operation, { sample });
  record.tokens = tokenCounts(tokenizer, record.stdout_lines);
  return { record, stdout: run.stdout, stderr: run.stderr };
}

async function writeRunArtifacts(runDir, sampleId, operationId, view, repeat, run) {
  const dir = path.join(runDir, 'raw', sampleId);
  await fsp.mkdir(dir, { recursive: true });
  const base = `${operationId}.${view}.run${repeat}`;
  await fsp.writeFile(path.join(dir, `${base}.out`), run.stdout);
  await fsp.writeFile(path.join(dir, `${base}.err`), run.stderr);
}

function combineRecords(records) {
  const latencies = records.map((record) => record.latency_ms);
  const requestLatencies = records.flatMap((record) => record.request_latencies_ms);
  const projectedStdoutBytes = records.map((record) => record.projected_stdout_bytes);
  const capturedStdoutBytes = records.map((record) => record.stdout_bytes);
  const first = records[0];
  return {
    response_count: first.response_count,
    projection_scope: first.projection_scope,
    host_model_input: first.host_model_input,
    stdout_bytes: first.stdout_bytes,
    projected_stdout_bytes: first.projected_stdout_bytes,
    projected_stdout_bytes_samples: latencySummary(projectedStdoutBytes),
    captured_stdout_bytes_samples: latencySummary(capturedStdoutBytes),
    stderr_bytes: first.stderr_bytes,
    exit_code: first.exit_code,
    status: first.status,
    selected_judgment_ids: first.selected_judgment_ids,
    delivered_judgment_ids: first.delivered_judgment_ids,
    budgets: first.budgets,
    budget_required_bytes: first.budget_required_bytes,
    budget_actual_bytes: first.budget_actual_bytes,
    stdout_lines: first.stdout_lines,
    breakdown: first.breakdown,
    semantic: first.semantic,
    tokens: first.tokens,
    latency_ms: latencySummary(latencies),
    request_latencies_ms: requestLatencies.length ? latencySummary(requestLatencies) : null,
    repeats: records.length,
  };
}

async function inspectSample(cli, asset, sample) {
  const result = await spawnResult(cli, ['inspect', asset, '--json'], { cwd: ROOT });
  const records = parseOutputs(result.stdout);
  if (result.code !== 0 || records.length !== 1 || records[0].status !== 'accepted') {
    throw new Error(`inspect failed for ${sample.id}: ${result.stdout.trim()}`);
  }
  const row = records[0];
  if (
    row.asset?.asset_id !== sample.asset_id ||
    row.asset?.asset_version !== sample.asset_version
  ) {
    throw new Error(`sample identity mismatch for ${sample.id}`);
  }
  return row;
}

async function prepareSample(cli, sample, bindingPath, runDir) {
  const assetsDir = path.join(runDir, 'assets');
  await fsp.mkdir(assetsDir, { recursive: true });
  const assetPath = path.join(assetsDir, `${sample.id}.kdna`);
  if (sample.generator) {
    const authoredPath = path.join(assetsDir, `${sample.id}.author.json`);
    writeComplexSample(bindingPath, authoredPath);
    const result = await spawnResult(
      cli,
      ['create', authoredPath, '--output', assetPath, '--allow-create'],
      { cwd: ROOT },
    );
    const rows = parseOutputs(result.stdout);
    if (result.code !== 0 || rows[0]?.status !== 'saved') {
      throw new Error(`create failed for ${sample.id}: ${result.stdout.trim()}`);
    }
  } else {
    const source = path.resolve(ROOT, sample.path);
    await fsp.copyFile(source, assetPath);
  }
  const inspect = await inspectSample(cli, assetPath, sample);
  return {
    ...sample,
    asset_path: assetPath,
    source_path: sample.path ?? sample.generator,
    sha256: hashFile(assetPath),
    bytes: fs.statSync(assetPath).size,
    inspect,
  };
}

function selectSamples(manifest, filters) {
  const selected = filters.length
    ? manifest.samples.filter((sample) => filters.includes(sample.id))
    : manifest.samples;
  if (selected.length !== (filters.length || manifest.samples.length)) {
    const found = new Set(selected.map((sample) => sample.id));
    const missing = filters.filter((id) => !found.has(id));
    throw new Error(`unknown sample id: ${missing.join(', ')}`);
  }
  return selected;
}

export function compareOperations(results, sampleId) {
  const byId = new Map(
    results
      .filter((result) => result.sample_id === sampleId)
      .map((result) => [result.operation_id, result]),
  );
  const pairs = [
    ['exact-2-separate', 'exact-2-combined'],
    ['exact-all-separate', 'exact-all-combined'],
  ];
  return pairs.map(([separateId, combinedId]) => {
    const separate = byId.get(separateId)?.views?.body;
    const combined = byId.get(combinedId)?.views?.body;
    if (!separate || !combined) return { separate: separateId, combined: combinedId };
    const separateBytes = separate.projected_stdout_bytes ?? separate.stdout_bytes;
    const combinedBytes = combined.projected_stdout_bytes ?? combined.stdout_bytes;
    const saved = separateBytes - combinedBytes;
    return {
      separate: separateId,
      combined: combinedId,
      separate_bytes: separateBytes,
      combined_bytes: combinedBytes,
      saved_bytes: saved,
      saved_percent: separateBytes ? Number(((saved / separateBytes) * 100).toFixed(2)) : null,
    };
  });
}

function renderMarkdown(result) {
  const lines = [
    '# Read Cost Measurement',
    '',
    `Run: \`${result.run_id}\``,
    `Generated: ${result.generated_at}`,
    '',
    '## Coordinates',
    '',
    `- CLI: \`${result.environment.cli.name}@${result.environment.cli.version}\``,
    `- Core: \`${result.environment.cli.core_version}\``,
    `- Read: \`${result.environment.cli.read_version}\``,
    `- Node: \`${result.environment.node}\``,
    `- Tokenizer: ${result.tokenizer ? `\`${result.tokenizer.label}\`` : '`NOT_MEASURED`'}`,
    '',
    '## Cost Table',
    '',
    '| Sample | Operation | View | Responses | Projected stdout bytes | Captured stdout | Envelope required | Computed tokens | Host model input | Semantic | Tool calls |',
    '| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: |',
  ];
  for (const row of result.results) {
    const view = row.model_input_view;
    const measurement = row.views[view];
    if (!measurement) continue;
    const envelopeView = row.views.raw ?? row.views.full ?? measurement;
    lines.push(
      `| ${row.sample_id} | ${row.operation_id} | ${view} | ${measurement.response_count} | ` +
        `${measurement.projected_stdout_bytes} | ${measurement.stdout_bytes} | ` +
        `${envelopeView.budget_required_bytes || ''} | ` +
        `${measurement.tokens?.total ?? 'NOT_MEASURED'} | ${measurement.host_model_input} | ` +
        `${measurement.semantic.status} | ${row.tool_calls.total} |`,
    );
  }
  lines.push(
    '',
    '`Projected stdout bytes` is the sum of the exact JSON response lines, excluding separators and the final capture newline. `Captured stdout` includes those bytes. When `Responses` is greater than one, projected bytes and tokens are cumulative across tool calls, not a single model request.',
    '',
    '`Computed tokens` is a tokenizer count over the same response lines. It is not a Host observation. `Host model input` remains `NOT_MEASURED` because the Harness prompt, retries, catalog lookup, expansion routing and tool-response wrapper are outside this run.',
    '',
    '`Envelope required` is also a sum when `Responses` is greater than one.',
    '',
    '## Separation and Latency',
    '',
    '| Sample | Operation | Fresh-process median ms | In-session request median ms | Repeats |',
    '| --- | --- | ---: | ---: | ---: |',
  );
  for (const row of result.results) {
    const measurement = row.views[row.model_input_view];
    if (!measurement) continue;
    lines.push(
      `| ${row.sample_id} | ${row.operation_id} | ${measurement.latency_ms.median?.toFixed(2) ?? ''} | ` +
        `${measurement.request_latencies_ms?.median?.toFixed(2) ?? ''} | ${measurement.repeats} |`,
    );
  }
  lines.push(
    '',
    'A fresh process is not a purged OS cache. In-session values cover requests handled by one retained session and are not Host service-level measurements.',
    '',
    '## Multi-select Comparison',
    '',
    '| Sample | Pair | Separate bytes | Combined bytes | Saved | Saved % |',
    '| --- | --- | ---: | ---: | ---: | ---: |',
  );
  for (const row of result.comparisons) {
    lines.push(
      `| ${row.sample_id} | ${row.separate} → ${row.combined} | ${row.separate_bytes ?? ''} | ` +
        `${row.combined_bytes ?? ''} | ${row.saved_bytes ?? ''} | ${row.saved_percent ?? ''} |`,
    );
  }
  lines.push(
    '',
    '## Envelope Breakdown',
    '',
    '| Sample | Operation | Total bytes | Largest envelope fields | Largest content fields |',
    '| --- | --- | ---: | --- | --- |',
  );
  for (const row of result.results) {
    for (const view of Object.keys(row.views)) {
      const measurement = row.views[view];
      if (!measurement.breakdown) continue;
      const top = Object.entries(measurement.breakdown.envelope)
        .sort((left, right) => right[1] - left[1])
        .slice(0, 4)
        .map(([key, value]) => `${key}=${value}`)
        .join(', ');
      const content = Object.entries(measurement.breakdown.content)
        .sort((left, right) => right[1] - left[1])
        .slice(0, 4)
        .map(([key, value]) => `${key}=${value}`)
        .join(', ');
      lines.push(
        `| ${row.sample_id} | ${row.operation_id} | ${measurement.stdout_bytes} | ${top} | ${content} |`,
      );
    }
  }
  lines.push(
    '',
    '## Raw Results',
    '',
    '- `results.json` contains every measurement and raw latency sample.',
    '- `raw/` contains every captured stdout and stderr file.',
    '- `assets/` contains the exact input assets used in the run.',
    '',
  );
  return `${lines.join('\n')}\n`;
}

async function main(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    console.log(usage());
    return 0;
  }
  const cli = normalizeCliPath(options.cli);
  const cliPackage = findCliPackage(cli);
  const bindingPath = path.join(cliPackage.root, 'public-contract-binding.json');
  const binding = JSON.parse(fs.readFileSync(bindingPath, 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(options.manifest, 'utf8'));
  const samples = selectSamples(manifest, options.samples);
  const repeats = options.repeats ?? manifest.repeats ?? 3;
  const tokenizer = await loadTokenizer(options.tokenizerModule);
  const runId = `${nowStamp()}-${crypto.randomBytes(3).toString('hex')}`;
  const runDir = path.join(path.resolve(options.out), `run-${runId}`);
  await fsp.mkdir(runDir, { recursive: true });

  const cliVersion = await spawnResult(cli, ['--version'], { cwd: ROOT });
  const environment = {
    cli: {
      path: cli,
      sha256: hashFile(cli),
      name: cliPackage.pkg.name,
      version: cliVersion.stdout.trim(),
      core_version: cliPackage.pkg.dependencies?.['@aikdna/kdna-core'] ?? null,
      read_version: cliPackage.pkg.dependencies?.['@aikdna/kdna-read'] ?? null,
      binding_sha256: hashFile(bindingPath),
      tuple: binding.tuple,
      accepted_core: binding.accepted_core,
      accepted_read: binding.accepted_read,
    },
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    cpus: os.cpus().length,
  };

  const prepared = [];
  for (const sample of samples) {
    prepared.push(await prepareSample(cli, sample, bindingPath, runDir));
  }

  const results = [];
  for (const sample of prepared) {
    for (const operation of buildOperations(sample)) {
      const views = operation.views ?? VIEWS;
      const viewRows = {};
      for (const view of views) {
        const repeatCount =
          operation.kind === 'whole-expand-all' ? 1 : view === 'body' ? repeats : 1;
        const records = [];
        for (let repeat = 0; repeat < repeatCount; repeat += 1) {
          const measured = await runMeasurement(
            cli,
            operation,
            sample,
            sample.asset_path,
            binding,
            manifest.budget_bytes,
            view,
            repeat,
            tokenizer,
            options,
          );
          await writeRunArtifacts(runDir, sample.id, operation.id, view, repeat, measured);
          records.push(measured.record);
          assertSuccessful(measured.record, `${sample.id}/${operation.id}/${view}`);
        }
        viewRows[view] = combineRecords(records);
      }
      results.push({
        sample_id: sample.id,
        operation_id: operation.id,
        kind: operation.kind,
        expected_judgment_ids: operation.expected_ids,
        allow_deferred: operation.allow_deferred === true,
        model_input_view: operation.model_input_view ?? 'body',
        tool_calls: {
          processes: operation.kind === 'session' || operation.kind === 'whole-expand-all' ? 1 : 1,
          session_requests:
            operation.kind === 'session'
              ? operation.groups.length
              : operation.kind === 'whole-expand-all'
                ? operation.expected_ids.length + 1
                : 1,
          total:
            operation.kind === 'session'
              ? operation.groups.length
              : operation.kind === 'whole-expand-all'
                ? operation.expected_ids.length + 1
                : 1,
        },
        views: viewRows,
      });
    }
  }

  const comparisons = prepared.flatMap((sample) =>
    compareOperations(results, sample.id).map((row) => ({ sample_id: sample.id, ...row })),
  );
  const report = {
    schema: 'kdna.read-cost.results/1',
    run_id: runId,
    generated_at: new Date().toISOString(),
    manifest: path.relative(ROOT, options.manifest),
    environment,
    tokenizer: tokenizer
      ? { label: tokenizer.label, module_sha256: tokenizer.module_sha256 }
      : null,
    samples: prepared.map((sample) => ({
      id: sample.id,
      asset_path: path.relative(runDir, sample.asset_path),
      source_path: sample.source_path,
      sha256: sample.sha256,
      bytes: sample.bytes,
      asset_id: sample.asset_id,
      asset_version: sample.asset_version,
      judgment_ids: sample.judgment_ids,
    })),
    results,
    comparisons,
    notes: {
      projected_stdout_bytes:
        'Sum of exact JSON response lines; excludes separators and the final capture newline. Multi-response rows are cumulative.',
      captured_stdout_bytes: 'Captured stdout includes response separators and the final newline.',
      host_model_input:
        'NOT_MEASURED: no Host trace of prompts, retries, expansion routing or tool-response wrappers.',
      tokenizer: 'Computed tokenizer count, not a Host observation.',
      latency:
        'Fresh process and in-session request latency are reported separately; no OS cache purge was attempted.',
      semantic:
        'Deferred material is complete only after expansion, not when a catalog or whole_asset body is returned.',
    },
  };
  await fsp.writeFile(path.join(runDir, 'results.json'), `${JSON.stringify(report, null, 2)}\n`);
  await fsp.writeFile(path.join(runDir, 'results.md'), renderMarkdown(report));
  await fsp.writeFile(
    path.join(runDir, 'environment.json'),
    `${JSON.stringify(environment, null, 2)}\n`,
  );
  console.log(runDir);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      console.error(`read-cost-measure: ${error.stack ?? error.message}`);
      process.exitCode = 1;
    });
}
