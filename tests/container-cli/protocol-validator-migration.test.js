'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const { compileSchema } = require('../../scripts/validate-app-schemas');
const { checks, runChecks } = require('../../scripts/release-preflight');
const {
  INVALID_RUNTIME_MANIFEST_FIXTURES,
  LOAD_CONTRACT_SCHEMA,
  MANIFEST_SCHEMA,
  PACKAGED_LOAD_CONTRACT_SCHEMA,
  PACKAGED_MANIFEST_SCHEMA,
  RUNTIME_MANIFEST_FIXTURES,
  discoverRuntimeManifestInventory,
  validateProtocolFixtures,
} = require('../../scripts/validate-protocol-fixtures');
const { validateRuntimeContract } = require('../../scripts/validate-runtime-contract');

const repoRoot = path.resolve(__dirname, '..', '..');
const quietLogger = { error() {}, log() {} };

function temporaryDirectory(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-validator-'));
  t.after(() => fs.rmSync(directory, { force: true, recursive: true }));
  return directory;
}

function copyRuntimeExamples(t) {
  const directory = temporaryDirectory(t);
  const examples = path.join(directory, 'app-runtime-contract');
  fs.cpSync(path.join(repoRoot, 'examples', 'app-runtime-contract'), examples, {
    recursive: true,
  });
  return examples;
}

function copyProtocolFixtures(t) {
  const root = temporaryDirectory(t);
  const files = new Set([
    MANIFEST_SCHEMA,
    PACKAGED_MANIFEST_SCHEMA,
    LOAD_CONTRACT_SCHEMA,
    PACKAGED_LOAD_CONTRACT_SCHEMA,
    'registry/domains.json',
    ...RUNTIME_MANIFEST_FIXTURES,
    ...INVALID_RUNTIME_MANIFEST_FIXTURES,
  ]);
  for (const relativePath of files) {
    const target = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(repoRoot, relativePath), target);
  }
  return root;
}

