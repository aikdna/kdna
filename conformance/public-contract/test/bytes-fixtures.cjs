'use strict';
const { createRequire } = require('node:module');
const path = require('node:path');
const { deflateRawSync } = require('node:zlib');
function runtime(root) {
  const req = createRequire(path.join(root, 'package.json'));
  return {
    req,
    coreDir: path.dirname(req.resolve('@aikdna/kdna-core/package.json')),
    readDir: path.dirname(req.resolve('@aikdna/kdna-read/package.json')),
  };
}
// A complete current R2 engineering fixture, never a claim of observed use.
// `opts` exists so negative cases can omit required members deliberately:
//   opts.form        -> per-judgment `form` value (default 'conclusion')
//   opts.dropForm    -> omit `form` entirely
//   opts.capability  -> payload `asset_capability` (default derived from forms)
//   opts.dropCapability -> omit `asset_capability` entirely
//   opts.patch       -> (manifest, payload) => void, applied last
function blank(tuple, count = 1, opts = {}) {
  const manifest = {
    format_version: tuple.container,
    asset_id: 'asset:bytes',
    asset_uid: 'uid:bytes',
    asset_type: 'fixture',
    title: 'From-zero conformance asset',
    summary: 'Synthetic asset for isolated contract regression checks.',
    languages: ['en'],
    lineage: [],
    history: { coverage: 'complete', statement: 'Initial engineering fixture only.', entries: [] },
    version: '1.0.0',
    judgment_version: '1.0.0',
    created_at: '2026-09-06T00:00:00Z',
    updated_at: '2026-09-06T00:00:00Z',
    compatibility: {
      min_loader_version: '0.36.0',
      profile: tuple.payload_profile,
      profile_version: tuple.payload_version,
    },
    payload: { path: 'payload.kdnab', encoding: 'cbor', encrypted: false },
    runtime: { mandatory_entries: [] },
  };
  const judgments = Array.from({ length: count }, (_, i) => {
    const judgment = {
      id: 'j:' + i,
      focus: 'Explicit issue ' + i,
      subject: { actor_ids: [], statement: 'Example subject' },
      scope: { statement: 'Bounded scope ' + i },
      answer_kind: 'preference',
      parent_ref: null,
      core_expression: {
        kind: 'authored',
        statement: 'Synthetic authored answer ' + i,
        qualification_refs: [],
      },
      method: {
        method: { term: 'feeling' },
        components: [
          {
            id: 'component:' + i,
            method: { term: 'feeling' },
            role: '个人感受',
            material_refs: [],
            statement: 'Synthetic subjective basis for regression testing.',
          },
        ],
        bindings: [],
      },
      material_refs: [],
      reason_refs: [],
      content_uses: [],
      ports: [],
      inputs: [],
      boundaries: { state: 'none', value: null },
      exceptions: { state: 'none', value: null },
      misuse: { state: 'none', value: null },
      extensions: [],
      result_contract: {
        id: 'result-contract:' + i,
        form: { term: 'scalar', vocabulary: 'core' },
        shape: { kind: 'scalar', scalar_type: 'text' },
        minimum: 1,
        maximum: 1,
        allowed_result_types: [{ term: 'text', vocabulary: 'core' }],
      },
      result: {
        contract_ref: 'result-contract:' + i,
        result_type: { term: 'text', vocabulary: 'core' },
        value: { kind: 'text', value: 'Authored result ' + i },
      },
    };
    if (opts.dropForm !== true) judgment.form = opts.form ?? 'conclusion';
    return judgment;
  });
  const forms = judgments.map((judgment) => judgment.form);
  const derivedCapability = optionsCapability(forms, opts);
  const payload = {
    profile: tuple.payload_profile,
    profile_version: tuple.payload_version,
    asset: {
      asset_id: manifest.asset_id,
      asset_version: manifest.version,
      judgment_version: manifest.judgment_version,
    },
    actors: [],
    scope: { statement: 'Asset scope' },
    declarations: {
      highest_question: { state: 'provided', value: 'What does this engineering fixture declare?' },
      boundaries: { state: 'none', value: null },
    },
    kernel: { purpose: { kind: 'summary' }, foundation_refs: [] },
    contracts: [],
    conditions: [],
    shared_declarations: [],
    materials: [],
    reasons: [],
    sources: [],
    source_uses: [],
    resources: [],
    relationships: [],
    dependencies: [],
    examples: [],
    exceptions: [],
    misuse: [],
    reading_order: judgments.map((j) => j.id),
    extensions: [],
    judgments,
  };
  if (opts.dropCapability !== true) payload.asset_capability = opts.capability ?? derivedCapability;
  const asset = {
    manifest,
    payload,
  };
  if (typeof opts.patch === 'function') opts.patch(manifest, payload);
  return asset;
}

function optionsCapability(forms, opts) {
  if (typeof opts.formCapability === 'string') return opts.formCapability;
  if (forms.length === 0 || forms.some((form) => form !== 'conclusion' && form !== 'rule'))
    return 'asserted_answers';
  const distinct = [...new Set(forms)];
  if (distinct.length === 1)
    return distinct[0] === 'conclusion' ? 'asserted_answers' : 'result_forming_rules';
  return 'mixed';
}
function crc(bytes) {
  let crc = 0xffffffff;
  for (const value of bytes) {
    crc ^= value;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function zip(entries, options = {}) {
  let offset = 0;
  const localParts = [],
    centralParts = [];
  for (const [name, value] of Object.entries(entries)) {
    const n = Buffer.from(name),
      b = Buffer.from(value),
      method = options.deflate && name !== 'mimetype' ? 8 : 0,
      encoded = method === 8 ? deflateRawSync(b) : b,
      c = crc(b),
      local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x800, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(c, 14);
    local.writeUInt32LE(encoded.length, 18);
    local.writeUInt32LE(b.length, 22);
    local.writeUInt16LE(n.length, 26);
    localParts.push(local, n, encoded);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt32LE(c, 16);
    central.writeUInt32LE(encoded.length, 20);
    central.writeUInt32LE(b.length, 24);
    central.writeUInt16LE(n.length, 28);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, n);
    offset += 30 + n.length + encoded.length;
  }
  const central = Buffer.concat(centralParts),
    end = Buffer.alloc(22),
    count = Object.keys(entries).length;
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(count, 8);
  end.writeUInt16LE(count, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, central, end]);
}
function encode(asset, req, options = {}) {
  const { Encoder } = req('cbor-x/index-no-eval');
  return zip(
    {
      mimetype: Buffer.from('application/vnd.kdna.asset'),
      'kdna.json': Buffer.from(options.rawManifest ?? JSON.stringify(asset.manifest)),
      'payload.kdnab':
        options.rawPayload ??
        new Encoder({ useRecords: false, mapsAsObjects: true, structuredClone: false }).encode(
          asset.payload,
        ),
      ...options.entries,
    },
    options,
  );
}
function candidate(tuple, asset, mode = 'exact_selection', id = 'j:0', budget = 1000000) {
  return {
    request_id: 'request:bytes',
    tuple,
    budget_bytes: budget,
    mode,
    selection: ['whole_asset', 'catalog'].includes(mode)
      ? null
      : {
          asset_id: asset.payload.asset.asset_id,
          asset_version: asset.payload.asset.asset_version,
          judgment_id: id,
        },
    handle: null,
  };
}
module.exports = { runtime, blank, crc, zip, encode, candidate };
