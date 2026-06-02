import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  inspectKDNA,
  loadKDNA,
  renderForAgent,
  validateKDNA,
  verifyDigest,
  encryptLicensedEntry,
  createLicensedDecryptEntry,
} = require('../packages/kdna-core/src');

const args = process.argv.slice(2);
function argValue(name, fallback = null) {
  const prefixed = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefixed));
  if (inline) return inline.slice(prefixed.length);
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return fallback;
}

const profile = argValue('--profile', 'asset-loader');
const allowedProfiles = new Set(['asset', 'loader', 'runtime', 'registry', 'asset-loader']);
if (!allowedProfiles.has(profile)) {
  console.error(`Unknown conformance profile: ${profile}`);
  console.error(`Allowed profiles: ${Array.from(allowedProfiles).join(', ')}`);
  process.exit(2);
}

const root = path.dirname(fileURLToPath(import.meta.url));
const generated = path.join(root, 'fixtures', 'generated');
fs.mkdirSync(generated, { recursive: true });

function u16(n) {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(n);
  return b;
}

function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  return b;
}

function makeZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const [name, value] of Object.entries(entries)) {
    const nameBuf = Buffer.from(name);
    const data = Buffer.from(value);
    const local = Buffer.concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(data.length),
      u32(data.length),
      u16(nameBuf.length),
      u16(0),
      nameBuf,
      data,
    ]);
    localParts.push(local);
    centralParts.push(
      Buffer.concat([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(data.length),
        u32(data.length),
        u16(nameBuf.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        nameBuf,
      ]),
    );
    offset += local.length;
  }
  const central = Buffer.concat(centralParts);
  const local = Buffer.concat(localParts);
  const eocd = Buffer.concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(centralParts.length),
    u16(centralParts.length),
    u32(central.length),
    u32(local.length),
    u16(0),
  ]);
  return Buffer.concat([local, central, eocd]);
}

const json = (value) => JSON.stringify(value, null, 2);

function minimalEntries(overrides = {}) {
  return {
    mimetype: 'application/vnd.aikdna.kdna+zip',
    'kdna.json': json({
      format: 'kdna',
      format_version: '1.0',
      spec_version: '1.0-rc',
      name: '@example/minimal',
      version: '0.1.0',
      judgment_version: '2026.05',
      access: 'open',
      status: 'experimental',
      description: 'Minimal conformance asset.',
      author: { name: 'KDNA Conformance', id: 'conformance' },
      license: { type: 'CC0-1.0' },
      languages: ['en'],
      default_language: 'en',
      keywords: ['minimal', 'conformance'],
      quality_badge: 'untested',
      risk_level: 'R0',
      ...(overrides.manifest || {}),
    }),
    'KDNA_Core.json': json({
      meta: {
        domain: 'minimal',
        version: '0.1.0',
        created: '2026-05-27',
        purpose: 'Conformance minimal fixture.',
        load_condition: 'always',
        ...(overrides.coreMeta || {}),
      },
      stances: ['Treat .kdna as the canonical asset.'],
      axioms: [
        {
          id: overrides.duplicateId ? 'same' : 'ax_minimal',
          one_sentence: 'Minimal domains must still express a concrete judgment.',
          full_statement:
            'Even the smallest KDNA asset must contain a concrete, inspectable judgment.',
          why: 'Conformance needs a stable load/render target.',
        },
        ...(overrides.duplicateId
          ? [
              {
                id: 'same',
                one_sentence: 'Duplicate IDs must fail.',
                full_statement: 'Duplicate IDs must fail.',
                why: 'References need stable identifiers.',
              },
            ]
          : []),
      ],
      ontology: [],
      frameworks: [],
      core_structure: [],
    }),
    'KDNA_Patterns.json': json({
      meta: {
        domain: overrides.badMeta ? 'other' : 'minimal',
        version: '0.1.0',
        created: '2026-05-27',
        purpose: 'Conformance pattern fixture.',
        load_condition: 'always',
      },
      terminology: { standard_terms: [], banned_terms: [] },
      misunderstandings: [],
      self_check: [
        overrides.badSelfCheck ? 'Be accurate and helpful' : 'Did I preserve the asset boundary?',
      ],
    }),
  };
}

function writeAsset(name, entries) {
  const assetPath = path.join(generated, name);
  fs.writeFileSync(assetPath, makeZip(entries));
  return assetPath;
}

function omit(entries, key) {
  const copy = { ...entries };
  delete copy[key];
  return copy;
}

function withManifest(entries, patch) {
  const copy = { ...entries };
  const manifest = JSON.parse(copy['kdna.json']);
  copy['kdna.json'] = json({ ...manifest, ...patch });
  return copy;
}

