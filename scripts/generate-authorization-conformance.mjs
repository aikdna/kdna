import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const v1 = require('../packages/kdna-core/src/v1');

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exampleMinimal = path.join(repoRoot, 'examples', 'minimal');
const authRoot = path.join(repoRoot, 'conformance', 'authorization');
const fixturesRoot = path.join(authRoot, 'fixtures');
const goldensRoot = path.join(authRoot, 'goldens');
const casesPath = path.join(authRoot, 'cases.json');

const json = (value) => JSON.stringify(value, null, 2) + '\n';

const cases = [
  {
    id: 'public-valid',
    fixture: 'public-valid',
    description: 'Public v1 asset loads immediately through a minimal projection.',
    manifest: { access: 'public' },
    options: {},
    cli_args: [],
  },
  {
    id: 'password-missing',
    fixture: 'password-missing',
    description: 'Licensed password asset requires a password before load.',
    manifest: {
      access: 'licensed',
      entitlement: { profile: 'password', offline: true, revocable: false },
      encryption: {
        profile: 'kdna-password-protected-v1',
        encrypted_entries: ['payload.kdnab'],
      },
      payload: { encrypted: true },
    },
    options: {},
    cli_args: [],
  },
  {
    id: 'password-valid',
    fixture: 'password-valid',
    description: 'Licensed password asset is ready once Core receives a password credential.',
    manifest: {
      access: 'licensed',
      entitlement: { profile: 'password', offline: true, revocable: false },
      encryption: {
        profile: 'kdna-password-protected-v1',
        encrypted_entries: ['payload.kdnab'],
      },
      payload: { encrypted: true },
    },
    options: { hasPassword: true },
    cli_args: ['--has-password'],
  },
  {
    id: 'receipt-missing',
    fixture: 'receipt-missing',
    description: 'Local receipt asset requires an installed receipt before load.',
    manifest: {
      access: 'licensed',
      entitlement: { profile: 'local_receipt', offline: true, revocable: true },
    },
    options: {},
    cli_args: [],
  },
  {
    id: 'receipt-valid',
    fixture: 'receipt-valid',
    description: 'Local receipt asset is ready when external entitlement state is active.',
    manifest: {
      access: 'licensed',
      entitlement: { profile: 'local_receipt', offline: true, revocable: true },
    },
    options: { entitlement: { status: 'active' } },
    cli_args: null,
  },
  {
    id: 'expired-entitlement',
    fixture: 'expired-entitlement',
    description: 'Expired entitlement fails closed and asks the consumer to sync.',
    manifest: {
      access: 'licensed',
      entitlement: { profile: 'local_receipt', offline: true, revocable: true },
    },
    options: { entitlement: { status: 'expired' } },
    cli_args: null,
  },
  {
    id: 'revoked-entitlement',
    fixture: 'revoked-entitlement',
    description: 'Revoked entitlement fails closed.',
    manifest: {
      access: 'licensed',
      entitlement: { profile: 'local_receipt', offline: true, revocable: true },
    },
    options: { entitlement: { status: 'revoked' } },
    cli_args: null,
  },
  {
    id: 'offline-grace-active',
    fixture: 'offline-grace-active',
    description: 'Offline grace can load but returns a warning issue.',
    manifest: {
      access: 'licensed',
      entitlement: { profile: 'local_receipt', offline: true, revocable: true },
    },
    options: { entitlement: { status: 'offline_grace' } },
    cli_args: null,
  },
  {
    id: 'account-required',
    fixture: 'account-required',
    description: 'Account entitlement requires sign-in or activation.',
    manifest: {
      access: 'licensed',
      entitlement: { profile: 'account', offline: false, revocable: true },
    },
    options: {},
    cli_args: [],
  },
  {
    id: 'org-required',
    fixture: 'org-required',
    description: 'Organization entitlement requires organization authorization.',
    manifest: {
      access: 'licensed',
      entitlement: { profile: 'org', offline: false, revocable: true },
    },
    options: {},
    cli_args: [],
  },
  {
    id: 'remote-recognized-not-loaded',
    fixture: 'remote-recognized-not-loaded',
    description: 'Remote asset is recognized but not locally loaded.',
    manifest: {
      access: 'remote',
      runtime: { endpoint: 'https://runtime.example.test/v1/project' },
    },
    options: {},
    cli_args: [],
  },
  {
    id: 'tampered-payload',
    fixture: 'tampered-payload',
    description: 'Payload digest mismatch fails closed with an integrity issue.',
    manifest: { access: 'public' },
    tamperPayloadAfterChecksums: true,
    options: {},
    cli_args: [],
  },
  {
    id: 'unknown-access',
    fixture: 'unknown-access',
    description: 'Unknown access mode fails closed.',
    manifest: { access: 'subscription' },
    options: {},
    cli_args: [],
  },
  {
    id: 'unknown-entitlement-profile',
    fixture: 'unknown-entitlement-profile',
    description: 'Unknown entitlement profile fails closed.',
    manifest: {
      access: 'licensed',
      entitlement: { profile: 'coupon_code', offline: false, revocable: true },
    },
    options: {},
    cli_args: [],
  },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyMinimalFixture(dest) {
  ensureDir(dest);
  for (const name of ['mimetype', 'kdna.json', 'payload.kdnab']) {
    fs.copyFileSync(path.join(exampleMinimal, name), path.join(dest, name));
  }
}

function mergeManifest(base, patch) {
  const next = { ...base, ...patch };
  if (patch.payload) {
    next.payload = { ...base.payload, ...patch.payload };
  }
  return next;
}

function writeFixture(testCase) {
  const fixtureDir = path.join(fixturesRoot, testCase.fixture);
  copyMinimalFixture(fixtureDir);

  const manifestPath = path.join(fixtureDir, 'kdna.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const updated = mergeManifest(manifest, {
    ...testCase.manifest,
    title: `Authorization Fixture: ${testCase.id}`,
    asset_id: `kdna:conformance:authorization:${testCase.id}`,
    asset_uid: `urn:uuid:${stableUuidSuffix(testCase.id)}`,
    asset_type: 'fixture',
    keywords: ['authorization', 'conformance', testCase.id],
  });
  fs.writeFileSync(manifestPath, json(updated));
  fs.writeFileSync(path.join(fixtureDir, 'checksums.json'), json(v1.buildChecksumsV1(fixtureDir)));

  if (testCase.tamperPayloadAfterChecksums) {
    const payloadPath = path.join(fixtureDir, 'payload.kdnab');
    const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
    payload.core.highest_question = `${payload.core.highest_question} (tampered)`;
    fs.writeFileSync(payloadPath, json(payload));
  }

  return fixtureDir;
}