function mutateJson(filePath, mutate) {
  const value = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  mutate(value);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function runtimeFailuresAfter(t, kind, mutate) {
  const exampleDir = copyRuntimeExamples(t);
  const filePath = path.join(exampleDir, `generic-client-${kind}.json`);
  mutateJson(filePath, mutate);
  return validateRuntimeContract({ exampleDir, logger: quietLogger });
}

function corePublishJob(workflow) {
  const match = /^  publish-core:\n([\s\S]*?)(?=^  [a-z0-9-]+:|(?![\s\S]))/mu.exec(workflow);
  assert.ok(match, 'missing publish-core job');
  return match[0];
}

function assertCorePublishValidatorOrder(workflow) {
  const job = corePublishJob(workflow);
  const protocolMatches = [...job.matchAll(/npm run validate:protocol-fixtures/gu)];
  const runtimeMatches = [...job.matchAll(/npm run validate:runtime-contract/gu)];
  assert.equal(
    protocolMatches.length,
    1,
    'Core publish must run the protocol fixture validator once',
  );
  assert.equal(
    runtimeMatches.length,
    1,
    'Core publish must run the Runtime contract validator once',
  );

  const install = job.indexOf('run: npm ci');
  const protocol = protocolMatches[0].index;
  const runtime = runtimeMatches[0].index;
  const prepare = job.indexOf('node scripts/core-release-authority.js prepare');
  const smoke = job.indexOf('node scripts/core-release-authority.js smoke');
  const guard = job.indexOf('node scripts/core-release-authority.js guard');
  const publicationMatches = [
    ...job.matchAll(/node scripts\/core-release-authority\.js publish/gu),
  ];
  assert.equal(
    publicationMatches.length,
    1,
    'Core publish must have one authoritative publication primitive',
  );
  const publication = publicationMatches[0].index;
  assert.ok(protocol > install, 'protocol fixtures must run after the clean install');
  assert.ok(runtime > protocol, 'Runtime contract validation must follow manifest validation');
  assert.ok(prepare > runtime, 'authoritative packing must follow both validators');
  assert.ok(smoke > prepare, 'clean-install smoke must follow authoritative packing');
  assert.ok(guard > smoke, 'the duplicate-publication guard must follow clean-install smoke');
  assert.ok(
    publication > guard,
    'publication must follow validators, authoritative packing, smoke, and its guard',
  );
}

test('runtime contract validator accepts all three current trace/report/feedback triples', () => {
  assert.deepEqual(validateRuntimeContract({ logger: quietLogger }), []);
});

test('runtime contract validator rejects a legacy trace shape', (t) => {
  const exampleDir = copyRuntimeExamples(t);
  const tracePath = path.join(exampleDir, 'generic-authoring-trace.json');
  fs.writeFileSync(
    tracePath,
    JSON.stringify({
      trace_version: '1.0',
      trace_id: 'legacy-authoring-trace',
      timestamp: '2026-07-15T00:00:00Z',
      loaded_package: { domain: '@aikdna/example', version: '1.0.0' },
      generated_judgment: { classification: 'safe' },
      route_result: {
        status: 'LOAD_STRONG_FIT',
        action: 'load',
        selected_domain: '@aikdna/example',
      },
    }),
  );

  const failures = validateRuntimeContract({ exampleDir, logger: quietLogger });
  assert.ok(failures.some((failure) => failure.includes("must have required property 'type'")));
  assert.ok(failures.some((failure) => failure.includes('must NOT have additional properties')));
});

test('runtime cross-links reject mismatched feedback version', (t) => {
  const failures = runtimeFailuresAfter(t, 'feedback', (feedback) => {
    feedback.domain_version = '9.9.9';
  });
  assert.ok(failures.some((failure) => failure.includes('domain_version 9.9.9 does not match')));
});

test('runtime cross-links reject a wrong selected asset', (t) => {
  const failures = runtimeFailuresAfter(t, 'report', (report) => {
    report.route_decision.selected_domain = 'kdna:example:different-asset';
  });
  assert.ok(
    failures.some((failure) =>
      failure.includes('selected_domain kdna:example:different-asset does not match trace asset'),
    ),
  );
});

test('runtime cross-links reject extra unobserved assets', (t) => {
  const failures = runtimeFailuresAfter(t, 'report', (report) => {
    report.loaded_domains.push({ ...report.loaded_domains[0], name: 'kdna:example:unobserved' });
  });
  assert.ok(failures.some((failure) => failure.includes('requires exactly one loaded domain')));
});

test('runtime cross-links reject selected or loaded domains on every non-load route', async (t) => {
  for (const [status, action] of [
    ['SKIP_WEAK_FIT', 'skip'],
    ['ASK_AMBIGUOUS_DOMAIN', 'ask'],
    ['BLOCK_TRUST_FAILED', 'block'],
  ]) {
    await t.test(action, () => {
      const failures = runtimeFailuresAfter(t, 'report', (report) => {
        report.route_decision.status = status;
        report.route_decision.action = action;
      });
      assert.ok(
        failures.some((failure) => failure.includes(`${action} route must set selected_domain`)),
      );
      assert.ok(failures.some((failure) => failure.includes(`${action} route must not report`)));
    });
  }
});

test('runtime cross-links require explicit null selected_domain for non-load routes', (t) => {
  const failures = runtimeFailuresAfter(t, 'report', (report) => {
    report.route_decision.status = 'SKIP_WEAK_FIT';
    report.route_decision.action = 'skip';
    delete report.route_decision.selected_domain;
    report.loaded_domains = [];
  });
  assert.ok(failures.some((failure) => failure.includes('must set selected_domain to null')));
});

test('route-only ask and skip reports validate independently but cannot join an execution triple', async (t) => {
  const validateReport = compileSchema('specs/judgment-report-schema.json');
  for (const [status, action] of [
    ['ASK_AMBIGUOUS_DOMAIN', 'ask'],
    ['SKIP_WEAK_FIT', 'skip'],
  ]) {
    await t.test(action, (t) => {
      const exampleDir = copyRuntimeExamples(t);
      const reportPath = path.join(exampleDir, 'generic-client-report.json');
      mutateJson(reportPath, (report) => {
        report.trace_id = null;
        report.route_decision.status = status;
        report.route_decision.action = action;
        report.route_decision.selected_domain = null;
        report.loaded_domains = [];
      });

      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      assert.equal(validateReport(report), true, JSON.stringify(validateReport.errors, null, 2));

      const failures = validateRuntimeContract({ exampleDir, logger: quietLogger });
      assert.ok(
        failures.some((failure) =>
          failure.includes(
            `${action} route-only report cannot participate in a JudgmentTrace + feedback execution-evidence triple`,
          ),
        ),
      );
    });
  }
});

test('block report cannot link to a completed execution Trace', (t) => {
  const failures = runtimeFailuresAfter(t, 'report', (report) => {
    report.route_decision.status = 'BLOCK_TRUST_FAILED';
    report.route_decision.action = 'block';
    report.route_decision.selected_domain = null;
    report.loaded_domains = [];
  });
  assert.ok(
    failures.some((failure) =>
      failure.includes(
        'block route requires a blocked JudgmentTrace, observed execution_completed',
      ),
    ),
  );
});

test('load report cannot link to a blocked Trace', (t) => {
  const exampleDir = copyRuntimeExamples(t);
  const tracePath = path.join(exampleDir, 'generic-client-trace.json');
  fs.copyFileSync(
    path.join(repoRoot, 'conformance', 'runtime-contract', 'blocked-source-directory-trace.json'),
    tracePath,
  );
  const blockedTrace = JSON.parse(fs.readFileSync(tracePath, 'utf8'));
  mutateJson(path.join(exampleDir, 'generic-client-report.json'), (report) => {
    report.trace_id = blockedTrace.trace_id;
  });
  mutateJson(path.join(exampleDir, 'generic-client-feedback.json'), (feedback) => {
    feedback.trace_id = blockedTrace.trace_id;
  });

  const failures = validateRuntimeContract({ exampleDir, logger: quietLogger });
  assert.ok(
    failures.some((failure) =>
      failure.includes('load route requires an execution JudgmentTrace, observed blocked'),
    ),
  );
});

test('runtime cross-links reject status and action combinations that disagree', (t) => {
  const failures = runtimeFailuresAfter(t, 'report', (report) => {
    report.route_decision.status = 'SKIP_WEAK_FIT';
    report.route_decision.action = 'load';
  });
  assert.ok(failures.some((failure) => failure.includes('does not match status SKIP_WEAK_FIT')));
});

test('runtime cross-links bind every loaded identity and delivery field', async (t) => {
  for (const [field, value] of [
    ['name', 'kdna:example:wrong'],
    ['version', '9.9.9'],
    ['judgment_version', '9.9.9'],
    ['access', 'licensed'],
    ['status', 'not_observed'],
  ]) {
    await t.test(field, () => {
      const failures = runtimeFailuresAfter(t, 'report', (report) => {
        report.loaded_domains[0][field] = value;
      });
      assert.ok(
        failures.some((failure) => failure.includes(`loaded_domains[0].${field}`)),
        `${field} must be cross-checked`,
      );
    });
  }
});

test('runtime cross-links reject invented quality, risk, or source evidence', async (t) => {
  for (const [field, value] of [
    ['quality_badge', 'verified'],
    ['risk_level', 'low'],
    ['source', 'registry'],
  ]) {
    await t.test(field, () => {
      const failures = runtimeFailuresAfter(t, 'report', (report) => {
        report.loaded_domains[0][field] = value;
      });
      assert.ok(failures.some((failure) => failure.includes(`${field} must remain null`)));
    });
  }
});

test('protocol fixture validator accepts the exact authoritative Runtime manifest inventory', () => {
  assert.equal(RUNTIME_MANIFEST_FIXTURES.length, 18);
  assert.equal(INVALID_RUNTIME_MANIFEST_FIXTURES.length, 2);
  assert.equal(
    new Set([...RUNTIME_MANIFEST_FIXTURES, ...INVALID_RUNTIME_MANIFEST_FIXTURES]).size,
    20,
  );
  assert.deepEqual(
    discoverRuntimeManifestInventory(),
    [...RUNTIME_MANIFEST_FIXTURES, ...INVALID_RUNTIME_MANIFEST_FIXTURES].sort(),
  );
  assert.deepEqual(validateProtocolFixtures({ logger: quietLogger }), []);
});

test('protocol fixture validator rejects the removed kdna_version contract', (t) => {
  const root = copyProtocolFixtures(t);
  const schemaPath = path.join(root, MANIFEST_SCHEMA);
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  schema.required = schema.required.filter((field) => field !== 'format_version');
  schema.required.push('kdna_version');
  schema.properties.kdna_version = { const: '1.0' };
  delete schema.properties.format_version;
  const staleSchema = `${JSON.stringify(schema, null, 2)}\n`;
  fs.writeFileSync(schemaPath, staleSchema);
  fs.writeFileSync(path.join(root, PACKAGED_MANIFEST_SCHEMA), staleSchema);

  const errors = validateProtocolFixtures({ root, logger: quietLogger });
  assert.ok(errors.some((error) => error.includes('kdna_version must not be part')));
  assert.ok(errors.some((error) => error.includes('format_version const must be 0.1.0')));
  assert.ok(errors.some((error) => error.includes('format_version must be required')));
});

test('protocol fixture validator rejects a schema that AJV cannot compile', (t) => {
  const root = copyProtocolFixtures(t);
  for (const relativePath of [MANIFEST_SCHEMA, PACKAGED_MANIFEST_SCHEMA]) {
    mutateJson(path.join(root, relativePath), (schema) => {
      schema.type = 'not-a-json-schema-type';
    });
  }
  const errors = validateProtocolFixtures({ root, logger: quietLogger });
  assert.ok(errors.some((error) => error.includes('unable to compile')));
});

test('protocol fixture validator rejects a schema-invalid authoritative fixture', (t) => {
  const root = copyProtocolFixtures(t);
  const fixture = RUNTIME_MANIFEST_FIXTURES[0];
  mutateJson(path.join(root, fixture), (manifest) => {
    manifest.format_version = '9.9.9';
  });
  const errors = validateProtocolFixtures({ root, logger: quietLogger });
  assert.ok(errors.some((error) => error.includes(`${fixture}: invalid against`)));
});

test('protocol fixture validator fails closed when a listed fixture is missing', (t) => {
  const root = copyProtocolFixtures(t);
  const fixture = RUNTIME_MANIFEST_FIXTURES[0];
  fs.rmSync(path.join(root, fixture));
  const errors = validateProtocolFixtures({ root, logger: quietLogger });
  assert.ok(errors.some((error) => error.includes(`${fixture}: unable to read`)));
});

test('protocol fixture validator fails closed on fixture read errors', (t) => {
  const root = copyProtocolFixtures(t);
  const denied = path.join(root, RUNTIME_MANIFEST_FIXTURES[0]);
  const errors = validateProtocolFixtures({
    root,
    logger: quietLogger,
    readFile(filePath) {
      if (filePath === denied) throw new Error('EACCES: permission denied');
      return fs.readFileSync(filePath);
    },
  });
  assert.ok(errors.some((error) => error.includes('EACCES: permission denied')));
});

test('protocol fixture inventory rejects an unclassified Runtime manifest', (t) => {
  const root = copyProtocolFixtures(t);
  const unclassified = 'templates/unclassified-domain/kdna.json';
  const target = path.join(root, unclassified);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, RUNTIME_MANIFEST_FIXTURES[0]), target);

  const errors = validateProtocolFixtures({ root, logger: quietLogger });
  assert.ok(errors.some((error) => error.includes(`unclassified fixture ${unclassified}`)));
});

