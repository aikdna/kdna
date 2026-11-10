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

function targetId(entry) {
  return entry?.target?.id ?? entry?.value?.id ?? null;
}

function entryKey(role, id) {
  return `${role}\u0000${id}`;
}

function serializeForCheck(value) {
  return JSON.stringify(value ?? null);
}

function valueIsRicher(candidate, current) {
  if (!current) return true;
  if (candidate?.body_delivery !== 'deferred' && current?.body_delivery === 'deferred') return true;
  return serializeForCheck(candidate?.value).length > serializeForCheck(current?.value).length;
}

function collectReadEvidence(outputs) {
  const entries = new Map();
  const catalogIds = new Set();

  for (const output of outputs) {
    const content = contentOf(output);
    if (!content) continue;
    if (Array.isArray(content.catalog)) {
      for (const row of content.catalog) {
        const id = row?.judgment_id ?? row?.id;
        if (typeof id === 'string') catalogIds.add(id);
      }
    }
    if (Array.isArray(content.relationships)) {
      for (const relationship of content.relationships) {
        if (typeof relationship?.id !== 'string') continue;
        const entry = {
          role: 'relationship',
          target: { kind: 'relationship', id: relationship.id },
          owner: { kind: 'asset', id: content.selected?.asset_id ?? null },
          owner_judgment_id: null,
          value: relationship,
        };
        const key = entryKey(entry.role, relationship.id);
        if (valueIsRicher(entry, entries.get(key))) entries.set(key, entry);
      }
    }
    if (!Array.isArray(content.closure)) continue;
    for (const rawEntry of content.closure) {
      if (typeof rawEntry?.role !== 'string') continue;
      let id = targetId(rawEntry);
      if (id === null && typeof rawEntry.value_ref === 'string') id = rawEntry.value_ref;
      if (id === null) continue;
      const entry = { ...rawEntry, target: rawEntry.target ?? { kind: null, id } };
      if (entry.role === 'relationship' && !entry.value) {
        const rel = content.relationships?.find((row) => row.id === id);
        if (rel) entry.value = rel;
      }
      const key = entryKey(entry.role, id);
      if (valueIsRicher(entry, entries.get(key))) entries.set(key, entry);
    }
  }

  const all = [...entries.values()];
  const byRoleAndId = new Map(all.map((entry) => [entryKey(entry.role, targetId(entry)), entry]));
  const judgments = new Map(
    all.filter((entry) => entry.role === 'judgment').map((entry) => [targetId(entry), entry]),
  );
  return { all, byRoleAndId, judgments, catalogIds };
}

function judgmentText(evidence, id) {
  const parts = [];
  const own = evidence.judgments.get(id);
  if (own) parts.push(serializeForCheck(own.value));

  const owned = evidence.all.filter((entry) => entry.owner_judgment_id === id);
  for (const entry of owned) parts.push(serializeForCheck(entry.value));

  const ownedExceptions = new Set(
    owned
      .filter((entry) => entry.role === 'exception')
      .map((entry) => targetId(entry))
      .filter(Boolean),
  );
  for (const entry of evidence.all) {
    if (entry.role !== 'condition') continue;
    if (!ownedExceptions.has(entry.value?.owner_ref?.id)) continue;
    parts.push(serializeForCheck(entry.value));
  }
  return parts.join('\n');
}

function matchesExpectedSubset(actual, expected, path = '$') {
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) {
      return [`${path} (array length ${expected.length})`];
    }
    return expected.flatMap((value, index) =>
      matchesExpectedSubset(actual[index], value, `${path}[${index}]`),
    );
  }
  if (expected && typeof expected === 'object') {
    if (!actual || typeof actual !== 'object' || Array.isArray(actual)) {
      return [`${path} (object)`];
    }
    return Object.entries(expected).flatMap(([key, value]) =>
      matchesExpectedSubset(actual[key], value, `${path}.${key}`),
    );
  }
  return Object.is(actual, expected) ? [] : [`${path}=${JSON.stringify(expected)}`];
}