function stableUuidSuffix(id) {
  const hex = Buffer.from(id).toString('hex').padEnd(32, '0').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function normalizePlan(plan, testCase) {
  return {
    ...plan,
    source: {
      ...plan.source,
      path: `<fixture:${testCase.fixture}>`,
    },
  };
}

ensureDir(fixturesRoot);
ensureDir(goldensRoot);

const caseIndex = cases.map((testCase) => {
  const fixtureDir = writeFixture(testCase);
  const plan = normalizePlan(v1.planLoad(fixtureDir, testCase.options), testCase);
  fs.writeFileSync(path.join(goldensRoot, `${testCase.id}.loadplan.json`), json(plan));
  return {
    id: testCase.id,
    description: testCase.description,
    fixture: testCase.fixture,
    options: testCase.options,
    cli_args: testCase.cli_args,
    golden: `goldens/${testCase.id}.loadplan.json`,
  };
});

fs.writeFileSync(casesPath, json({
  schema: 'https://github.com/aikdna/kdna/conformance/authorization/cases.schema.json',
  generated_by: 'scripts/generate-authorization-conformance.mjs',
  note: 'Goldens normalize source.path to <fixture:name> so they are stable across machines.',
  cases: caseIndex,
}));

console.log(`authorization conformance fixtures: ${caseIndex.length}`);
