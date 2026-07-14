'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const core = require('../src');
const PACKAGE_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '..', '..');
const golden = core.parseExecutionContractJsonV1(
  fs.readFileSync(path.join(REPO_ROOT, 'conformance', 'runtime-contract-v1', 'golden.json')),
);

function context(overrides = {}) {
  return {
    plan: golden.plan,
    trustedPlanDigest: golden.plan.integrity.plan_digest,
    capabilities: golden.capabilities,
    coreCapsuleVersions: ['2.0', '1.0'],
    request: golden.request,
    receipt: golden.receipt,
    ...overrides,
  };
}

function assertCode(code, callback) {
  assert.throws(callback, (error) => error && error.code === code);
}

test('strict JSON parser matches valid JSON values and preserves protocol number semantics', () => {
  const corpus = [
    '{}',
    '[]',
    'null',
    'true',
    'false',
    '0',
    '-1',
    '1.0',
    '1e+2',
    '1e-2',
    '"\\"\\\\\\/\\b\\f\\n\\r\\t"',
    '"line\u2028paragraph\u2029"',
    '"𝄞"',
    '"\\ud834\\udd1e"',
    '{"outer":{"value":1},"items":[true,null],"same":"same"}',
    ' \t\r\n {"a":1} \n',
  ];
  for (const raw of corpus) {
    assert.deepEqual(core.parseExecutionContractJsonV1(raw), JSON.parse(raw), raw);
  }
  assert.equal(Object.is(core.parseExecutionContractJsonV1('-0'), -0), true);
});

test('strict JSON parser rejects decoded duplicate keys at every object depth', () => {
  const duplicates = [
    '{"a":1,"a":2}',
    '{"a":1,"\\u0061":2}',
    '{"/":1,"\\/":2}',
    '{"𝄞":1,"\\ud834\\udd1e":2}',
    '{"outer":{"a":1,"a":2}}',
    '[{"a":1,"\\u0061":2}]',
  ];
  for (const raw of duplicates) assertCode('KDNA_JSON_DUPLICATE_KEY', () => core.parseExecutionContractJsonV1(raw));
  assert.deepEqual(core.parseExecutionContractJsonV1('{"a":1,"nested":{"a":2}}'), {
    a: 1,
    nested: { a: 2 },
  });
  assert.deepEqual(core.parseExecutionContractJsonV1('{"é":1,"é":2}'), { é: 1, é: 2 });
});

test('strict JSON parser preserves hostile names as own data properties', () => {
  const parsed = core.parseExecutionContractJsonV1(
    '{"__proto__":{"polluted":true},"constructor":1,"prototype":2}',
  );
  assert.equal(Object.getPrototypeOf(parsed), Object.prototype);
  for (const key of ['__proto__', 'constructor', 'prototype']) {
    const descriptor = Object.getOwnPropertyDescriptor(parsed, key);
    assert.equal(descriptor.enumerable, true);
    assert.equal(Object.prototype.hasOwnProperty.call(descriptor, 'value'), true);
  }
  assert.equal(parsed.__proto__.polluted, true);
  assert.equal({}.polluted, undefined);
});

test('strict JSON parser enforces UTF-8, BOM, Unicode scalar, grammar, and finite numbers', () => {
  const invalidUtf8 = [
    [0xc0, 0xaf],
    [0xe2, 0x82],
    [0xed, 0xa0, 0x80],
    [0xf4, 0x90, 0x80, 0x80],
  ];
  for (const bytes of invalidUtf8) {
    assertCode('KDNA_JSON_INVALID_UNICODE', () =>
      core.parseExecutionContractJsonV1(Uint8Array.from(bytes)),
    );
  }
  assertCode('KDNA_JSON_BOM_FORBIDDEN', () =>
    core.parseExecutionContractJsonV1(Buffer.from([0xef, 0xbb, 0xbf, 0x7b, 0x7d])),
  );
  assertCode('KDNA_JSON_BOM_FORBIDDEN', () => core.parseExecutionContractJsonV1('\ufeff{}'));

  for (const raw of ['"\ud800"', '"\udc00"', '"\\ud800"', '"\\udc00"']) {
    assertCode('KDNA_JSON_INVALID_UNICODE', () => core.parseExecutionContractJsonV1(raw));
  }
  for (const code of [0x00, 0x01, 0x1f]) {
    assertCode('KDNA_JSON_SYNTAX_INVALID', () =>
      core.parseExecutionContractJsonV1(`"${String.fromCharCode(code)}"`),
    );
  }
  for (const raw of [
    '',
    '{}{}',
    '{}x',
    '{"a":1,}',
    '[1,]',
    '01',
    '-01',
    '+1',
    '1.',
    '1e',
    'NaN',
    'Infinity',
    '\f{}',
    '\v{}',
    '\u00a0{}',
    '\u0085{}',
  ]) {
    assertCode('KDNA_JSON_SYNTAX_INVALID', () => core.parseExecutionContractJsonV1(raw));
  }
  assertCode('KDNA_JSON_NUMBER_INVALID', () => core.parseExecutionContractJsonV1('1e400'));
  assert.deepEqual(core.parseExecutionContractJsonV1('"\\u0000\\u001f"'), '\u0000\u001f');

  const surrounded = Buffer.from('xx{"a":1}yy');
  assert.deepEqual(core.parseExecutionContractJsonV1(new Uint8Array(surrounded.buffer, surrounded.byteOffset + 2, 7)), { a: 1 });
});

