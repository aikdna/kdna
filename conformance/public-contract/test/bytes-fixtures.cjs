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
function blank(tuple, count = 1) {
  const manifest = {
    format_version: tuple.container,
    asset_id: 'asset:bytes',
    asset_uid: 'uid:bytes',
    asset_type: 'fixture',
    title: 'From-zero conformance asset',
    version: '1.0.0',
    judgment_version: '1.0.0',
    created_at: '2026-09-06T00:00:00Z',
    updated_at: '2026-09-06T00:00:00Z',
    compatibility: {
      min_loader_version: '0.23.0',
      profile: tuple.payload_profile,
      profile_version: tuple.payload_version,
    },
    payload: { path: 'payload.kdnab', encoding: 'cbor', encrypted: false },
    runtime: { mandatory_entries: [] },
  };
  const judgments = Array.from({ length: count }, (_, i) => ({
    id: 'j:' + i,
    label: 'Issue ' + i,
    focus: 'Explicit issue ' + i,
    subject: { actor_ids: [], statement: 'Example subject' },
    scope: { statement: 'Bounded scope ' + i },
    result_contract: {
      id: 'result-contract:' + i,
      form: { term: 'value' },
      shape: { kind: 'scalar', scalar_type: 'text' },
      minimum: 1,
      maximum: 1,
      allowed_result_types: [{ term: 'text' }],
    },
    result: {
      contract_ref: 'result-contract:' + i,
      result_type: { term: 'text' },
      value: { kind: 'text', value: 'Authored result ' + i },
    },
  }));
  return {
    manifest,
    payload: {
      profile: tuple.payload_profile,
      profile_version: tuple.payload_version,
      asset: {
        asset_id: manifest.asset_id,
        asset_version: manifest.version,
        judgment_version: manifest.judgment_version,
      },
      actors: [],
      scope: { statement: 'Asset scope' },
      judgments,
    },
  };
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
