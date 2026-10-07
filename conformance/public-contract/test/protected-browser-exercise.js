'use strict';
// Shared actual-browser/Node exercise. All authority and clocks below are
// explicit synthetic embedding policy, never production permission evidence.
async function exerciseProtectedBrowser(api, bytes, plaintext, meta, freshAPI) {
  const B = api.publicEntries['@aikdna/kdna-core/protected-browser'];
  const C = api.publicEntries['@aikdna/kdna-core/protected-sections-browser'];
  const R = api.publicEntries['@aikdna/kdna-read/protected-sections-browser'];
  const rows = [],
    bodies = {};
  const check = (id, ok, detail = null) => {
    rows.push({ id, matched: ok === true, detail });
    if (!ok) throw Error(id + ': ' + JSON.stringify(detail));
  };
  const q = (mode = 'whole_asset', selection = null, handle = null, budget_bytes = 1000000) =>
    JSON.stringify({
      request_id: 'request:browser',
      tuple: meta.tuple,
      budget_bytes,
      mode,
      selection,
      handle,
    });
  const observe = (ctx, extra = {}) =>
    JSON.stringify({
      host_id: 'host:synthetic',
      host_epoch: 'epoch:1',
      decision_id: 'decision:1',
      ...Object.fromEntries(
        [
          'operation_id',
          'capture_id',
          'request_digest',
          'read_intent_digest',
          'request_id',
          'snapshot_id',
          'A',
          'C',
          'E',
          'tuple',
          'asset',
        ].map((k) => [k, ctx.binding[k]]),
      ),
      scope: ctx.projection_scope,
      issued_at: 900,
      expires_at: 2000,
      current_ms: 1000,
      decision: 'allow',
      policy_id: 'policy:synthetic',
      ...extra,
    });
  async function origin(extra = {}, clock = () => 1000) {
    return B.admitProtectedBrowser(
      {
        bytes,
        plaintextPayload: plaintext,
        observation: meta.observation,
        signaturePolicy: meta.policy,
        ...extra,
      },
      { kind: 'local', clock },
    );
  }
  async function open(callback = () => true, clock = () => 1000) {
    const original = await origin({}, clock);
    check('origin-accepted', original.status === 'accepted', original);
    const authority = C.createProtectedPayloadReadAuthorityJson(
      callback,
      JSON.stringify(meta.policy),
    );
    const request = C.admitProtectedPayloadRequestJson(q()).request;
    const start = await C.admitProtectedSectionBrowser(original.snapshot, request, authority);
    check('operation-accepted', start.status === 'accepted', start);
    return { ...start, original, authority };
  }
  function hostFor(s, options = {}) {
    const effects = { sink: 0, delivered: 0, commits: [] };
    const host = R.createTrustedProtectedPayloadHostJson(
      options.observe ?? observe,
      async (body, token) => {
        effects.delivered++;
        if (options.deliver) return options.deliver(body, token, effects);
        const committed = await R.commitProtectedSectionTransport(
          s.operation,
          token,
          options.observeScope ?? observe,
          () => {
            effects.sink++;
            return options.ack === undefined ? true : options.ack;
          },
        );
        effects.commits.push(committed);
        return committed.status === 'committed';
      },
    );
    return { host, effects };
  }
  const read = (s, h, request = s.request, authority = s.authority) =>
    R.readProtectedSectionBrowser(s.operation, request, authority, h);
  const bind = (s, ...args) => C.bindProtectedPayloadRequest(s.operation, q(...args)).request;
  try {
    const before = Array.from(plaintext),
      s = await open(),
      h = hostFor(s);
    check(
      'caller-plaintext-unchanged',
      before.every((x, i) => plaintext[i] === x),
    );
    const whole = await read(s, h.host),
      e = whole.result?.envelope;
    check('whole-ready', e?.status === 'ready', whole);
    check('base-tuple', JSON.stringify(e.tuple) === JSON.stringify(meta.tuple));
    check(
      'honest-verification',
      e.verification.physical_reads === 'none' &&
        e.verification.new_decryption === false &&
        e.verification.disclosure.provenance === 'host_supplied_triple' &&
        e.verification.disclosure.observation_not_authority === true,
    );
    const { asset_id, asset_version } = e.asset;
    const oneSelection = { asset_id, asset_version, judgment_ids: ['j:0'] };
    const catalog = await read(s, h.host, bind(s, 'catalog'));
    check(
      'catalog-complete-origin',
      catalog.result?.envelope.status === 'catalog_only' &&
        catalog.result.envelope.states.interpretation === 'complete',
    );
    const one = await read(s, h.host, bind(s, 'exact_selection', oneSelection));
    check('single-ready', one.result?.envelope.status === 'ready', one);
    const handle = one.result.envelope.content.expansion_handles[0];
    check('single-deferred-handle', !!handle && handle.anchor.kind === 'selection_set');
    const expanded = await read(
      s,
      h.host,
      bind(s, 'expand', handle.anchor.selection, structuredClone(handle)),
    );
    check(
      'expand-ready',
      expanded.result?.envelope.status === 'ready' &&
        expanded.result.envelope.content.expansion_handles.length === 0,
      expanded,
    );
    const selected = bind(s, 'exact_selection', {
      asset_id,
      asset_version,
      judgment_ids: ['j:1', 'j:0', 'j:0'],
    });
    check(
      'selection-normalization',
      JSON.stringify(C.inspectProtectedPayloadRequest(selected).selection.judgment_ids) ===
        '["j:0","j:1"]',
    );
    const set = await read(s, h.host, selected);
    check('set-ready', set.result?.envelope.status === 'ready', set);
    const view = C.inspectProtectedPayloadSnapshot(s.snapshot);
    const wanted = new Set(
      view.ir.mandatory_closures
        .filter((x) => ['j:0', 'j:1'].includes(x.selection.judgment_id))
        .flatMap((x) => x.node_ids),
    );
    check(
      'set-original-closure-order',
      JSON.stringify(set.result.envelope.content.closure.map((x) => x.id)) ===
        JSON.stringify(view.ir.nodes.filter((x) => wanted.has(x.id)).map((x) => x.id)),
    );
    check('full-ir-node-parity', JSON.stringify(view.ir) === JSON.stringify(meta.node_ir));
    // Compare authored projection data as exact canonical bytes. Operation,
    // Host and handle identities belong to different admissions; the browser
    // set-selection adapter is separately checked above.
    const canonical = (x) =>
      Array.isArray(x)
        ? '[' + x.map(canonical).join(',') + ']'
        : x && typeof x === 'object'
          ? '{' +
            Object.keys(x)
              .sort()
              .map((k) => JSON.stringify(k) + ':' + canonical(x[k]))
              .join(',') +
            '}'
          : JSON.stringify(x);
    const stableContent = (content) =>
      Object.fromEntries(
        [
          'declarations',
          'catalog',
          'closure',
          'references',
          'relationships',
          'missing',
          'provenance',
          'asset_capability',
        ].map((k) => [k, content[k]]),
      );
    for (const [mode, browserContent] of [
      ['whole_asset', e.content],
      ['exact_selection', one.result.envelope.content],
      ['expand', expanded.result.envelope.content],
    ]) {
      check(
        'node-browser-projection-bytes-' + mode,
        canonical(stableContent(browserContent)) ===
          canonical(stableContent(meta.node_contents[mode])),
      );
    }
    check(
      'node-browser-catalog-bytes',
      canonical(catalog.result.envelope.content.catalog) ===
        canonical(meta.node_contents.catalog.catalog),
    );

    check(
      'budget-final-envelope',
      new TextEncoder().encode(JSON.stringify(e, Object.keys(e).sort())).length > 0 &&
        Number(e.budget.actual_bytes) ===
          new TextEncoder().encode(
            (function canonical(x) {
              if (Array.isArray(x)) return '[' + x.map(canonical).join(',') + ']';
              if (x && typeof x === 'object')
                return (
                  '{' +
                  Object.keys(x)
                    .sort()
                    .map((k) => JSON.stringify(k) + ':' + canonical(x[k]))
                    .join(',') +
                  '}'
                );
              return JSON.stringify(x);
            })(e),
          ).length,
    );
    const small = await read(s, h.host, bind(s, 'whole_asset', null, null, 0));
    check('zero-budget-no-body', small.result?.channel === 'no_body_control');
    bodies.whole = e.content;
    bodies.single = one.result.envelope.content;
    bodies.expand = expanded.result.envelope.content;
    const foreign = freshAPI().publicEntries['@aikdna/kdna-core/protected-sections-browser'];
    check(
      'foreign-core-origin-rejected',
      (
        await foreign.admitProtectedSectionBrowser(
          s.original.snapshot,
          foreign.admitProtectedPayloadRequestJson(q()).request,
          foreign.createProtectedPayloadReadAuthorityJson(() => true),
        )
      ).status === 'protection_failed',
    );
    check(
      'copied-origin-rejected',
      (
        await C.admitProtectedSectionBrowser(
          structuredClone(s.original.snapshot),
          C.admitProtectedPayloadRequestJson(q()).request,
          s.authority,
        )
      ).status === 'protection_failed',
    );
    check(
      'consumed-origin-rejected',
      (
        await C.admitProtectedSectionBrowser(
          s.original.snapshot,
          C.admitProtectedPayloadRequestJson(q()).request,
          s.authority,
        )
      ).status === 'protection_failed',
    );
    let hooks = 0;
    check(
      'json-object-rejected',
      C.admitProtectedPayloadRequestJson(
        new Proxy(
          {},
          {
            ownKeys() {
              hooks++;
              throw Error();
            },
            get() {
              hooks++;
              throw Error();
            },
          },
        ),
      ).channel === 'admission_rejection',
    );
    check('untrusted-object-zero-hooks', hooks === 0);
    const mixed = JSON.parse(q());
    mixed.tuple.container = '0.6.0';
    check(
      'mixed-tuple-rejected',
      C.admitProtectedPayloadRequestJson(JSON.stringify(mixed)).envelope?.diagnostics[0].code ===
        'READ_MIXED_VERSION_TUPLE',
    );
    const bypassHost = api.embed.createTrustedHostReadProvider({
      observe: () => {
        throw Error('protected bypass');
      },
      deliver: () => {
        throw Error('protected bypass delivery');
      },
    });
    const bypass = await api.read(
      s.original.snapshot,
      {
        request_id: 'request:bypass',
        tuple: meta.tuple,
        budget_bytes: 1000000,
        mode: 'whole_asset',
        selection: null,
        handle: null,
      },
      api.embed.createTrustedReadControlProvider(() => ({ admission_response_limit_bytes: 4096 })),
      bypassHost,
    );
    check(
      'ordinary-read-protected-bypass-blocked',
      !['ready', 'catalog_only'].includes(bypass.envelope?.status),
    );
    C.disposeProtectedSectionOperation(s.operation);
    check(
      'dispose-revokes-snapshot-and-request',
      C.inspectProtectedPayloadSnapshot(s.snapshot) === null &&
        C.inspectProtectedPayloadRequest(s.request) === null,
    );
    check('closed-read-rejected', (await read(s, h.host)).status === 'protection_failed');
    for (const kind of ['deny', 'bad-json', 'wrong-binding', 'scope', 'epoch', 'expired']) {
      const x = await open();
      let count = 0;
      const t = hostFor(x, {
        observe: (ctx) => {
          count++;
          if (kind === 'bad-json') return {};
          return observe(
            ctx,
            kind === 'deny'
              ? { decision: 'deny' }
              : kind === 'wrong-binding'
                ? { A: 'sha256:' + '0'.repeat(64) }
                : kind === 'scope'
                  ? { scope: [] }
                  : kind === 'epoch'
                    ? { host_epoch: 'epoch:' + count }
                    : { current_ms: 2000 },
          );
        },
      });
      const result = await read(x, t.host);
      check(
        'host-' + kind + '-rejected',
        result.result?.envelope.status === 'rejected' && t.effects.sink === 0,
        result,
      );
      C.disposeProtectedSectionOperation(x.operation);
    }
    for (const boundary of ['authority', 'host', 'transport']) {
      let release,
        enter,
        block = false;
      const waiting = new Promise((resolve) => {
          enter = resolve;
        }),
        gate = new Promise((resolve) => {
          release = resolve;
        });
      const x = await open(async () => {
        if (block && boundary === 'authority') {
          enter();
          await gate;
        }
        return true;
      });
      const t = hostFor(x, {
        observe: async (ctx) => {
          if (boundary === 'host') {
            enter();
            await gate;
          }
          return observe(ctx);
        },
        observeScope: async (ctx) => {
          if (boundary === 'transport') {
            enter();
            await gate;
          }
          return observe(ctx);
        },
      });
      block = true;
      const pending = read(x, t.host);
      await waiting;
      C.disposeProtectedSectionOperation(x.operation);
      release();
      const result = await pending;
      check(
        'dispose-await-' + boundary,
        ['protection_failed', 'delivery_failed'].includes(result.status) && t.effects.sink === 0,
        result,
      );
    }
    for (const boundary of ['host_handoff', 'read_return']) {
      let phase = '',
        ticks = 0,
        x;
      x = await open(
        (ctx) => {
          phase = ctx.read_intent.operation;
          ticks = 0;
          return true;
        },
        () => {
          if (phase === boundary && ++ticks === 2)
            queueMicrotask(() => C.disposeProtectedSectionOperation(x.operation));
          return 1000;
        },
      );
      const t = hostFor(x),
        result = await read(x, t.host);
      check(
        'dispose-microtask-' + boundary,
        result.status === 'protection_failed' &&
          t.effects.delivered === (boundary === 'host_handoff' ? 0 : 1),
        result,
      );
    }
    for (const boundary of ['host_handoff', 'transport_commit', 'read_return']) {
      let now = 1000;
      const x = await open(
        (ctx) => {
          if (ctx.read_intent.operation === boundary && boundary !== 'transport_commit') now = 3000;
          return true;
        },
        () => now,
      );
      const t = hostFor(x, {
        observeScope: (ctx) => {
          if (boundary === 'transport_commit') now = 3000;
          return observe(ctx);
        },
      });
      const result = await read(x, t.host, bind(x, 'catalog'));
      check(
        'catalog-expiry-' + boundary,
        (boundary === 'host_handoff'
          ? result.result?.envelope.diagnostics[0].code === 'READ_HOST_CONTEXT_EXPIRED'
          : ['protection_failed', 'delivery_failed'].includes(result.status)) &&
          t.effects.sink === (boundary === 'read_return' ? 1 : 0),
        result,
      );
      C.disposeProtectedSectionOperation(x.operation);
    }
    {
      const x = await open();
      let sink = 0,
        nested;
      const t = hostFor(x, {
        deliver: async (_body, token) => {
          const commit = () => {
            sink++;
            nested = R.commitProtectedSectionTransport(x.operation, token, observe, () => {
              sink++;
              return true;
            });
            return true;
          };
          const pair = await Promise.all([
            R.commitProtectedSectionTransport(x.operation, token, observe, commit),
            R.commitProtectedSectionTransport(x.operation, token, observe, commit),
          ]);
          check(
            'concurrent-commit-single-winner',
            pair.filter((r) => r.status === 'committed').length === 1,
          );
          check('reentrant-commit-rejected', (await nested).status === 'delivery_failed');
          return true;
        },
      });
      await read(x, t.host);
      check('commit-side-effect-once', sink === 1);
      C.disposeProtectedSectionOperation(x.operation);
    }
    for (const ack of [
      false,
      Promise.resolve(true),
      {
        then() {
          throw Error('untrusted acknowledgement');
        },
      },
    ]) {
      const x = await open(),
        t = hostFor(x, { ack }),
        result = await read(x, t.host);
      check(
        'commit-unknown-ack',
        result.status === 'delivery_failed' &&
          result.disclosure.external_commit.state === 'outcome_unknown' &&
          t.effects.sink === 1,
        result,
      );
      C.disposeProtectedSectionOperation(x.operation);
    }
    const wrong = await origin({
      observation: {
        ...meta.observation,
        selection: { ...meta.observation.selection, slot: 'other' },
      },
    });
    check(
      'slot-observation-mismatch',
      wrong.diagnostic?.code === 'PROTECTION_OBSERVATION_BINDING_INVALID',
      wrong,
    );
    const missing = await B.admitProtectedBrowser({
      bytes,
      plaintextPayload: plaintext,
      observation: meta.observation,
    });
    check('missing-provider-rejected', missing.status === 'protection_failed');
    return { rows, bodies, failures: rows.filter((x) => !x.matched) };
  } catch (error) {
    return {
      rows,
      bodies,
      failures: [
        ...rows.filter((x) => !x.matched),
        { id: 'exercise-exception', message: String(error?.stack ?? error) },
      ],
    };
  }
}
if (typeof module === 'object') module.exports = { exerciseProtectedBrowser };