test('strict JSON parser limits bytes and container depth and only allows tightening options', () => {
  const raw = '"你好"';
  assert.equal(Buffer.byteLength(raw), 8);
  assert.equal(core.parseExecutionContractJsonV1(raw, { maxBytes: 8 }), '你好');
  assertCode('KDNA_JSON_LIMIT_EXCEEDED', () =>
    core.parseExecutionContractJsonV1(raw, { maxBytes: 7 }),
  );
  assert.deepEqual(core.parseExecutionContractJsonV1('[1]', { maxDepth: 1 }), [1]);
  assertCode('KDNA_JSON_LIMIT_EXCEEDED', () =>
    core.parseExecutionContractJsonV1('[[]]', { maxDepth: 1 }),
  );
  assert.deepEqual(core.parseExecutionContractJsonV1('[[]]', { maxDepth: 2 }), [[]]);
  assertCode('KDNA_JSON_LIMIT_EXCEEDED', () =>
    core.parseExecutionContractJsonV1('[[[]]]', { maxDepth: 2 }),
  );

  for (const options of [
    null,
    { maxBytes: 0 },
    { maxDepth: -1 },
    { maxDepth: 1.5 },
    { maxDepth: '1' },
    { maxDepth: Infinity },
    { maxDepth: 65 },
    { maxBytes: 2 * 1024 * 1024 + 1 },
    { maxByte: 1 },
    Object.create({ maxDepth: 1 }),
  ]) {
    assertCode('KDNA_JSON_OPTIONS_INVALID', () => core.parseExecutionContractJsonV1('{}', options));
  }
  const accessor = {};
  Object.defineProperty(accessor, 'maxDepth', { get() { throw new Error('must not run'); } });
  assertCode('KDNA_JSON_OPTIONS_INVALID', () => core.parseExecutionContractJsonV1('{}', accessor));
});

test('builders reproduce goldens without mutating independent inputs', () => {
  const input = {
    plan_id: golden.plan.plan_id,
    created_at: golden.plan.created_at,
    task: structuredClone(golden.plan.task),
    asset_ref: structuredClone(golden.plan.asset_ref),
    projection_profile: golden.plan.projection_request.profile,
    budget: structuredClone(golden.plan.budget),
    constraints: structuredClone(golden.plan.constraints),
    trace_policy: structuredClone(golden.plan.trace_policy),
  };
  const before = core.canonicalizeJcs(input);
  const plan = core.buildConsumptionPlanV1(input);
  assert.equal(core.canonicalizeJcs(input), before);
  assert.equal(core.canonicalizeJcs(plan), core.canonicalizeJcs(golden.plan));

  const capsule = structuredClone(golden.request.capsule);
  const capsuleBefore = core.canonicalizeJcs(capsule);
  const request = core.buildAgentHost2RequestV1(
    { request_id: golden.request.request_id, capsule },
    context({ plan }),
  );
  assert.equal(core.canonicalizeJcs(capsule), capsuleBefore);
  assert.equal(core.canonicalizeJcs(request), core.canonicalizeJcs(golden.request));

  const trace = core.buildJudgmentTraceV1(
    {
      trace_id: golden.trace.trace_id,
      timestamp: golden.trace.timestamp,
      overall_status: golden.trace.overall_status,
      errors: golden.trace.errors,
      warnings: golden.trace.warnings,
    },
    context({ plan, request }),
  );
  assert.equal(core.canonicalizeJcs(trace), core.canonicalizeJcs(golden.trace));
});

test('object validators fail closed with stable codes instead of leaking TypeError', () => {
  const cyclic = {};
  cyclic.self = cyclic;
  const getter = {};
  Object.defineProperty(getter, 'type', { enumerable: true, get() { throw new Error('no'); } });
  const values = [null, undefined, [], cyclic, getter, { value: Number.NaN }, new Date()];
  for (const value of values) {
    const results = [
      core.validateConsumptionPlanV1(value, { trustedPlanDigest: null }),
      core.validateAgentHost2RequestV1(value, context()),
      core.validateAgentHost2ReceiptV1(value, { request: golden.request }),
      core.validateJudgmentTraceV1(value, context()),
    ];
    for (const result of results) {
      assert.equal(result.valid, false);
      assert.equal(typeof result.code, 'string');
    }
  }
  assertCode('KDNA_VALIDATION_CONTEXT_INVALID', () =>
    core.buildJudgmentTraceV1(
      { trace_id: 'trace_0123456789abcdef', timestamp: new Date().toISOString(), overall_status: 'blocked' },
      context({ request: null, receipt: golden.receipt }),
    ),
  );
});