test('protocol fixture validator requires every declared negative to remain invalid', (t) => {
  const root = copyProtocolFixtures(t);
  const negative = INVALID_RUNTIME_MANIFEST_FIXTURES[0];
  fs.copyFileSync(path.join(root, RUNTIME_MANIFEST_FIXTURES[0]), path.join(root, negative));

  const errors = validateProtocolFixtures({ root, logger: quietLogger });
  assert.ok(errors.some((error) => error.includes(`${negative}: must be rejected`)));
});

test('protocol fixture validator rejects packaged manifest or dependency drift', async (t) => {
  for (const relativePath of [PACKAGED_MANIFEST_SCHEMA, PACKAGED_LOAD_CONTRACT_SCHEMA]) {
    await t.test(relativePath, () => {
      const root = copyProtocolFixtures(t);
      fs.appendFileSync(path.join(root, relativePath), '\n');
      const errors = validateProtocolFixtures({ root, logger: quietLogger });
      assert.ok(errors.some((error) => error.includes('must be byte-for-byte identical')));
    });
  }
});

test('release preflight retains both current protocol validators', () => {
  const validationChecks = checks.filter(
    ([command, args]) => command === 'npm' && args[0] === 'run' && args[1].startsWith('validate:'),
  );
  assert.deepEqual(validationChecks, [
    ['npm', ['run', 'validate:protocol-fixtures']],
    ['npm', ['run', 'validate:runtime-contract']],
  ]);

  const calls = [];
  runChecks(validationChecks, {
    execute(command, args, options) {
      calls.push({ command, args, options });
    },
    logger: quietLogger,
  });
  assert.deepEqual(
    calls.map(({ command, args }) => [command, args]),
    validationChecks,
  );
  assert.ok(calls.every(({ options }) => options.stdio === 'inherit'));
});

