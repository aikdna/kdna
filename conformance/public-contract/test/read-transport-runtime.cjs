'use strict';
// PD280: an unchanged accepted Host RC emits the four wire channels. A loopback
// HTTP fault proxy changes individual observations; the same consumer runs in
// Node and real Chrome/WebKit. Remote claims are never used as local authority.
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  assert = require('node:assert/strict'),
  crypto = require('node:crypto');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');
const B = require('./browser-runtime.cjs');
const hash = (b) => crypto.createHash('sha256').update(b).digest('hex');
const canonical = (v) =>
  v && typeof v === 'object'
    ? Array.isArray(v)
      ? '[' + v.map(canonical).join(',') + ']'
      : '{' +
        Object.keys(v)
          .sort()
          .map((k) => JSON.stringify(k) + ':' + canonical(v[k]))
          .join(',') +
        '}'
    : JSON.stringify(v);
function encode(data) {
  if (data.budget)
    data.budget.actual_bytes = String(Buffer.byteLength(canonical(data))).padStart(16, '0');
  if (data.budget && data.status === 'ready') data.budget.required_bytes = data.budget.actual_bytes;
  return Buffer.from(canonical(data));
}
async function exerciseTransport(api, base, fixture, coordinates) {
  const rows = [],
    check = (id, matched, detail) => rows.push({ id, matched: !!matched, detail });
  let serial = 0;
  const request = (kind = 'exact_selection') => ({
    request_id: 'request:transport:' + Math.random(),
    tuple: coordinates.tuple,
    budget_bytes: 1000000,
    mode: kind,
    selection: ['catalog', 'whole_asset'].includes(kind)
      ? null
      : {
          asset_id: coordinates.asset.asset_id,
          asset_version: coordinates.asset.asset_version,
          judgment_id: 'j:0',
        },
    handle: null,
  });
  const context = (url, candidate) => ({
    association_id: 'association:' + Math.random() + ':' + ++serial,
    endpoint_id: 'endpoint:reference',
    session_id: 'session:' + Math.random(),
    endpoint_url: url,
    issued_at_ms: Date.now() - 10,
    expires_at_ms: Date.now() + 60000,
    outbound_request_json: JSON.stringify(candidate),
    correlation: { state: 'validated', request_id: candidate.request_id },
    expected_tuple: JSON.parse(JSON.stringify(coordinates.tuple)),
    expected_asset: JSON.parse(JSON.stringify(coordinates.asset)),
    expected_digests: { ...coordinates.digests },
    expected_snapshot_id: null,
    max_response_bytes: 1000000,
    max_read_ms: 1000,
    admission_response_limit_bytes: 4096,
  });
  const fetchResponse = async (url, candidate) => {
    const form = new FormData();
    form.append('file', new Blob([fixture]), 'transport.kdna');
    form.append('request', JSON.stringify(candidate));
    return fetch(url, { method: 'POST', body: form });
  };
  async function run(
    id,
    route = 'ready',
    changeContext = null,
    changeRequest = null,
    expected = 'accepted',
  ) {
    const candidate = request();
    if (changeRequest) changeRequest(candidate);
    const url = base + '/read?case=' + route,
      c = context(url, candidate);
    if (changeContext) changeContext(c);
    let output, observed;
    try {
      const response = await fetchResponse(url, candidate);
      observed = {
        status: response.status,
        url: response.url,
        headers: Object.fromEntries(response.headers),
      };
      output = await api.transport(response, c);
    } catch (e) {
      output = { status: 'fetch_rejected', error: String(e) };
    }
    check(
      id,
      expected === 'reject' ? output.status !== 'accepted' : output.status === expected,
      output,
    );
    rows[rows.length - 1].http_observed = observed;
    rows[rows.length - 1].context = c;
    rows[rows.length - 1].sent_request_json = JSON.stringify(candidate);
    return { output, c, candidate };
  }
  const ready = await run('actual-host-ready');
  check('ready-positive-channel', ready.output.response?.body?.status === 'ready', ready.output);
  if (ready.output.status === 'accepted') {
    const x = ready.output;
    check(
      'remote-proof-limits',
      x.origin === 'remote' &&
        x.proof_limits.remote_identity === 'NOT_PROVEN' &&
        x.proof_limits.receipt_delivery === 'REMOTE_CLAIM_ONLY' &&
        Object.values(x.capabilities).every((v) => v === false) &&
        Object.isFrozen(x.response.body),
      x.proof_limits,
    );
    check(
      'cannot-be-core-snapshot',
      api.boundary.inspectSnapshot(x) === null &&
        api.boundary.inspectSnapshot(x.response.body) === null,
    );
    check(
      'cannot-be-control-provider',
      api.readRoot.admitReadRequest(ready.candidate, x).channel === 'transport_failure',
    );
    const localWithRemoteHost = await api.readBytes(
      fixture,
      ready.candidate,
      api.embed.createTrustedReadControlProvider(() => ({ admission_response_limit_bytes: 4096 })),
      x,
    );
    check(
      'cannot-be-host-provider',
      localWithRemoteHost.envelope?.status === 'rejected' &&
        localWithRemoteHost.envelope.diagnostics[0].code === 'READ_HOST_CONTEXT_UNTRUSTED',
      localWithRemoteHost,
    );
    const admitted = api.readRoot.admitReadRequest(
      ready.candidate,
      api.embed.createTrustedReadControlProvider(() => ({ admission_response_limit_bytes: 4096 })),
    );
    check('cannot-be-admitted-request', api.readRoot.project(x, x).status === 'rejected');
    check(
      'cannot-be-local-snapshot',
      api.readRoot.project(admitted.admitted_request, x).status === 'rejected',
    );
    const parsed = JSON.parse(JSON.stringify(x));
    check(
      'json-copy-no-brand',
      api.boundary.inspectSnapshot(parsed) === null &&
        api.readRoot.project(parsed, parsed).status === 'rejected',
    );
    const again = await api.transport(await fetchResponse(ready.c.endpoint_url, ready.candidate), {
      ...ready.c,
      session_id: 'different-session',
    });
    check(
      'association-replay-cross-session',
      again.rejection?.code === 'READ_TRANSPORT_ASSOCIATION_REPLAYED',
      again,
    );
  }
  await run('actual-host-content-length', 'valid-content-length');
  const denied = await run('actual-host-rejected', 'denied');
  check(
    'denied-positive-channel',
    denied.output.response?.body?.status === 'rejected',
    denied.output,
  );
  await run('actual-host-catalog', 'ready', null, (r) => {
    r.mode = 'catalog';
    r.selection = null;
  });
  await run('actual-host-whole-asset', 'ready', null, (r) => {
    r.mode = 'whole_asset';
    r.selection = null;
  });
  const admission = await run('actual-host-admission-rejection', 'ready', null, (r) => {
    r.budget_bytes = 'invalid';
  });
  check(
    'admission-positive-channel',
    admission.output.response?.channel === 'admission_rejection',
    admission.output,
  );
  const control = await run('actual-host-no-body-control', 'ready', null, (r) => {
    r.budget_bytes = 0;
  });
  check(
    'control-positive-channel',
    control.output.response?.channel === 'no_body_control' &&
      control.output.response.body === null &&
      control.output.response.byte_length === 0,
    control.output,
  );
  await run(
    'actual-host-admission-no-body',
    'admission-control',
    (c) => {
      c.admission_response_limit_bytes = 0;
    },
    (r) => {
      r.budget_bytes = 'invalid';
    },
  );
  const failure = await run('actual-host-transport-failure', 'delivery-failure');
  check(
    'failure-positive-channel',
    failure.output.response?.channel === 'transport_failure' &&
      failure.output.response.body === null,
    failure.output,
  );
  for (const kind of [
    'status',
    'content-type',
    'code-on-body',
    'encoding',
    'unknown-channel',
    'duplicate-json',
    'whitespace-json',
    'unsorted-json',
    'utf8',
    'bom',
    'unknown-field',
    'receipt-request',
    'receipt-snapshot',
    'request',
    'tuple',
    'asset',
    'digest-A',
    'digest-C',
    'digest-E',
    'selection',
    'handle-A',
    'handle-snapshot',
    'handle-host',
    'body-budget',
    'budget-limit',
    'truncated',
    'stream-error',
    'oversized-declared',
    'excess-stream',
    'depth',
    'array-limit',
    'string-limit',
    'duplicate-escaped-key',
    'nonfinite',
    'header-request',
    'header-session',
    'forged-witness',
    'value-limit',
    'extra-content-length',
    'invalid-content-length',
    'invalid-transfer',
    'semantic-code',
    'required-budget',
    'receipt-delivery',
    'handle-expiry',
    'handle-selection',
    'missing-required',
    'redirect',
  ])
    await run(
      'hostile-' + kind,
      kind,
      kind === 'excess-stream'
        ? (c) => {
            c.max_response_bytes = 100;
          }
        : kind === 'string-limit'
          ? (c) => {
              c.max_response_bytes = 2000000;
            }
          : null,
      null,
      'reject',
    );
  await run(
    'read-timeout',
    'stall',
    (c) => {
      c.max_read_ms = 10;
    },
    null,
    'reject',
  );
  await run(
    'header-only-body',
    'control-body',
    null,
    (r) => {
      r.budget_bytes = 0;
    },
    'reject',
  );
  await run(
    'header-only-cause',
    'control-cause',
    null,
    (r) => {
      r.budget_bytes = 0;
    },
    'reject',
  );
  await run(
    'header-only-status',
    'control-status',
    null,
    (r) => {
      r.budget_bytes = 0;
    },
    'reject',
  );
  await run(
    'context-expired',
    'ready',
    (c) => {
      c.issued_at_ms = 1;
      c.expires_at_ms = 2;
    },
    null,
    'reject',
  );
  await run(
    'context-future',
    'ready',
    (c) => {
      c.issued_at_ms = Date.now() + 30000;
      c.expires_at_ms = Date.now() + 60000;
    },
    null,
    'reject',
  );
  await run(
    'context-ttl',
    'ready',
    (c) => {
      c.expires_at_ms = Date.now() + 1000000;
    },
    null,
    'reject',
  );
  await run(
    'context-unknown-field',
    'ready',
    (c) => {
      c.authorized = true;
    },
    null,
    'reject',
  );
  await run(
    'context-correlation',
    'ready',
    (c) => {
      c.correlation.request_id = 'other';
    },
    null,
    'reject',
  );
  await run(
    'context-endpoint',
    'ready',
    (c) => {
      c.endpoint_url = base + '/different';
    },
    null,
    'reject',
  );
  await run(
    'context-snapshot',
    'ready',
    (c) => {
      c.expected_snapshot_id = 'different';
    },
    null,
    'reject',
  );
  await run(
    'context-digest',
    'ready',
    (c) => {
      c.expected_digests.E = 'sha256:' + '0'.repeat(64);
    },
    null,
    'reject',
  );
  await run(
    'context-request-json-duplicate',
    'ready',
    (c) => {
      c.outbound_request_json = '{"request_id":"a","request_id":"b"}';
    },
    null,
    'reject',
  );
  await run(
    'context-invalid-candidate-ready',
    'ready',
    (c) => {
      c.outbound_request_json = JSON.stringify({
        ...JSON.parse(c.outbound_request_json),
        budget_bytes: 'invalid',
      });
    },
    null,
    'reject',
  );
  await run(
    'context-budget-binding',
    'ready',
    (c) => {
      c.outbound_request_json = JSON.stringify({
        ...JSON.parse(c.outbound_request_json),
        budget_bytes: 999999,
      });
    },
    null,
    'reject',
  );
  await run(
    'context-selection-binding',
    'ready',
    (c) => {
      c.outbound_request_json = JSON.stringify({
        ...JSON.parse(c.outbound_request_json),
        selection: { ...JSON.parse(c.outbound_request_json).selection, judgment_id: 'j:1' },
      });
    },
    null,
    'reject',
  );
  await run(
    'context-admission-limit',
    'ready',
    (c) => {
      c.admission_response_limit_bytes = 1;
    },
    (r) => {
      r.budget_bytes = 'invalid';
    },
    'reject',
  );
  const forgedContext = context(base + '/read?case=ready', request());
  check(
    'duck-response-rejected',
    (
      await api.transport(
        { status: 200, url: forgedContext.endpoint_url, headers: new Headers(), body: null },
        forgedContext,
      )
    ).rejection?.code === 'READ_TRANSPORT_RESPONSE_INVALID',
  );
  const usedCandidate = request(),
    usedURL = base + '/read?case=ready',
    used = await fetchResponse(usedURL, usedCandidate);
  await used.arrayBuffer();
  check(
    'used-response-rejected',
    (await api.transport(used, context(usedURL, usedCandidate))).rejection?.code ===
      'READ_TRANSPORT_RESPONSE_INVALID',
  );
  const forgedClaim = await run('consistent-remote-receipt-is-claim-only', 'unverifiable-receipt');
  if (forgedClaim.output.status === 'accepted')
    check(
      'forged-claim-does-not-authorize',
      forgedClaim.output.proof_limits.remote_authorization === 'NOT_PROVEN' &&
        forgedClaim.output.capabilities.host_witness === false &&
        api.boundary.inspectSnapshot(forgedClaim.output) === null,
    );
  const delayedRequest = request(),
    delayedURL = base + '/read?case=delayed-body',
    delayedResponse = await fetchResponse(delayedURL, delayedRequest),
    delayedContext = context(delayedURL, delayedRequest);
  delayedContext.expires_at_ms = Date.now() + 50;
  const delayed = await api.transport(delayedResponse, delayedContext);
  check(
    'association-expires-during-stream',
    delayed.status === 'rejected' &&
      ['READ_TRANSPORT_TIMEOUT', 'READ_TRANSPORT_ASSOCIATION_STALE'].includes(
        delayed.rejection?.code,
      ),
    delayed,
  );
  const concurrentRequest = request(),
    concurrentURL = base + '/read?case=ready',
    concurrentContext = context(concurrentURL, concurrentRequest);
  const pair = await Promise.all([
    fetchResponse(concurrentURL, concurrentRequest),
    fetchResponse(concurrentURL, concurrentRequest),
  ]);
  const concurrent = await Promise.all(
    pair.map((response) => api.transport(response, concurrentContext)),
  );
  check(
    'same-session-request-concurrent-replay',
    concurrent.filter((x) => x.status === 'accepted').length === 1 &&
      concurrent.filter((x) => x.rejection?.code === 'READ_TRANSPORT_ASSOCIATION_REPLAYED')
        .length === 1,
    concurrent,
  );
  const fresh = await api.transport(
    await fetchResponse(concurrentURL, concurrentRequest),
    context(concurrentURL, concurrentRequest),
  );
  check(
    'same-request-fresh-association-does-not-prove-replay',
    fresh.status === 'accepted' && fresh.proof_limits.network_replay === 'NOT_PROVEN',
    fresh,
  );
  const overrideResponse = await fetchResponse(concurrentURL, concurrentRequest);
  Object.defineProperty(overrideResponse, 'status', {
    get() {
      throw Error('getter must not run');
    },
  });
  check(
    'response-intrinsic-state-only',
    (await api.transport(overrideResponse, context(concurrentURL, concurrentRequest))).status ===
      'accepted',
  );
  const wrongURLResponse = await fetchResponse(concurrentURL, concurrentRequest);
  Object.defineProperty(wrongURLResponse, 'url', { value: base + '/spoof' });
  const wrongURLContext = context(base + '/spoof', concurrentRequest);
  check(
    'own-url-cannot-forge-endpoint',
    (await api.transport(wrongURLResponse, wrongURLContext)).rejection?.code ===
      'READ_TRANSPORT_BINDING_MISMATCH',
  );
  let getters = 0;
  const getterContext = context(concurrentURL, concurrentRequest);
  Object.defineProperty(getterContext, 'session_id', {
    get() {
      getters++;
      return 'other';
    },
  });
  check(
    'context-getter-never-executed',
    (await api.transport({}, getterContext)).rejection?.code === 'READ_TRANSPORT_CONTEXT_INVALID' &&
      getters === 0,
  );
  const counts = {};
  for (let i = 0; i < 4100; i++) {
    const rejected = await api.transport({}, context(concurrentURL, concurrentRequest));
    const code = rejected.rejection?.code;
    counts[code] = (counts[code] ?? 0) + 1;
  }
  check(
    'association-registry-bounded',
    counts.READ_TRANSPORT_ASSOCIATION_CAPACITY > 0 &&
      counts.READ_TRANSPORT_RESPONSE_INVALID > 0 &&
      Object.keys(counts).length === 2,
    counts,
  );
  return rows;
}
async function main() {
  const [runtime, hostRuntime, playwrightEntry, chrome, output] = process.argv.slice(2);
  for (const p of [runtime, hostRuntime, playwrightEntry, chrome, output])
    assert.ok(path.isAbsolute(p));
  fs.mkdirSync(output, { recursive: true });
  fs.mkdirSync(path.join(output, 'fixtures'));
  const req = createRequire(path.join(runtime, 'package.json')),
    api = {
      transport: req('@aikdna/kdna-read/transport').admitReadTransportResponse,
      boundary: req('@aikdna/kdna-core/read-boundary'),
      readRoot: req('@aikdna/kdna-read'),
      embed: req('@aikdna/kdna-read/embedding'),
      readBytes: req('@aikdna/kdna-read/node').readNode,
    };
  const inputs = B.fixtures(runtime, path.join(output, 'fixtures')),
    fixture = fs.readFileSync(inputs.rows[0].path),
    local = await req('@aikdna/kdna-core/node').admitNode(fixture),
    view = api.boundary.inspectSnapshot(local.snapshot);
  assert.ok(view);
  const coordinates = {
    tuple: view.tuple,
    asset: view.asset,
    digests: Object.fromEntries(['A', 'C', 'E'].map((k) => [k, view.digests[k].observed])),
  };
  const bundled = B.bundle(runtime, path.join(output, 'browser.js'), [
    '@aikdna/kdna-read/transport',
  ]);
  const { createKDNAServer } = await import(
    pathToFileURL(path.join(hostRuntime, 'node_modules/@aikdna/kdna-web-server/src/index.js'))
  );
  const policy = ({ snapshot, context }) => ({
    decision: context === 'deny' ? 'deny' : 'allow',
    scope: snapshot.ir.nodes.map((n) => n.id),
    epoch: 'epoch:transport',
    policyId: 'policy:transport',
  });
  // Each fixture Host has an isolated decision history; replay checks retain their caller session/request/association.
  const wires = [],
    errors = [],
    timers = new Set();
  let base;
  const server = http.createServer(async (incoming, outgoing) => {
    try {
      if (incoming.url === '/') {
        outgoing.setHeader('content-type', 'text/html');
        outgoing.end(
          '<!doctype html><title>PD280 transport verification</title><script src="/browser.js"></script>',
        );
        return;
      }
      if (incoming.url === '/browser.js') {
        outgoing.setHeader('content-type', 'text/javascript');
        outgoing.end(fs.readFileSync(path.join(output, 'browser.js')));
        return;
      }
      if (incoming.method === 'GET') {
        outgoing.writeHead(404);
        outgoing.end();
        return;
      }
      const url = new URL(incoming.url, base),
        kind = url.searchParams.get('case'),
        request = new Request(url, {
          method: incoming.method,
          headers: incoming.headers,
          body: incoming,
          duplex: 'half',
        });
      const callHost = createKDNAServer({
        observePolicy: policy,
        hostId: 'host:' + crypto.randomUUID(),
        ...(kind === 'admission-control' ? { admissionResponseBytes: 0 } : {}),
      });
      const response = await callHost.handle(request, {
        operation: 'read',
        context: kind === 'denied' ? 'deny' : 'allow',
        ...(kind === 'delivery-failure' ? { deliverResponse: () => false } : {}),
      });
      let bytes = Buffer.from(await response.arrayBuffer()),
        headers = Object.fromEntries(response.headers),
        status = response.status;
      const original = {
        status,
        headers: { ...headers },
        bytes: bytes.length,
        sha256: hash(bytes),
        base64: bytes.toString('base64'),
      };
      let data = bytes.length ? JSON.parse(bytes) : null;
      const digest = 'sha256:' + '0'.repeat(64);
      switch (kind) {
        case 'redirect':
          status = 307;
          headers = { location: base + '/read?case=ready' };
          bytes = Buffer.alloc(0);
          break;
        case 'valid-content-length':
          headers['content-length'] = String(bytes.length);
          break;
        case 'status':
          status = 201;
          break;
        case 'content-type':
          headers['content-type'] = 'text/plain';
          break;
        case 'code-on-body':
          headers['x-kdna-code'] = 'READ_TRANSPORT_FAILURE';
          break;
        case 'encoding':
          headers['content-encoding'] = 'unknown';
          break;
        case 'unknown-channel':
          headers['x-kdna-channel'] = 'ready';
          break;
        case 'duplicate-json':
          bytes = Buffer.from('{"request_id":"other",' + bytes.toString().slice(1));
          break;
        case 'duplicate-escaped-key':
          bytes = Buffer.from('{"request_\\u0069d":"other",' + bytes.toString().slice(1));
          break;
        case 'whitespace-json':
          bytes = Buffer.from(' ' + bytes);
          break;
        case 'unsorted-json':
          bytes = Buffer.from(JSON.stringify(data, null, 1));
          break;
        case 'utf8':
          bytes = Buffer.from([0xc0, 0xaf]);
          break;
        case 'bom':
          bytes = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), bytes]);
          break;
        case 'unknown-field':
          data.authorized = true;
          bytes = encode(data);
          break;
        case 'receipt-request':
          data.receipt.request_id = 'other';
          bytes = encode(data);
          break;
        case 'receipt-snapshot':
          data.receipt.snapshot_id = 'other';
          bytes = encode(data);
          break;
        case 'request':
          data.request_id = 'other';
          bytes = encode(data);
          break;
        case 'tuple':
          data.tuple.read = 'kdna.read/999.0.0';
          bytes = encode(data);
          break;
        case 'asset':
          data.asset.asset_id = 'other';
          bytes = encode(data);
          break;
        case 'digest-A':
        case 'digest-C':
        case 'digest-E':
          data.digests[kind.slice(-1)].observed = digest;
          bytes = encode(data);
          break;
        case 'selection':
          data.content.selected.judgment_id = 'j:1';
          bytes = encode(data);
          break;
        case 'handle-A':
        case 'handle-snapshot':
        case 'handle-host':
          assert.ok(data.content.expansion_handles.length);
          data.content.expansion_handles[0][
            { 'handle-A': 'A', 'handle-snapshot': 'snapshot_id', 'handle-host': 'host_id' }[kind]
          ] = kind === 'handle-A' ? digest : 'other';
          bytes = encode(data);
          break;
        case 'body-budget':
          data.budget.actual_bytes = '0000000000000000';
          bytes = Buffer.from(canonical(data));
          break;
        case 'budget-limit':
          data.budget.limit_bytes = 999999;
          bytes = encode(data);
          break;
        case 'truncated':
          headers['content-length'] = String(bytes.length);
          bytes = bytes.subarray(0, bytes.length - 1);
          break;
        case 'oversized-declared':
          headers['content-length'] = '8388609';
          break;
        case 'excess-stream':
          delete headers['content-length'];
          break;
        case 'depth':
          bytes = Buffer.from('['.repeat(66) + '0' + ']'.repeat(66));
          break;
        case 'array-limit':
          bytes = Buffer.from('[' + Array(10001).fill('0').join(',') + ']');
          break;
        case 'string-limit':
          bytes = Buffer.from('"' + 'a'.repeat(1048577) + '"');
          break;
        case 'value-limit':
          bytes = Buffer.from(
            '[' +
              Array(21)
                .fill('[' + Array(5000).fill('0').join(',') + ']')
                .join(',') +
              ']',
          );
          break;
        case 'extra-content-length':
          headers['content-length'] = String(bytes.length);
          headers['transfer-encoding'] = 'chunked';
          break;
        case 'invalid-content-length':
          headers['content-length'] = '1, 2';
          break;
        case 'invalid-transfer':
          headers['transfer-encoding'] = 'invented';
          break;
        case 'semantic-code':
          data.diagnostics = [
            { code: 'INVENTED', severity: 'warning', stage: 'host', field: null, subject: null },
          ];
          bytes = encode(data);
          break;
        case 'required-budget':
          data.budget.required_bytes = '0000000000000000';
          bytes = Buffer.from(canonical(data));
          break;
        case 'receipt-delivery':
          data.receipt.delivery = 'not_delivered';
          bytes = encode(data);
          break;
        case 'handle-expiry':
          data.content.expansion_handles[0].expires_at =
            data.content.expansion_handles[0].issued_at;
          bytes = encode(data);
          break;
        case 'handle-selection':
          data.content.expansion_handles[0].selection = {
            ...data.content.expansion_handles[0].selection,
            judgment_id: 'j:1',
          };
          bytes = encode(data);
          break;
        case 'missing-required':
          delete data.receipt;
          bytes = encode(data);
          break;
        case 'nonfinite':
          bytes = Buffer.from('1e999');
          break;
        case 'header-request':
          headers['x-kdna-request-id'] = 'other';
          break;
        case 'header-session':
          headers['x-kdna-session-id'] = 'other';
          break;
        case 'forged-witness':
          data.receipt.witness = { authorized: true };
          bytes = encode(data);
          break;
        case 'control-body':
          bytes = Buffer.from('x');
          break;
        case 'control-cause':
          headers['x-kdna-semantic-cause'] = 'INVENTED';
          break;
        case 'control-status':
          status = 200;
          break;
        case 'unverifiable-receipt':
          data.receipt.decision_id = 'forged-but-unverifiable';
          bytes = encode(data);
          break;
      }
      outgoing.writeHead(status, headers);
      wires.push({
        kind,
        original,
        emitted: {
          status,
          headers,
          bytes: bytes.length,
          sha256: hash(bytes),
          base64: bytes.toString('base64'),
        },
      });
      if (kind === 'delayed-body') {
        outgoing.write(bytes.subarray(0, 1));
        const timer = setTimeout(() => {
          outgoing.end(bytes.subarray(1));
          timers.delete(timer);
        }, 250);
        timers.add(timer);
        return;
      }
      if (kind === 'stall' || kind === 'stream-error') {
        outgoing.write(bytes.subarray(0, 1));
        if (kind === 'stream-error') {
          const timer = setTimeout(() => {
            outgoing.destroy();
            timers.delete(timer);
          }, 20);
          timers.add(timer);
        }
        return;
      }
      if (['truncated', 'oversized-declared'].includes(kind)) {
        outgoing.write(bytes);
        const timer = setTimeout(() => {
          outgoing.destroy();
          timers.delete(timer);
        }, 50);
        timers.add(timer);
        return;
      }
      outgoing.end(bytes);
    } catch (e) {
      errors.push(String(e));
      outgoing.destroy(e);
    }
  });
  const result = {
    started_at: new Date().toISOString(),
    runtime,
    hostRuntime,
    coordinates,
    fixture: inputs.rows[0],
    bundle: bundled,
    node: [],
    browsers: [],
    wires,
    server_errors: errors,
    proof:
      'Actual accepted Host RC -> loopback HTTP -> native fetch Response. Finite transport verification, no network identity or Core revalidation.',
  };
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    base = 'http://127.0.0.1:' + server.address().port;
    result.base = base;
    result.node = await exerciseTransport(api, base, fixture, coordinates);
    const pw = require(playwrightEntry);
    for (const [name, type, options] of [
      ['chrome', pw.chromium, { executablePath: chrome }],
      ['webkit', pw.webkit, {}],
    ]) {
      const browser = await type.launch({
        headless: true,
        downloadsPath: path.join(output, 'downloads-' + name),
        ...options,
      });
      const context = await browser.newContext({ serviceWorkers: 'block' }),
        network = [];
      await context.route('**/*', (route) =>
        route
          .request()
          .url()
          .startsWith(base + '/')
          ? route.continue()
          : route.abort(),
      );
      try {
        const page = await context.newPage();
        page.on('request', (request) => network.push(request.url()));
        await page.goto(base);
        const rows = await page.evaluate(
          async ({ source, base, bytes, coordinates }) => {
            const exercise = (0, eval)('(' + source + ')');
            return exercise(createKDNA(), base, new Uint8Array(bytes), coordinates);
          },
          { source: exerciseTransport.toString(), base, bytes: [...fixture], coordinates },
        );
        result.browsers.push({
          name,
          version: browser.version(),
          rows,
          network,
          network_policy: 'Only loopback test origin; service workers blocked',
        });
      } finally {
        await context.close();
        await browser.close();
      }
    }
  } finally {
    for (const timer of timers) clearTimeout(timer);
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    result.server_closed = true;
    result.ended_at = new Date().toISOString();
    result.failures = [
      ...result.node.filter((x) => !x.matched).map((x) => ({ runtime: 'node', ...x })),
      ...result.browsers.flatMap((b) =>
        b.rows.filter((x) => !x.matched).map((x) => ({ runtime: b.name, ...x })),
      ),
    ];
    result.status = result.failures.length || errors.length ? 'FAIL' : 'MATCH';
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(result, null, 2) + '\n');
  }
  console.log(
    JSON.stringify({
      status: result.status,
      node: result.node.length,
      browsers: result.browsers.map((b) => ({
        name: b.name,
        version: b.version,
        checks: b.rows.length,
      })),
      failures: result.failures,
      server_errors: errors,
      report: path.join(output, 'result.json'),
    }),
  );
  process.exitCode = result.status === 'MATCH' ? 0 : 1;
}
if (require.main === module)
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { exerciseTransport };