test('CJS, ESM, declarations, and packed files expose the execution contract API', async () => {
  const esm = await import('../src/index.mjs');
  const names = [
    'parseExecutionContractJsonV1',
    'computeConsumptionPlanDigestV1',
    'buildConsumptionPlanV1',
    'validateConsumptionPlanV1',
    'negotiateExecutionPairV1',
    'buildAgentHost2RequestV1',
    'validateAgentHost2RequestV1',
    'validateAgentHost2ReceiptV1',
    'deriveBudgetEvidenceV1',
    'buildJudgmentTraceV1',
    'validateJudgmentTraceV1',
  ];
  const declarations = fs.readFileSync(path.join(PACKAGE_ROOT, 'src', 'types.d.ts'), 'utf8');
  for (const name of names) {
    assert.equal(typeof core[name], 'function', `CJS ${name}`);
    assert.equal(typeof esm[name], 'function', `ESM ${name}`);
    assert.match(declarations, new RegExp(`function ${name}\\b`));
  }
  const dryRun = JSON.parse(
    execFileSync('npm', ['pack', '--dry-run', '--json'], {
      cwd: PACKAGE_ROOT,
      encoding: 'utf8',
    }),
  )[0];
  const files = new Set(dryRun.files.map((file) => file.path));
  assert.equal(files.has('src/execution-contract-v1.js'), true);
  for (const schema of [
    'consumption-plan-1.schema.json',
    'agent-host-capabilities-1.schema.json',
    'agent-host-2-request.schema.json',
    'agent-host-2-receipt.schema.json',
    'judgment-trace-1.schema.json',
  ]) {
    assert.equal(files.has(`schema/${schema}`), true, schema);
  }
});

test('TypeScript declarations compile for Plan 1 and Host 2 public calls', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-core-types-'));
  try {
    fs.writeFileSync(
      path.join(tmp, 'check.ts'),
      [
        `import { parseExecutionContractJsonV1, validateConsumptionPlanV1, KDNAConsumptionPlanV1 } from ${JSON.stringify(PACKAGE_ROOT)};`,
        'const value = parseExecutionContractJsonV1("{}");',
        'declare const plan: KDNAConsumptionPlanV1;',
        'const result = validateConsumptionPlanV1(plan, { trustedPlanDigest: null });',
        'if (!result.valid) console.log(result.code, value);',
      ].join('\n'),
    );
    execFileSync(path.join(REPO_ROOT, 'node_modules', '.bin', 'tsc'), [
      '--noEmit',
      '--strict',
      '--skipLibCheck',
      '--moduleResolution',
      'node16',
      '--module',
      'node16',
      '--target',
      'es2022',
      path.join(tmp, 'check.ts'),
    ]);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('npm pack cold install validates Plan 1 with packaged schemas while offline', { timeout: 120000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-core-cold-'));
  try {
    const packOutput = JSON.parse(
      execFileSync('npm', ['pack', '--json', '--pack-destination', tmp], {
        cwd: PACKAGE_ROOT,
        encoding: 'utf8',
      }),
    )[0];
    const tarball = path.join(tmp, packOutput.filename);
    fs.writeFileSync(
      path.join(tmp, 'package.json'),
      JSON.stringify({ private: true, name: 'kdna-core-cold-install', version: '1.0.0' }),
    );
    execFileSync(
      'npm',
      ['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', tarball],
      { cwd: tmp, stdio: 'pipe' },
    );
    fs.writeFileSync(
      path.join(tmp, 'golden.json'),
      JSON.stringify(golden),
    );
    const verify = [
      "const fs = require('node:fs');",
      "const core = require('@aikdna/kdna-core');",
      "const raw = fs.readFileSync('golden.json');",
      'const golden = core.parseExecutionContractJsonV1(raw);',
      'const result = core.validateConsumptionPlanV1(golden.plan, { trustedPlanDigest: golden.plan.integrity.plan_digest });',
      "if (!result.valid) throw new Error(result.code);",
      "if (core.computeConsumptionPlanDigestV1(golden.plan) !== golden.plan.integrity.plan_digest) throw new Error('digest mismatch');",
    ].join('\n');
    execFileSync(process.execPath, ['-e', verify], { cwd: tmp, stdio: 'pipe' });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
