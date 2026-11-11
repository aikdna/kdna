# Historical Published Lines

> **Historical Compatibility Reference:** These examples and walkthroughs belong strictly to earlier published package lines (earlier native preview lines, `@aikdna/kdna-cli@0.36.1`, `@aikdna/kdna-core@0.22.0`, and `@aikdna/kdna-studio-cli@0.11.0`). They are preserved here for auditability and reproducible historical verification—never mix them with the current published line (`@aikdna/kdna-cli`, `@aikdna/kdna-core@0.37.10`, `@aikdna/kdna-read@0.13.4`). For current authoring and reading, start at [`../README.md`](../README.md) or [`./start-here.md`](./start-here.md).

---

## 已发布原生 CLI 0.39.0-rc.native-sections.2 的独立路径

下面保留已发布原生线的独立历史示例。可从 npm 取得公开预发布包 `@aikdna/kdna-cli@0.39.0-rc.native-sections.2`，
其精确依赖为 `@aikdna/kdna-core@0.36.0-rc.r2.7` 与
`@aikdna/kdna-read@0.11.0-rc.r2.7`。该组合保留 container `0.6.0` / Read
`0.7.0-candidate` 的原生合同，上述浏览器候选不替换其 Core/Read。包内
[原生交付说明](https://unpkg.com/@aikdna/kdna-cli@0.39.0-rc.native-sections.2/docs/native-delivery.md)
记载冻结的离线依赖图，仍含发布前措辞；registry 安装解析独立依赖图，应保留其生成的 lock。
从包内[作者示例](https://unpkg.com/@aikdna/kdna-cli@0.39.0-rc.native-sections.2/examples/team-update/README.md)
及[可执行原生配方](https://unpkg.com/@aikdna/kdna-cli@0.39.0-rc.native-sections.2/examples/native-workflow.cjs)
开始这条原生创作路径，使用上述已发布 CLI 组合。该 CLI 包未包含专门的原生 Creator 指南，
这条路径使用包内作者示例与配方。Studio 保留独立创作路径。

使用 Node 22，在新目录中运行：

```sh
mkdir kdna-native-example
cd kdna-native-example
npm init -y
npm install --save-exact --ignore-scripts --omit=optional --no-audit --no-fund --registry=https://registry.npmjs.org @aikdna/kdna-cli@0.39.0-rc.native-sections.2
node node_modules/@aikdna/kdna-cli/examples/native-workflow.cjs node_modules/@aikdna/kdna-cli/examples/team-update/author.json ./team-update-output
```

保留生成的 `package-lock.json`，每次运行使用新的输出目录。
这些示例不证明人类确认、Agent 实际任务采用或完整创作到消费接受。

---

## Published CLI 0.36.1 walkthrough

Generate a demonstration for the published line, load its Runtime Capsule,
and then replace the demonstration judgment with your own. This preserves the
published workflow; it is not a current Core/Read quickstart.

This walkthrough is pinned to `@aikdna/kdna-cli@0.36.1`. The
commands below are part of that package's allowlist and were last re-run
against it on 2026-09-13. The current Core/Read pair is the published stable
Core `0.37.10` / Read `0.13.4`.
It has a different asset contract. The current native CLI route also has
different command forms, so this published walkthrough does not select that
new graph. Keep its exact historical dependencies. See
[tool status matrix](./tool-status-matrix.md) for the per-command picture.

```bash
npm install -g @aikdna/kdna-cli@0.36.1

# Step 1: generate and package an asset for this published line
kdna demo judgment ./judgment
kdna pack ./judgment ./judgment.kdna

# Step 2: verify the loading contract and receive a Runtime Capsule
kdna validate ./judgment.kdna --runtime
kdna plan-load ./judgment.kdna --json
kdna load ./judgment.kdna --profile=compact --as=json
```

> **Official package coordinates:** all official npm packages are published
> under the **`@aikdna`** scope (for example `@aikdna/kdna-cli` and
> `@aikdna/kdna-core`). The bare `kdna` name on npm is an unrelated
> third-party placeholder — do not install it. On PyPI, the `kdna` project
> name is likewise an unrelated third-party placeholder, not ours. Our
> official Python distribution on PyPI is **`aikdna`** (the import package
> name remains `kdna`). Install only `aikdna` from PyPI — never
> `pip install kdna`. See [SECURITY.md](../SECURITY.md).

See also the [historical 5-minute guide](./try-kdna.md).

---

## Published Core 0.22.0 signing example

This example belongs only to `@aikdna/kdna-core@0.22.0` and its matching
published-line assets. Install that exact version in a separate project:

```sh
npm install --save-exact @aikdna/kdna-core@0.22.0
```

The current Core root does not export these historical signing APIs; ordinary
admission rejects signed containers. The explicit Node protection entry is a
separate API and does not make this example a current-source recipe. The signing specification and historical vectors remain valid
records of their own version contract.

In the published Core 0.22.0 line, a `.kdna` asset can carry an optional `signature.kdsig` bundle
(`kdsig.ed25519`, [RFC-0021](../rfcs/RFC-0021-signature-track.md) M1). The
Ed25519 signature covers the canonical content digest
([CANONICALIZATION.md](./CANONICALIZATION.md)), verification is fully
offline, and loading is fail-closed: an asset whose signature does not verify
is rejected, never downgraded to "unsigned".

```js
const {
  generateSigningKeyPair,
  signKDNA,
  verifyKDNASignature,
} = require('@aikdna/kdna-core');

// Author side: sign a packaged asset (keep the private key secret).
const key = generateSigningKeyPair();
const signed = await signKDNA('./judgment.kdna', key.private_key, {
  outputPath: './judgment.signed.kdna',
});

// Consumer side: verify offline. Throws on any verification failure.
const evidence = await verifyKDNASignature('./judgment.signed.kdna');
// evidence.state === 'verified', evidence.key_fingerprint, evidence.content_digest

// Pin the signer key to reject signatures from any other key:
await verifyKDNASignature('./judgment.signed.kdna', {
  expectedPublicKey: key.public_key,
});
```

Historical JS and Python implementations share deterministic known-answer
vectors under [`conformance/signature/`](../conformance/signature/README.md).
The [current Python source](../python-sdk/README.md) has its own Core/Read
boundary and does not inherit the historical signing capability.

---

## Published Studio CLI 0.11.0

The historical project/card authoring CLI (`@aikdna/kdna-studio-cli@0.11.0`) is documented in [`./30-minute-authoring-guide.md`](./30-minute-authoring-guide.md) and [`./tool-status-matrix.md`](./tool-status-matrix.md). Current published Studio packages on npm (`@aikdna/kdna-studio-cli@0.14.0` and `@aikdna/kdna-studio-core@4.1.0`) use a separate `0.5.0` session route; current native `0.6.0` `.kdna` authoring uses [`@aikdna/kdna-cli`](https://github.com/aikdna/kdna-cli#readme).
