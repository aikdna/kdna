#!/usr/bin/env node
'use strict';
// W14 · D5 — grammar.2 end-to-end on a 150-issue, two-level, real-density asset.
//
// What this runner is: a *measurement* tool. It prints one JSON object of raw
// numbers (bytes, sha256, per-step nanoseconds) and never asserts a PASS, a
// release, or acceptance of anything. It is not wired into a gate.
//
// What the asset is: 150 judgments, 10 roots + 140 children joined by
// `parent_ref` (two levels), each carrying ~26 KiB of authored UTF-8 text spread
// over `focus`, `scope.statement`, `subject.statement` and `result.value.value`.
// The prose is *deterministic synthetic text* — one independent PRNG seed per
// issue over a fixed vocabulary, so it is high-entropy and not a repeated block.
// It measures density, transport and locality. It is not authored content and
// says nothing about semantic quality, judgement or readability.
//
// Usage (the documented environment first):
//   RT=$(cat /tmp/kdna-rt-path.txt)
//   export NODE_PATH="$RT/node_modules"
//   node scripts/public-contract/run-e2e-150.cjs [--out-dir DIR] [--quiet]
//
// The artifact is written to `--out-dir` (default: this work package's impl
// directory), never into the repository tree.

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { inflateRawSync } = require('node:zlib');
const F = require('../../conformance/public-contract/test/bytes-fixtures.cjs');

const repo = path.resolve(__dirname, '../..');
const DEFAULT_OUT = '/Users/aikdna/private/kdna-protocol-research-20260919/impl/agents/w14_d5';
const MIB = 1024 * 1024;
const TRANSPORT_RESPONSE_BYTES = 8 * MIB; // generated resource_limits.entry_bytes / read transport limits.response_bytes

function runtimeRoot() {
  if (process.env.KDNA_PUBLIC_RUNTIME) return process.env.KDNA_PUBLIC_RUNTIME;
  try {
    return fs.readFileSync('/tmp/kdna-rt-path.txt', 'utf8').trim();
  } catch {
    return repo;
  }
}

const RT = runtimeRoot();
const { req, coreDir, readDir } = F.runtime(RT);
const { admitNode } = req('@aikdna/kdna-core/node');
const { inspectSnapshot } = req('@aikdna/kdna-core/read-boundary');
const { readNode } = req('@aikdna/kdna-read/node');
const { createTrustedReadControlProvider, createTrustedHostReadProvider } = req(
  '@aikdna/kdna-read/embedding',
);
const { canonicalJson } = require(path.join(coreDir, 'src/public-contract/strict-input.js'));
const { parseContainer } = require(path.join(coreDir, 'src/public-contract/container.js'));
const { versionTuple: tuple } = require(path.join(coreDir, 'src/public-contract/generated-contract.json'));
const { admitReadRequest } = require(path.join(readDir, 'src/admission.js'));
const { project } = require(path.join(readDir, 'src/project.js'));

const hr = () => process.hrtime.bigint();
const ms = (t0) => Number(process.hrtime.bigint() - t0) / 1e6;
const jsonBytes = (value) => Buffer.byteLength(canonicalJson(value), 'utf8');
const sha256 = (bytes) => 'sha256:' + createHash('sha256').update(bytes).digest('hex');