test('Core publication cannot bypass either validator or reorder it after authoritative packing', () => {
  const workflowPath = path.join(repoRoot, '.github', 'workflows', 'publish.yml');
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  assert.doesNotThrow(() => assertCorePublishValidatorOrder(workflow));

  for (const command of [
    'npm run validate:protocol-fixtures',
    'npm run validate:runtime-contract',
  ]) {
    assert.throws(
      () => assertCorePublishValidatorOrder(workflow.replace(command, 'npm run omitted-gate')),
      /must run/u,
    );
  }

  const reordered = workflow
    .replace('        run: npm run validate:runtime-contract\n', '')
    .replace(
      '      - name: Verify the retained artifact through a clean install\n',
      '      - run: npm run validate:runtime-contract\n' +
        '      - name: Verify the retained artifact through a clean install\n',
    );
  assert.throws(
    () => assertCorePublishValidatorOrder(reordered),
    /authoritative packing must follow/u,
  );

  const injectedPublish = workflow.replace(
    '      - name: Validate authoritative Runtime manifest fixtures\n',
    '      - run: node scripts/core-release-authority.js publish\n' +
      '      - name: Validate authoritative Runtime manifest fixtures\n',
  );
  assert.throws(
    () => assertCorePublishValidatorOrder(injectedPublish),
    /one authoritative publication primitive/u,
  );
});