function activeStructuredRequirements(requirements, expectedIds) {
  const expected = new Set(expectedIds);
  return requirements.filter(
    (requirement) =>
      !Array.isArray(requirement.required_when_any_judgment_ids) ||
      requirement.required_when_any_judgment_ids.some((id) => expected.has(id)),
  );
}

function evaluateStructuredRequirements(evidence, requirements, deferredOnly) {
  return requirements.map((requirement) => {
    const key = entryKey(requirement.role, requirement.id);
    const entry = evidence.byRoleAndId.get(key);
    if (!entry) {
      return {
        role: requirement.role,
        id: requirement.id,
        state: deferredOnly ? 'deferred' : 'missing',
        missing_fields: [],
        missing_terms: requirement.required_terms ?? [],
      };
    }
    const missingFields = [];
    if (
      Object.hasOwn(requirement, 'owner_judgment_id') &&
      entry.owner_judgment_id !== requirement.owner_judgment_id
    ) {
      missingFields.push(`$.owner_judgment_id=${JSON.stringify(requirement.owner_judgment_id)}`);
    }
    if (requirement.expect) {
      missingFields.push(...matchesExpectedSubset(entry.value, requirement.expect));
    }
    const structureText = serializeForCheck(entry.value);
    const missingTerms = (requirement.required_terms ?? []).filter(
      (term) => !structureText.includes(term),
    );
    return {
      role: requirement.role,
      id: requirement.id,
      state: missingFields.length || missingTerms.length ? 'incomplete' : 'complete',
      missing_fields: missingFields,
      missing_terms: missingTerms,
    };
  });
}

function evaluateMandatoryDependency(evidence, requirement, dependency) {
  const dependencyId = dependency.id ?? null;
  const dependencyEntry = evidence.all.find((entry) => {
    if (entry.role !== 'dependency') return false;
    if (dependencyId && targetId(entry) !== dependencyId) return false;
    return (
      entry.value?.producer?.judgment_ref === dependency.judgment_id &&
      entry.value?.consumer_judgment_ref === requirement.judgment_id
    );
  });
  if (!dependencyEntry) {
    return {
      judgment_id: dependency.judgment_id,
      dependency_id: dependencyId,
      state: 'missing',
      missing_fields: [],
      missing_terms: dependency.required_terms ?? [],
      body_delivery: null,
    };
  }

  const missingFields = dependency.expect
    ? matchesExpectedSubset(dependencyEntry.value, dependency.expect)
    : [];
  const producer = evidence.judgments.get(dependency.judgment_id);
  if (!producer) {
    return {
      judgment_id: dependency.judgment_id,
      dependency_id: dependencyId,
      state: 'missing',
      missing_fields: missingFields,
      missing_terms: dependency.required_terms ?? [],
      body_delivery: null,
    };
  }

  const producerText = judgmentText(evidence, dependency.judgment_id);
  const missingTerms = (dependency.required_terms ?? []).filter(
    (term) => !producerText.includes(term),
  );
  const bodyDeferred = producer.body_delivery === 'deferred';
  let state = 'complete';
  if (missingFields.length || missingTerms.length) state = 'incomplete';
  if (dependency.require_full_body === true && bodyDeferred) state = 'deferred';
  return {
    judgment_id: dependency.judgment_id,
    dependency_id: dependencyId,
    state,
    missing_fields: missingFields,
    missing_terms: missingTerms,
    body_delivery: producer.body_delivery ?? null,
  };
}