const fixtures = {
  minimal: writeAsset('valid-minimal-domain.kdna', minimalEntries()),
  full: writeAsset('valid-full-domain.kdna', {
    ...minimalEntries(),
    'KDNA_Scenarios.json': json({
      meta: {
        domain: 'minimal',
        version: '0.1.0',
        created: '2026-05-27',
        purpose: 'optional fixture',
        load_condition: 'on signal',
      },
      scenarios: [],
    }),
  }),
  missingCore: writeAsset('invalid-missing-core.kdna', omit(minimalEntries(), 'KDNA_Core.json')),
  missingPatterns: writeAsset(
    'invalid-missing-patterns.kdna',
    omit(minimalEntries(), 'KDNA_Patterns.json'),
  ),
  duplicateId: writeAsset('invalid-duplicate-id.kdna', minimalEntries({ duplicateId: true })),
  badMeta: writeAsset('invalid-bad-meta.kdna', minimalEntries({ badMeta: true })),
  missingMimetype: writeAsset('invalid-missing-mimetype.kdna', omit(minimalEntries(), 'mimetype')),
  disallowedKdnaSpec: writeAsset(
    'invalid-disallowed-kdna-spec.kdna',
    withManifest(minimalEntries(), { kdna_spec: '1.0-rc' }),
  ),
  disallowedLanguage: writeAsset(
    'invalid-disallowed-language.kdna',
    withManifest(minimalEntries(), { language: 'en' }),
  ),
  badSelfCheck: writeAsset(
    'invalid-non-yes-no-self-check.kdna',
    minimalEntries({ badSelfCheck: true }),
  ),
};

// ── Licensed fixtures (RFC-0008) ───────────────────────────────────

const TEST_LICENSE_KEY = 'KDNA-TEST-LICENSE-VECTOR-2026';

function licensedManifest() {
  return {
    format: 'kdna',
    format_version: '1.0',
    spec_version: '1.0-rc',
    name: '@example/licensed',
    version: '0.1.0',
    judgment_version: '2026.05',
    access: 'licensed',
    status: 'experimental',
    description: 'Licensed conformance asset.',
    author: { name: 'KDNA Conformance', id: 'conformance' },
    license: { type: 'KCL-1.0' },
    languages: ['en'],
    default_language: 'en',
    keywords: ['licensed', 'conformance'],
    quality_badge: 'untested',
    risk_level: 'R0',
    encryption: {
      profile: 'kdna-licensed-entry-v1',
      encrypted_entries: ['KDNA_Core.json'],
    },
  };
}

const licensedCorePlaintext = json({
  meta: {
    domain: 'licensed',
    version: '0.1.0',
    created: '2026-05-27',
    purpose: 'Conformance licensed fixture.',
    load_condition: 'always',
  },
  stances: ['Licensed judgment stays protected.'],
  axioms: [
    {
      id: 'ax_licensed',
      one_sentence: 'Protected judgment loads in memory.',
      full_statement: 'Protected judgment loads in memory.',
      why: 'Assets can be licensed.',
    },
  ],
  ontology: [],
  frameworks: [],
  core_structure: [],
});

const licensedPatternsPlaintext = json({
  meta: {
    domain: 'licensed',
    version: '0.1.0',
    created: '2026-05-27',
    purpose: 'Conformance pattern fixture.',
    load_condition: 'always',
  },
  terminology: { standard_terms: [], banned_terms: [] },
  misunderstandings: [],
  self_check: ['Did decryption stay in memory?'],
});

const manifestLicensed = licensedManifest();

const licensedCoreEncrypted = json(
  encryptLicensedEntry(licensedCorePlaintext, {
    entryName: 'KDNA_Core.json',
    manifest: manifestLicensed,
    licenseKey: TEST_LICENSE_KEY,
  }),
);

fixtures.licensedValid = writeAsset('valid-licensed-domain.kdna', {
  mimetype: 'application/vnd.aikdna.kdna+zip',
  'kdna.json': json(manifestLicensed),
  'KDNA_Core.json': licensedCoreEncrypted,
  'KDNA_Patterns.json': licensedPatternsPlaintext,
});

// Tamper with ciphertext: decode base64, flip first byte, re-encode
const tamperedEnvelope = JSON.parse(licensedCoreEncrypted);
const tamperedCipher = Buffer.from(tamperedEnvelope.ciphertext, 'base64');
tamperedCipher[0] ^= 0xff;
tamperedEnvelope.ciphertext = tamperedCipher.toString('base64');

fixtures.licensedTampered = writeAsset('invalid-licensed-tampered-ciphertext.kdna', {
  mimetype: 'application/vnd.aikdna.kdna+zip',
  'kdna.json': json(manifestLicensed),
  'KDNA_Core.json': json(tamperedEnvelope),
  'KDNA_Patterns.json': licensedPatternsPlaintext,
});