// ---------------------------------------------------------------------------
// Deterministic synthetic prose with a per-issue seed.
const LEX = [
  '证据', '来源', '检索', '判断', '条件', '边界', '例外', '误用', '范围', '主体',
  '方法', '组件', '候选', '分类', '鉴别', '对比', '权重', '优先级', '阈值', '样本',
  '观测', '推断', '前提', '结论', '规则', '形成', '约束', '风险', '冲突', '一致',
  '缺失', '冗余', '冗余度', '召回', '精度', '分辨率', '语料', '注解', '标签', '锚点',
  '预算', '配额', '时延', '吞吐', '回退', '重试', '幂等', '审计', '回执', '签名',
  '权威', '授权', '披露', '撤回', '撤销', '冻结', '版本', '坐标', '迁移', '兼容',
  '本地', '远程', '宿主', '读取', '投影', '闭包', '折叠', '省略', '批量', '逐条',
  '可复算', '可验证', '不可逆', '有界', '无状态', '确定性', '概率', '分布', '偏置', '方差',
  '审查', '复核', '归档', '发布', '回滚', '降级', '隔离', '限流', '熔断', '补偿',
];
function rng(seed) {
  let s = (seed >>> 0) || 0x9e3779b9;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function trimToBytes(text, bytes) {
  if (Buffer.byteLength(text, 'utf8') <= bytes) return text;
  let out = '', used = 0;
  for (const ch of text) {
    const size = Buffer.byteLength(ch, 'utf8');
    if (used + size > bytes) break;
    out += ch;
    used += size;
  }
  return out;
}
function prose(seed, bytes, lead) {
  const rand = rng(seed);
  const parts = [lead];
  let size = Buffer.byteLength(lead, 'utf8');
  while (size < bytes) {
    const words = [];
    const length = 7 + Math.floor(rand() * 10);
    for (let i = 0; i < length; i++) words.push(LEX[Math.floor(rand() * LEX.length)]);
    const sentence = words.join('') + '。';
    parts.push(sentence);
    size += Buffer.byteLength(sentence, 'utf8');
  }
  const text = trimToBytes(parts.join(''), bytes);
  return text.length === 0 || !/\S/u.test(text) ? lead : text;
}

// Authored text budget per issue: 6 KiB focus + 6 KiB scope + 3 KiB subject +
// 11 KiB result = 26 KiB = 26624 bytes of UTF-8 text.
const PER_ISSUE = { focus: 6144, scope: 6144, subject: 3072, result: 11264 };
const PER_ISSUE_BYTES = PER_ISSUE.focus + PER_ISSUE.scope + PER_ISSUE.subject + PER_ISSUE.result;

function issueText(i) {
  const n = String(i);
  const focus = prose(0x51ed0000 + i, PER_ISSUE.focus, `议题 ${n} 的核心判断：`);
  const scope = prose(0x7a110000 + i, PER_ISSUE.scope, `议题 ${n} 的适用边界：`);
  const subject = prose(0x1b0d0000 + i, PER_ISSUE.subject, `议题 ${n} 的主体：`);
  const result = prose(0x3f290000 + i, PER_ISSUE.result, `议题 ${n} 的结论：`);
  return { focus, scope, subject, result };
}

// 150 issues: 10 roots (0-9) + 140 children (10-149), `parent_ref` one level up.
// `textFor` exists so the same builder can produce a negative control whose
// issues all carry one repeated paragraph (the shortcut the task forbids).
function buildAsset(count, assetId, textFor = issueText) {
  const asset = F.blank(tuple, count, {
    patch(manifest, payload) {
      manifest.asset_id = assetId;
      payload.asset.asset_id = assetId;
      manifest.title = `grammar.2 D5 ${count}-issue density asset`;
      payload.scope.statement = 'D5 end-to-end density and locality fixture';
    },
  });
  const roots = Math.min(10, count);
  let authored = 0;
  asset.payload.judgments.forEach((j, i) => {
    const text = textFor(i);
    j.focus = text.focus;
    j.scope = { ...j.scope, statement: text.scope };
    j.subject = { ...j.subject, statement: text.subject };
    j.result = { ...j.result, value: { kind: 'text', value: text.result } };
    j.label = `Issue ${String(i).padStart(3, '0')}`;
    if (i >= roots) j.parent_ref = 'j:' + ((i - roots) % roots);
    authored +=
      Buffer.byteLength(text.focus, 'utf8') +
      Buffer.byteLength(text.scope, 'utf8') +
      Buffer.byteLength(text.subject, 'utf8') +
      Buffer.byteLength(text.result, 'utf8');
  });
  return { asset, authored };
}

function encode(asset, options = {}) {
  return Buffer.from(F.encode(asset, req, options));
}

// ---------------------------------------------------------------------------
// Host / control providers: synthetic, non-authoritative test authorities. The
// Host authorizes every node of the asset, so the scope filter removes nothing.
function controlProvider() {
  return createTrustedReadControlProvider(() => ({
    admission_response_limit_bytes: TRANSPORT_RESPONSE_BYTES,
  }));
}
function hostProvider() {
  return createTrustedHostReadProvider({
    observe({ request, snapshot }) {
      const view = inspectSnapshot(snapshot);
      const now = Date.now();
      return {
        host_id: 'host:bytes',
        host_epoch: 'epoch:1',
        decision_id: 'decision:' + request.request_id,
        request_id: request.request_id,
        snapshot_id: view.snapshot_id,
        A: view.digests.A.observed,
        C: view.digests.C.observed,
        scope: view.ir.nodes.map((n) => n.id),
        issued_at: now,
        expires_at: now + 60000,
        current_ms: now,
        decision: 'allow',
        policy_id: 'policy:bytes',
      };
    },
  });
}

function readSummary(result) {
  const envelope = result.envelope;
  if (!envelope) {
    return {
      channel: result.channel,
      control: result.control
        ? {
            code: result.control.code,
            semantic_cause: result.control.semantic_cause,
            body_bytes: result.control.body_bytes,
          }
        : null,
    };
  }
  return {
    channel: result.channel,
    status: envelope.status,
    code: envelope.diagnostics?.[0]?.code ?? null,
    envelope_bytes: Number(envelope.budget.actual_bytes),
    envelope_bytes_canonical: jsonBytes(envelope),
    budget_limit: Number(envelope.budget.limit_bytes),
    budget_required: Number(envelope.budget.required_bytes),
    catalog_descriptors: envelope.content?.catalog?.length ?? null,
    asset_capability: envelope.content?.asset_capability ?? null,
    closure_nodes: envelope.content?.closure?.length ?? null,
    omission_records: envelope.omissions.length,
    omission_batch_counts: envelope.omissions
      .filter((o) => o.state === 'explicitly_omitted_batch')
      .map((o) => o.count),
    selected: envelope.content?.selected?.judgment_id ?? null,
  };
}

async function timedRead(bytes, request) {
  const host = hostProvider();
  const t0 = hr();
  const result = await readNode(bytes, request, controlProvider(), host).catch((error) => ({
    transport_failure: { error: String(error && error.message) },
  }));
  return { ms: ms(t0), ...readSummary(result) };
}

// Read-side only: the pure projection, with no Core admission in the timing. This
// isolates the Read work (projection + folding) from the container/payload work so
// the "bytes are O(1) but the traversal is still O(N)" distinction is measurable.
function timedProjection(snapshot, request) {
  const admitted = admitReadRequest(request, controlProvider()).admitted_request;
  const t0 = hr();
  const body = project(admitted, snapshot);
  const duration = ms(t0);
  return {
    ms: duration,
    status: body.status,
    omission_records: body.body?.omissions?.length ?? null,
    omission_batch_counts: (body.body?.omissions ?? [])
      .filter((o) => o.state === 'explicitly_omitted_batch')
      .map((o) => o.count),
    projection_bytes: body.body ? jsonBytes(body.body) : null,
  };
}

// ---------------------------------------------------------------------------
async function main() {
  const argv = process.argv.slice(2);
  const outDir = (() => {
    const at = argv.indexOf('--out-dir');
    return at >= 0 ? path.resolve(argv[at + 1]) : DEFAULT_OUT;
  })();
  const quiet = argv.includes('--quiet');
  fs.mkdirSync(outDir, { recursive: true });
  const report = { runtime_root: RT, out_dir: outDir, tuple };

  // --- 1. the 150-issue, two-level asset ---------------------------------
  const big = buildAsset(150, 'asset:bytes');
  report.authored_text = {
    per_issue_target_bytes: PER_ISSUE_BYTES,
    per_issue_split: PER_ISSUE,
    issues: big.asset.payload.judgments.length,
    total_authored_utf8_bytes: big.authored,
    mean_per_issue_bytes: big.authored / big.asset.payload.judgments.length,
    roots: big.asset.payload.judgments.filter((j) => j.parent_ref === undefined).length,
    children: big.asset.payload.judgments.filter((j) => j.parent_ref !== undefined).length,
  };

  const tEncode = hr();
  const bigBytes = encode(big.asset, { deflate: true });
  report.encode_ms = ms(tEncode);
  const bigFile = path.join(outDir, 'grammar2-150-issues-2levels.kdna');
  fs.writeFileSync(bigFile, bigBytes);
  const entries = parseContainer(bigBytes, (data, max) => inflateRawSync(data, { maxOutputLength: max }));
  report.asset = {
    path: bigFile,
    file_bytes: bigBytes.length,
    sha256: sha256(bigBytes),
    payload_entry_bytes: entries['payload.kdnab'].length,
    manifest_entry_bytes: entries['kdna.json'].length,
    entry_ceiling_bytes: TRANSPORT_RESPONSE_BYTES,
    payload_share_of_8MiB: entries['payload.kdnab'].length / TRANSPORT_RESPONSE_BYTES,
    file_share_of_8MiB: bigBytes.length / TRANSPORT_RESPONSE_BYTES,
  };
  report.asset.payload_sha256 = sha256(entries['payload.kdnab']);

  // --- 2. Core admission (full chain) ------------------------------------
  const tAdmit = hr();
  const admitted = await admitNode(bigBytes);
  report.core_admission = { ms: ms(tAdmit), status: admitted.status };
  if (admitted.status === 'accepted') {
    const view = inspectSnapshot(admitted.snapshot);
    report.core_admission.ir_nodes = view.ir.nodes.length;
    report.core_admission.ir_catalog_descriptors = view.ir.catalog.length;
    report.core_admission.mandatory_closures = view.ir.mandatory_closures.length;
    report.core_admission.ir_digest = view.ir_digest;
    report.core_admission.snapshot_id = view.snapshot_id;
    report.core_admission.deep_subtopic_closure_nodes = view.ir.mandatory_closures.find(
      (c) => c.selection.judgment_id === 'j:149',
    ).node_ids.length;
  } else {
    report.core_admission.carrier_id = admitted.carrier_id;
    report.core_admission.catalog_descriptors = admitted.catalog.length;
  }

  // --- 3. the same 150 issues with an unknown critical semantic ----------
  const carrierAsset = buildAsset(150, 'asset:bytes');
  carrierAsset.asset.payload.extensions = [
    { id: 'ext:unknown-d5', critical: true, definition: 'Unknown critical semantic', value: { kind: 'text', value: 'opaque' } },
  ];
  const carrierBytes = encode(carrierAsset.asset, { deflate: true });
  const tCarrier = hr();
  const carrier = await admitNode(carrierBytes);
  report.carrier_admission = {
    ms: ms(tCarrier),
    status: carrier.status,
    carrier_id: carrier.carrier_id ?? null,
    catalog_descriptors: carrier.catalog?.length ?? null,
    has_snapshot: Object.hasOwn(carrier, 'snapshot'),
    inspect_snapshot: carrier.snapshot === undefined ? null : inspectSnapshot(carrier.snapshot),
    diagnostic: carrier.diagnostics?.[0]?.code ?? null,
  };

  // --- 3b. negative control: one paragraph repeated across every issue ----
  // If the density were faked by repeating a single block, deflate would collapse
  // it. This measures that shortcut on the same builder for comparison.
  const repeated = buildAsset(150, 'asset:bytes-repeat', () => issueText(0));
  const repeatedBytes = encode(repeated.asset, { deflate: true });
  const repeatedFile = path.join(outDir, 'grammar2-150-issues-repeated-control.kdna');
  fs.writeFileSync(repeatedFile, repeatedBytes);
  const repeatedEntries = parseContainer(repeatedBytes, (data, max) =>
    inflateRawSync(data, { maxOutputLength: max }),
  );
  report.repeated_text_control = {
    note: 'every issue carries issue 0 text verbatim — the shortcut this task forbids',
    path: repeatedFile,
    file_bytes: repeatedBytes.length,
    sha256: sha256(repeatedBytes),
    payload_entry_bytes: repeatedEntries['payload.kdnab'].length,
    authored_utf8_bytes: repeated.authored,
    deflate_ratio_vs_per_issue_text:
      repeatedBytes.length / report.asset.file_bytes,
  };

  // --- 4. catalog mode ---------------------------------------------------
  const catalogRequest = F.candidate(tuple, big.asset, 'catalog', null, TRANSPORT_RESPONSE_BYTES);
  report.catalog_mode = await timedRead(bigBytes, catalogRequest);

  // --- 5. exact_selection on a deep second-level sub-issue ---------------
  const deepRequest = F.candidate(tuple, big.asset, 'exact_selection', 'j:149', TRANSPORT_RESPONSE_BYTES);
  report.exact_selection = await timedRead(bigBytes, deepRequest);

  // --- 6. folding on vs off, same asset, same selection ------------------
  delete process.env.KDNA_READ_OMISSION_FOLD;
  report.exact_selection_fold_on = await timedRead(bigBytes, deepRequest);
  report.exact_selection_fold_on_repeats_ms = [];
  for (let i = 0; i < 3; i++)
    report.exact_selection_fold_on_repeats_ms.push((await timedRead(bigBytes, deepRequest)).ms);
  process.env.KDNA_READ_OMISSION_FOLD = '0';
  report.exact_selection_fold_off = await timedRead(bigBytes, deepRequest);
  report.exact_selection_fold_off_repeats_ms = [];
  for (let i = 0; i < 3; i++)
    report.exact_selection_fold_off_repeats_ms.push((await timedRead(bigBytes, deepRequest)).ms);
  report.admit_only_repeats_ms = [];
  for (let i = 0; i < 3; i++) {
    const t = hr();
    await admitNode(bigBytes);
    report.admit_only_repeats_ms.push(ms(t));
  }
  delete process.env.KDNA_READ_OMISSION_FOLD;
  report.projection_fold_on = timedProjection(admitted.snapshot, deepRequest);
  process.env.KDNA_READ_OMISSION_FOLD = '0';
  report.projection_fold_off = timedProjection(admitted.snapshot, deepRequest);
  delete process.env.KDNA_READ_OMISSION_FOLD;

  // --- 7. locality control: the same generator at a smaller issue count --
  const small = buildAsset(30, 'asset:bytes');
  const smallBytes = encode(small.asset, { deflate: true });
  const smallFile = path.join(outDir, 'grammar2-30-issues-2levels-control.kdna');
  fs.writeFileSync(smallFile, smallBytes);
  const smallRequest = F.candidate(tuple, small.asset, 'exact_selection', 'j:29', TRANSPORT_RESPONSE_BYTES);
  report.control_small_asset = {
    path: smallFile,
    file_bytes: smallBytes.length,
    sha256: sha256(smallBytes),
    issues: small.asset.payload.judgments.length,
    total_authored_utf8_bytes: small.authored,
    exact_selection: await timedRead(smallBytes, smallRequest),
  };
  process.env.KDNA_READ_OMISSION_FOLD = '0';
  report.control_small_asset.exact_selection_fold_off = await timedRead(smallBytes, smallRequest);
  delete process.env.KDNA_READ_OMISSION_FOLD;
  const smallAdmitted = await admitNode(smallBytes);
  report.control_small_asset.projection_fold_on = timedProjection(
    smallAdmitted.snapshot,
    smallRequest,
  );
  process.env.KDNA_READ_OMISSION_FOLD = '0';
  report.control_small_asset.projection_fold_off = timedProjection(
    smallAdmitted.snapshot,
    smallRequest,
  );
  delete process.env.KDNA_READ_OMISSION_FOLD;

  // --- 8. budget ladder --------------------------------------------------
  // The ladder reuses one memoized Core admission of the same bytes so that the
  // only thing that changes between rows is the requested budget. Every other
  // measurement above runs the real, uncached chain.
  const ladder = [];
  for (const budget of [
    TRANSPORT_RESPONSE_BYTES, MIB, 256 * 1024, 128 * 1024, 64 * 1024, 53667, 53666, 53665,
    53664, 53663, 53660, 53650, 49152, 32 * 1024, 16 * 1024, 4096, 1024, 900, 849, 848, 847,
    846, 845, 840, 512, 256, 64, 0,
  ]) {
    const host = hostProvider();
    const t0 = hr();
    const result = await readNode(bigBytes, { ...deepRequest, budget_bytes: budget }, controlProvider(), host);
    ladder.push({ budget_bytes: budget, ms: ms(t0), ...readSummary(result) });
  }
  report.budget_ladder = ladder;
  const firstNoBody = ladder.find((row) => row.channel === 'no_body_control');
  const firstRejected = ladder.find((row) => row.status === 'rejected');
  report.budget_findings = {
    ready_envelope_bytes: report.exact_selection_fold_on.envelope_bytes,
    first_rejected_budget: firstRejected ? firstRejected.budget_bytes : null,
    first_rejected_required_bytes: firstRejected ? firstRejected.budget_required : null,
    first_no_body_control_budget: firstNoBody ? firstNoBody.budget_bytes : null,
    first_no_body_control_control_bytes: firstNoBody ? firstNoBody.control.body_bytes : null,
  };

  const text = JSON.stringify(report, null, 2);
  const reportFile = path.join(outDir, 'e2e-150.json');
  fs.writeFileSync(reportFile, text + '\n');
  if (!quiet) console.log(text);
  process.stderr.write(`wrote ${reportFile}\n`);
}

main().catch((error) => {
  process.stderr.write(String((error && error.stack) || error) + '\n');
  process.exitCode = 1;
});