function deliveredJudgmentText(outputs) {
  const evidence = collectReadEvidence(outputs);
  const textById = new Map();
  for (const id of evidence.judgments.keys()) textById.set(id, judgmentText(evidence, id));
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

export function evaluateSemantics(
  outputs,
  expectedIds,
  requirements,
  allowDeferred,
  structuredRequirements = [],
) {
  if (!expectedIds.length) {
    return {
      status: 'not_applicable',
      details: [],
      structures: [],
      scope: { expected_judgment_ids: [], active_structured_requirement_ids: [] },
      limitations: [],
    };
  }
  const evidence = collectReadEvidence(outputs);
  const requiredById = new Map(requirements.map((row) => [row.judgment_id, row]));
  const details = [];

  for (const id of expectedIds) {
    const requirement = requiredById.get(id) ?? {
      required_terms: [],
      mandatory_dependency_ids: [],
      mandatory_dependencies: [],
    };
    const entry = evidence.judgments.get(id);
    if (!entry) {
      const catalogDeferred = allowDeferred && evidence.catalogIds.has(id);
      details.push({
        judgment_id: id,
        state: catalogDeferred ? 'deferred' : 'missing',
        body_delivery: null,
        missing_terms: requirement.required_terms,
        missing_dependencies: requirement.mandatory_dependency_ids.filter(
          (dependency) => !evidence.judgments.has(dependency),
        ),
        dependency_details: [],
      });
      continue;
    }

    const text = judgmentText(evidence, id);
    const missingTerms = requirement.required_terms.filter((term) => !text.includes(term));
    const legacyDependencies = (requirement.mandatory_dependency_ids ?? []).map((dependencyId) => ({
      judgment_id: dependencyId,
      id: null,
      required_terms: [],
      require_full_body: false,
    }));
    const dependencies = [...legacyDependencies, ...(requirement.mandatory_dependencies ?? [])];
    const dependencyDetails = dependencies.map((dependency) =>
      evaluateMandatoryDependency(evidence, requirement, dependency),
    );
    const missingDependencies = dependencyDetails
      .filter((row) => row.state === 'missing' || row.state === 'incomplete')
      .map((row) => row.judgment_id);
    const deferredDependencies = dependencyDetails
      .filter((row) => row.state === 'deferred')
      .map((row) => row.judgment_id);
    let state = 'complete';
    if (missingTerms.length || missingDependencies.length) state = 'incomplete';
    if (requirement.require_full_body === true && entry.body_delivery === 'deferred') {
      state = 'deferred';
    }
    if (!missingTerms.length && !missingDependencies.length && deferredDependencies.length) {
      state = 'deferred';
    }
    details.push({
      judgment_id: id,
      state,
      body_delivery: entry.body_delivery ?? null,
      missing_terms: missingTerms,
      missing_dependencies: missingDependencies,
      deferred_dependencies: deferredDependencies,
      dependency_details: dependencyDetails,
    });
  }

  const activeStructured = activeStructuredRequirements(structuredRequirements, expectedIds);
  const deferredOnly =
    allowDeferred &&
    details.every((row) => row.state === 'deferred' || row.state === 'complete') &&
    details.some((row) => row.state === 'deferred');
  const structures = evaluateStructuredRequirements(evidence, activeStructured, deferredOnly);
  const allStates = [...details.map((row) => row.state), ...structures.map((row) => row.state)];
  let status = 'complete';
  if (allStates.some((state) => state === 'incomplete' || state === 'missing')) {
    status = 'incomplete';
  } else if (allStates.some((state) => state === 'deferred')) {
    status = allowDeferred ? 'deferred' : 'incomplete';
  }
  return {
    status,
    details,
    structures,
    missing_structures: structures
      .filter((row) => row.state === 'missing')
      .map(({ role, id, missing_terms }) => ({ role, id, missing_terms })),
    deferred_structures: structures
      .filter((row) => row.state === 'deferred')
      .map(({ role, id }) => ({ role, id })),
    scope: {
      expected_judgment_ids: expectedIds,
      active_structured_requirement_ids: activeStructured.map((row) => `${row.role}:${row.id}`),
    },
    limitations: [
      'Mechanical checks cover declared terms, fixed structural fields and references; they do not establish recommendation quality.',
      'A reduced body passes only when the task oracle does not require its full body and every declared requirement is present.',
    ],
  };
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
    const started = process.hrtime.bigint();
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
    const started = process.hrtime.bigint();
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

  async runExactThenExpand(selectionIds, expandTargetId) {
    const started = process.hrtime.bigint();
    const child = spawn(
      this.cli,
      ['read', this.asset, '--session', '--allow-read', '--view', 'body'],
      {
        cwd: ROOT,
        env: { ...process.env, NO_COLOR: '1' },
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );
    const lines = makeLineQueue(child.stdout);
    const stderr = [];
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    const requestLatencies = [];
    const outputs = [];
    const stdoutLines = [];
    const selection = {
      asset_id: this.options.assetId,
      asset_version: this.options.assetVersion,
      judgment_ids: selectionIds,
    };
    const send = async (request) => {
      const requestStarted = process.hrtime.bigint();
      child.stdin.write(`${JSON.stringify(request)}\n`);
      const line = await lines.next();
      if (line === null) throw new Error('session ended before producing a response');
      requestLatencies.push(Number(process.hrtime.bigint() - requestStarted) / 1e6);
      stdoutLines.push(line);
      const output = JSON.parse(line);
      outputs.push(output);
      return { output, line };
    };

    try {
      const first = await send({
        request_id: `read-cost:${this.options.sampleId}:${this.options.operationId}:${this.options.runIndex}:initial`,
        tuple: this.binding.tuple,
        budget_bytes: this.budget,
        mode: 'exact_selection',
        selection,
        handle: null,
      });
      const content = contentOf(first.output);
      const entries = Array.isArray(content?.closure) ? content.closure : [];
      const target = entries.find(
        (entry) => entry?.role === 'judgment' && targetId(entry) === expandTargetId,
      );
      const handleId =
        target?.handle_id ??
        content?.expansion_handles?.find((handle) => handle?.target?.id === expandTargetId)
          ?.handle_id ??
        null;
      if (!handleId) {
        throw new Error(`exact_selection did not issue a handle for ${expandTargetId}`);
      }
      const expanded = await send({
        request_id: `read-cost:${this.options.sampleId}:${this.options.operationId}:${this.options.runIndex}:expand`,
        tuple: this.binding.tuple,
        budget_bytes: this.budget,
        mode: 'expand',
        selection,
        handle_id: handleId,
      });
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
        stage_outputs: {
          initial: [first.output],
          expand: [expanded.output],
        },
        stage_stdout: {
          initial: `${first.line}\n`,
          expand: `${expanded.line}\n`,
        },
        handle_id: handleId,
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
  const operations = [
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
  for (const task of sample.tasks ?? []) {
    if (task.kind === 'handoff-exact-then-expand') {
      operations.push({
        id: task.id,
        kind: task.kind,
        expected_ids: task.expected_judgment_ids,
        selection: task.selection_judgment_ids,
        expand_target_id: task.expand_judgment_id,
        allow_deferred: false,
        initial_allow_deferred: true,
        views: ['body'],
        model_input_view: 'body',
      });
    }
  }
  return operations;
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
  const requestLatencies = run.request_latencies_ms ?? [];
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
    task_elapsed_ms: run.elapsed_ms,
    first_response_ms: requestLatencies.length ? requestLatencies[0] : run.elapsed_ms,
    subsequent_request_latencies_ms: requestLatencies.slice(1),
    breakdown: outputBreakdown(outputs[0]),
    semantic: evaluateSemantics(
      outputs,
      operation.expected_ids,
      options.sample.semantic_requirements,
      operation.allow_deferred === true,
      options.sample.structured_requirements,
    ),
    initial_semantic:
      run.stage_outputs?.initial === undefined
        ? null
        : evaluateSemantics(
            run.stage_outputs.initial,
            operation.expected_ids,
            options.sample.semantic_requirements,
            operation.initial_allow_deferred === true,
            options.sample.structured_requirements,
          ),
    handle_id: run.handle_id ?? null,
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
  } else if (operation.kind === 'handoff-exact-then-expand') {
    const session = new SessionRunner(cli, asset, binding, budget, {
      view: 'body',
      assetId: sample.asset_id,
      assetVersion: sample.asset_version,
      sampleId: sample.id,
      operationId: operation.id,
      runIndex: repeat,
    });
    run = await session.runExactThenExpand(operation.selection, operation.expand_target_id);
  } else {
    const args = commandArgs(operation, sample, asset, budget, view);
    run = await spawnResult(cli, args, { cwd: ROOT });
    run.outputs = parseOutputs(run.stdout);
  }

  const record = measurementRecord(run, operation, { sample });
  record.tokens = tokenCounts(tokenizer, record.stdout_lines);
  if (run.stage_stdout) {
    record.stages = Object.entries(run.stage_stdout).map(([id, stdout]) => {
      const lines = stdout.split('\n').filter((line) => line.length > 0);
      return {
        id,
        response_count: lines.length,
        projection_scope: lines.length === 1 ? 'single_response' : 'sum_of_responses',
        stdout_bytes: Buffer.byteLength(stdout, 'utf8'),
        projected_stdout_bytes: lines.reduce(
          (sum, line) => sum + Buffer.byteLength(line, 'utf8'),
          0,
        ),
        tokens: tokenCounts(tokenizer, lines),
      };
    });
  }
  return { record, stdout: run.stdout, stderr: run.stderr };
}

async function writeRunArtifacts(runDir, sampleId, operationId, view, repeat, run) {
  const dir = path.join(runDir, 'raw', sampleId);
  await fsp.mkdir(dir, { recursive: true });
  const base = `${operationId}.${view}.run${repeat}`;
  await fsp.writeFile(path.join(dir, `${base}.out`), run.stdout);
  await fsp.writeFile(path.join(dir, `${base}.err`), run.stderr);
}

export function summarizeSemanticRuns(runs) {
  if (!runs.length) return { status: 'not_applicable', details: [] };
  const statuses = runs.map((run) => run.status);
  let status = 'complete';
  if (statuses.every((value) => value === 'not_applicable')) status = 'not_applicable';
  else if (statuses.some((value) => value === 'incomplete' || value === 'missing')) {
    status = 'incomplete';
  } else if (statuses.some((value) => value === 'deferred')) status = 'deferred';
  return {
    status,
    details: runs[0]?.details ?? [],
    structures: runs[0]?.structures ?? [],
    scope: runs[0]?.scope ?? null,
    limitations: runs[0]?.limitations ?? [],
    failed_repeats: runs
      .map((run, index) => ({ ...run, index }))
      .filter((run) => run.status === 'incomplete' || run.status === 'missing')
      .map((run) => run.index),
    deferred_repeats: runs
      .map((run, index) => ({ ...run, index }))
      .filter((run) => run.status === 'deferred')
      .map((run) => run.index),
  };
}

function combineStageRecords(records) {
  const stageCount = records[0]?.stages?.length ?? 0;
  if (!stageCount) return null;
  return Array.from({ length: stageCount }, (_, index) => {
    const stages = records.map((record) => record.stages[index]).filter(Boolean);
    const first = stages[0];
    return {
      id: first.id,
      response_count: first.response_count,
      projection_scope: first.projection_scope,
      stdout_bytes: first.stdout_bytes,
      projected_stdout_bytes: first.projected_stdout_bytes,
      projected_stdout_bytes_samples: latencySummary(
        stages.map((stage) => stage.projected_stdout_bytes),
      ),
      tokens: first.tokens,
    };
  });
}

export function combineRecords(records) {
  const taskElapsed = records.map((record) => record.task_elapsed_ms);
  const firstResponses = records.map((record) => record.first_response_ms);
  const subsequentLatencies = records.flatMap(
    (record) => record.subsequent_request_latencies_ms ?? [],
  );
  const projectedStdoutBytes = records.map((record) => record.projected_stdout_bytes);
  const capturedStdoutBytes = records.map((record) => record.stdout_bytes);
  const semanticRuns = records.map((record, repeat) => ({
    repeat,
    status: record.semantic.status,
    details: record.semantic.details,
    structures: record.semantic.structures,
  }));
  const initialSemanticRuns = records
    .map((record, repeat) =>
      record.initial_semantic
        ? {
            repeat,
            status: record.initial_semantic.status,
            details: record.initial_semantic.details,
            structures: record.initial_semantic.structures,
          }
        : null,
    )
    .filter(Boolean);
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
    semantic: summarizeSemanticRuns(semanticRuns),
    semantic_runs: semanticRuns,
    initial_semantic: initialSemanticRuns.length
      ? summarizeSemanticRuns(initialSemanticRuns)
      : null,
    initial_semantic_runs: initialSemanticRuns,
    stages: combineStageRecords(records),
    handle_id: first.handle_id ?? null,
    tokens: first.tokens,
    task_elapsed_ms: latencySummary(taskElapsed),
    first_response_ms: latencySummary(firstResponses),
    subsequent_request_latencies_ms: subsequentLatencies.length
      ? latencySummary(subsequentLatencies)
      : null,
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
    {
      comparison: 'separate-vs-combined',
      separateId: 'exact-2-separate',
      combinedId: 'exact-2-combined',
      view: 'body',
    },
    {
      comparison: 'separate-vs-combined',
      separateId: 'exact-all-separate',
      combinedId: 'exact-all-combined',
      view: 'body',
    },
    {
      comparison: 'whole-expand-all-vs-exact-all-combined',
      separateId: 'whole-expand-all',
      combinedId: 'exact-all-combined',
      view: 'full',
    },
  ];
  return pairs.map(({ comparison, separateId, combinedId, view }) => {
    const separate = byId.get(separateId)?.views?.[view];
    const combined = byId.get(combinedId)?.views?.[view];
    if (!separate || !combined) {
      return { comparison, view, separate: separateId, combined: combinedId };
    }
    const separateBytes = separate.projected_stdout_bytes ?? separate.stdout_bytes;
    const combinedBytes = combined.projected_stdout_bytes ?? combined.stdout_bytes;
    const saved = separateBytes - combinedBytes;
    return {
      comparison,
      view,
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
    const envelopeView = measurement;
    const semanticLabel = measurement.initial_semantic
      ? `${measurement.initial_semantic.status} → ${measurement.semantic.status}`
      : measurement.semantic.status;
    const failedSuffix = measurement.semantic.failed_repeats?.length
      ? ` (failed repeats: ${measurement.semantic.failed_repeats.join(', ')})`
      : '';
    lines.push(
      `| ${row.sample_id} | ${row.operation_id} | ${view} | ${measurement.response_count} | ` +
        `${measurement.projected_stdout_bytes} | ${measurement.stdout_bytes} | ` +
        `${envelopeView.budget_required_bytes || ''} | ` +
        `${measurement.tokens?.total ?? 'NOT_MEASURED'} | ${measurement.host_model_input} | ` +
        `${semanticLabel}${failedSuffix} | ${row.tool_calls.total} |`,
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
    '| Sample | Operation | Task elapsed median ms | First-response median ms | Later in-session request median ms | Repeats |',
    '| --- | --- | ---: | ---: | ---: | ---: |',
  );
  for (const row of result.results) {
    const measurement = row.views[row.model_input_view];
    if (!measurement) continue;
    lines.push(
      `| ${row.sample_id} | ${row.operation_id} | ${measurement.task_elapsed_ms.median?.toFixed(2) ?? ''} | ` +
        `${measurement.first_response_ms.median?.toFixed(2) ?? ''} | ` +
        `${measurement.subsequent_request_latencies_ms?.median?.toFixed(2) ?? 'n/a'} | ` +
        `${measurement.repeats} |`,
    );
  }
  lines.push(
    '',
    'A fresh process is not a purged OS cache. First-response time starts at process spawn; later requests exclude that startup cost. These are not Host service-level measurements.',
    '',
    '## Multi-select Comparison',
    '',
    '| Sample | Comparison | View | Baseline bytes | Alternative bytes | Saved | Saved % |',
    '| --- | --- | --- | ---: | ---: | ---: | ---: |',
  );
  for (const row of result.comparisons) {
    lines.push(
      `| ${row.sample_id} | ${row.separate} → ${row.combined} (${row.comparison}) | ${row.view} | ${row.separate_bytes ?? ''} | ` +
        `${row.combined_bytes ?? ''} | ${row.saved_bytes ?? ''} | ${row.saved_percent ?? ''} |`,
    );
  }
  lines.push(
    '',
    'Every comparison row uses the same view on both sides. The whole-asset-plus-expansion path and the exact multi-select path are both measured in `full` view.',
    '',
    '## Expansion Stages',
    '',
    '| Sample | Operation | Stage | Responses | Projected bytes | Computed tokens |',
    '| --- | --- | --- | ---: | ---: | ---: |',
  );
  for (const row of result.results) {
    const measurement = row.views[row.model_input_view];
    for (const stage of measurement?.stages ?? []) {
      lines.push(
        `| ${row.sample_id} | ${row.operation_id} | ${stage.id} | ${stage.response_count} | ` +
          `${stage.projected_stdout_bytes} | ${stage.tokens?.total ?? 'NOT_MEASURED'} |`,
      );
    }
  }
  lines.push(
    '',
    '## Envelope Breakdown',
    '',
    '| Sample | Operation | View | Total bytes | Largest envelope fields | Largest content fields |',
    '| --- | --- | --- | ---: | --- | --- |',
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
        `| ${row.sample_id} | ${row.operation_id} | ${view} | ${measurement.stdout_bytes} | ${top} | ${content} |`,
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
      const requestCount =
        operation.kind === 'session'
          ? operation.groups.length
          : operation.kind === 'whole-expand-all'
            ? operation.expected_ids.length + 1
            : operation.kind === 'handoff-exact-then-expand'
              ? 2
              : 1;
      results.push({
        sample_id: sample.id,
        operation_id: operation.id,
        kind: operation.kind,
        expected_judgment_ids: operation.expected_ids,
        allow_deferred: operation.allow_deferred === true,
        model_input_view: operation.model_input_view ?? 'body',
        tool_calls: {
          processes: 1,
          session_requests: requestCount,
          total: requestCount,
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
    manifest_sha256: hashFile(options.manifest),
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
        'Task elapsed, first response from process spawn, and later in-session requests are separate; no OS cache purge was attempted.',
      semantic:
        'Deferred material is complete only after expansion. Mechanical checks cover declared terms and structures, not recommendation quality.',
    },
  };
  await fsp.writeFile(path.join(runDir, 'results.json'), `${JSON.stringify(report, null, 2)}\n`);
  await fsp.writeFile(path.join(runDir, 'results.md'), renderMarkdown(report));
  await fsp.writeFile(
    path.join(runDir, 'environment.json'),
    `${JSON.stringify(environment, null, 2)}\n`,
  );
  console.log(runDir);
  const semanticFailures = results.flatMap((row) =>
    Object.entries(row.views)
      .filter(([, measurement]) => measurement.semantic.status === 'incomplete')
      .map(([view]) => `${row.sample_id}/${row.operation_id}/${view}`),
  );
  if (semanticFailures.length) {
    console.error(`semantic checks failed: ${semanticFailures.join(', ')}`);
    return 1;
  }
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