// App-private envelope (non-canonical extension)
fixtures.appPrivateEnvelope = (() => {
  const assetPath = path.join(generated, 'invalid-app-private-envelope.kdnasealed');
  fs.writeFileSync(assetPath, Buffer.from('NOT_A_KDNA_ASSET'));
  return assetPath;
})();

const inspect = await inspectKDNA(fixtures.minimal, { verify: true });
const expectedInspect = JSON.parse(
  fs.readFileSync(path.join(root, 'fixtures', 'expected', 'minimal-inspect.json'), 'utf8'),
);
assert.equal(inspect.name, expectedInspect.name);
assert.equal(inspect.version, expectedInspect.version);
assert.equal(inspect.access, expectedInspect.access);
assert.equal(inspect.quality_badge, expectedInspect.quality_badge);
assert.equal(inspect.risk_level, expectedInspect.risk_level);
for (const entry of expectedInspect.required_entries)
  assert.ok(inspect.entries.includes(entry), `${entry} missing`);

const validation = await validateKDNA(fixtures.minimal);
assert.equal(validation.ok, true, validation.errors.join('\n'));

const loaded = await loadKDNA(fixtures.full, { profile: 'full' });
assert.equal(loaded.domain.core.meta.domain, 'minimal');
assert.ok(loaded.domain.scenarios);

const prompt = await renderForAgent(fixtures.minimal);
const expectedPrompt = fs
  .readFileSync(path.join(root, 'fixtures', 'expected', 'minimal-prompt-output.txt'), 'utf8')
  .trim();
for (const line of expectedPrompt.split('\n'))
  assert.match(prompt, new RegExp(line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

const digest = await verifyDigest(fixtures.minimal, inspect.asset_digest);
assert.equal(digest.ok, true);

for (const [name, assetPath] of Object.entries({
  missingCore: fixtures.missingCore,
  missingPatterns: fixtures.missingPatterns,
  duplicateId: fixtures.duplicateId,
  badMeta: fixtures.badMeta,
  missingMimetype: fixtures.missingMimetype,
  disallowedKdnaSpec: fixtures.disallowedKdnaSpec,
  disallowedLanguage: fixtures.disallowedLanguage,
})) {
  const result = await validateKDNA(assetPath);
  assert.equal(result.ok, false, `${name} should fail`);
}

const weakSelfCheck = await validateKDNA(fixtures.badSelfCheck);
assert.equal(weakSelfCheck.ok, true);
assert.match(weakSelfCheck.warnings.join('\n'), /yes\/no/i);

// Licensed entry tests (RFC-0008)
const licensedDecrypt = createLicensedDecryptEntry({ licenseKey: TEST_LICENSE_KEY });

const licensedValidation = await validateKDNA(fixtures.licensedValid, {
  requireDecryption: true,
  decryptEntry: licensedDecrypt,
});
assert.equal(licensedValidation.ok, true, licensedValidation.errors.join('\n'));

const licensedLoaded = await loadKDNA(fixtures.licensedValid, {
  profile: 'compact',
  decryptEntry: licensedDecrypt,
});
assert.equal(licensedLoaded.domain.core.meta.domain, 'licensed');
assert.ok(licensedLoaded.context.includes('Protected judgment loads in memory'));

const licensedNoHook = await validateKDNA(fixtures.licensedValid, { requireDecryption: true });
assert.equal(licensedNoHook.ok, false, 'licensed asset without hook must fail');

const wrongDecrypt = createLicensedDecryptEntry({ licenseKey: 'WRONG-KEY' });
const licensedWrongKey = await validateKDNA(fixtures.licensedValid, {
  requireDecryption: true,
  decryptEntry: wrongDecrypt,
});
assert.equal(licensedWrongKey.ok, false, 'licensed asset with wrong key must fail');

const licensedTampered = await validateKDNA(fixtures.licensedTampered, {
  requireDecryption: true,
  decryptEntry: licensedDecrypt,
});
assert.equal(licensedTampered.ok, false, 'tampered ciphertext must fail integrity check');

// App-private envelope rejection
let appPrivateRejected = false;
try {
  await inspectKDNA(fixtures.appPrivateEnvelope);
} catch {
  appPrivateRejected = true;
}
assert.equal(appPrivateRejected, true, 'app-private envelope must be rejected');

fs.writeFileSync(
  path.join(os.tmpdir(), 'kdna-conformance-last-run.json'),
  JSON.stringify(
    {
      ok: true,
      profile,
      certification_level: {
        asset: 'KDNA Asset Compatible',
        loader: 'KDNA Loader Compatible',
        runtime: 'KDNA Runtime Compatible',
        registry: 'KDNA Registry Compatible',
        'asset-loader': 'KDNA Asset + Loader Compatible',
      }[profile],
      generated,
      fixtures: Object.keys(fixtures),
    },
    null,
    2,
  ),
);

console.log(`KDNA conformance suite passed (${profile})`);
