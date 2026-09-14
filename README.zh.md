> **预发布生态——按精确版本区分源码与发布合同**
>
> KDNA 是判断资产格式与生态。本仓库负责协议和 Core Runtime；其余公开仓库负责
> 创建、消费、授权、Apple、Web、Agent、编辑器和开发者集成。仓库使命、成熟度、
> 发布波次与兼容承诺是不同事实。

# KDNA

> **KDNA 让可复用判断获得独立身份和生命周期。**

KDNA 是开放的判断资产格式与运行协议。个人、团队、组织、Agent 和工具都可以
创建有边界的 `.kdna` 资产，让其中的判断、版本、来源、访问、投影和生命周期
独立于某个 Prompt、Skill、模型或应用被管理。

判断也可以继续存在于 Prompt、Skill、Policy、Memory、知识库、工作流、模型和
普通文档中。KDNA 只在判断需要独立文件与共享加载合同时增加价值，不宣称垄断
判断，也不承诺让模型更聪明或让输出自动更好。

Core 入场建立捕获字节的技术有效性，不认证作者、不判断内容质量，不代表采用，
也不授予读取或行动权限。当前源码通过 Core 私有 snapshot 和公开 Read，在独立可信
Host 边界内披露内容。已发布 CLI 0.36.1 保留其独立的 LoadPlan / Runtime Capsule 合同。

直接解压或解析原始 payload 不是兼容的 Agent 消费路径。

> 第一次使用 → [Start Here](./docs/start-here.md)
>
> KDNA 的定义与边界 → [Core Narrative and Boundaries](./docs/core-narrative-and-boundaries.md)
>
> 何时需要 KDNA → [Why KDNA](./docs/why-kdna.zh.md) · [什么时候使用 KDNA](./docs/when-to-use-kdna.zh.md)
>
> 当前状态与路线图 → [Status](./docs/status.zh.md) · [Public Roadmap](./docs/public-roadmap.md)

## 当前源码：Core 入场与 Read

先阅读 [Core/Read 源码指引](./docs/core-read-current-status.md)、
[Core](./packages/kdna-core/README.md) 和 [Read](./packages/kdna-read/README.md)
的精确输入与 API。Core `0.24.0-rc.component-semantics.2` 对不可变字节入场，生成
Canonical IR 并签发私有 snapshot。Read `0.3.0-rc.component-semantics.2` 明确区分
`read_envelope`、`admission_rejection`、`no_body_control` 和 `transport_failure`。
披露需要独立可信的 control / Host provider；读取结果不授予行动权限。

这些是源码候选，不是 npm 发布。当前 Core/Read 不支持加密、签名和 checksums 文档
入场，也不支持 Runtime Capsule / Plan 入场及执行。规范或历史示例的存在不代表实现
已经支持。[当前 CLI 源码](https://github.com/aikdna/kdna-cli#readme) 提供明确文件的
`inspect`、`validate`、`read`，须使用其精确绑定的依赖图。

## 已发布 CLI 0.36.1 的五分钟路径

下面保留已发布线的独立示例，安装固定版本，不与当前 Core/Read 源码或资产混用：

```bash
npm install -g @aikdna/kdna-cli@0.36.1

kdna demo judgment ./judgment
kdna pack ./judgment ./judgment.kdna
kdna validate ./judgment.kdna --runtime
kdna plan-load ./judgment.kdna --json
kdna load ./judgment.kdna --profile=compact --as=json
```

> **官方包坐标：** 所有官方 npm 包都发布在 **`@aikdna`** scope 下（例如
> `@aikdna/kdna-cli`、`@aikdna/kdna-core`）。npm 上的裸名 `kdna` 是无关的
> 第三方空占，请勿安装。PyPI 上的 `kdna` 项目名同样是与本项目无关的第三方
> 空占，并非我方。我方在 PyPI 的官方发行名是 **`aikdna`**（import 包名仍为
> `kdna`）。只安装 PyPI 的 `aikdna`——绝不要 `pip install kdna`。
> 见 [SECURITY.md](./SECURITY.md)。

这条旧线示例的结果只描述 CLI 0.36.1 的验证、规划和投影，不证明当前 Core/Read
接受相同资产，不证明模型已经采用资产，也不证明内容正确或结果更好。

## `.kdna` 是什么

一份 `.kdna` 是单文件、可携带的判断资产。当前容器包含公开 manifest、结构化
判断 payload、身份和谱系信息。加密、签名和 checksums 文档属于相应版本的格式
合同；当前 Core 源码在入场时明确拒绝这些尚不可用的能力。格式规范不等于当前实现清单。

创作项目、展开 JSON、Registry 页面、receipt 和评价报告都可以围绕资产工作，
但不是 `.kdna` 分发对象本身。

## 已发布 Core 0.22.0 的签名示例

本节只适用于 `@aikdna/kdna-core@0.22.0` 及其配套旧线资产，请在独立项目固定安装：

```sh
npm install --save-exact @aikdna/kdna-core@0.22.0
```

当前 Core 源码不导出这些签名 API，并拒绝已签名容器。签名规范和历史向量保留各自
版本语义，不能据此推定当前候选支持。

在已发布 Core 0.22.0 中，`.kdna` 资产可以携带可选的 `signature.kdsig` 签名包（`kdsig.ed25519`，
[RFC-0021](./rfcs/RFC-0021-signature-track.md) M1）。Ed25519 签名覆盖规范化
内容摘要（[CANONICALIZATION.md](./docs/CANONICALIZATION.md)），验签完全离线，
加载全程 fail-closed：验签失败的资产会被拒绝，绝不会降级为「未签名」。

```js
const {
  generateSigningKeyPair,
  signKDNA,
  verifyKDNASignature,
} = require('@aikdna/kdna-core');

// 作者侧：签名一个已打包资产（私钥自行保密）。
const key = generateSigningKeyPair();
const signed = await signKDNA('./judgment.kdna', key.private_key, {
  outputPath: './judgment.signed.kdna',
});

// 消费侧：离线验签。任何验签失败都会抛错。
const evidence = await verifyKDNASignature('./judgment.signed.kdna');
// evidence.state === 'verified'，含 key_fingerprint 与 content_digest

// 固定签名者公钥，拒绝其他任何密钥的签名：
await verifyKDNASignature('./judgment.signed.kdna', {
  expectedPublicKey: key.public_key,
});
```

仅缺少签名不会使该发布线资产无效；验签返回 `state: 'absent'`，调用方也可以强制要求签名。
有效签名只证明完整性与绑定到密钥的来源，绝不证明判断正确、专业或安全。
历史 JS 与 Python 实现共享
[`conformance/signature/`](./conformance/signature/README.md) 下的确定性
known-answer 向量。[当前 Python 源码](./python-sdk/README.md) 有独立的 Core/Read
边界，不继承历史签名能力。

## 本机与 Agent 使用边界

文件存在、保存副本、附加到工作区、授权、适用于当前任务和实际加载是六个不同
事实。KDNA 协议不要求“安装资产”才能使用；`~/.kdna`、项目 `.kdna/`、Store、
Registry、Skill 和 MCP 都只是产品实现选择。

当前源码技术入口是明确文件的 Core 入场与 Read；`validate → plan-load → load`
属于已发布 CLI 0.36.1。Agent 适配器的
最终产品模型仍在收敛：它只能执行用户明确选择或 Host 已授权的资产，不能从全机
任意资产中自主选择并隐藏使用。当前采用的资产身份、版本、作用域和原因必须可查，
并可停用、切换和回滚。

## Core 负责与不负责

本仓库的版本化规范负责以下合同；规范存在不代表当前源码已经实现全部能力：

- 容器、Schema、Payload 与必需条目；
- 身份、版本、digest、兼容与可选谱系；
- 加密、签名、授权声明的技术表示；
- LoadPlan、Runtime 投影与 Capsule 合同；
- 兼容实现之间不静默改字节或丢关键语义。

Core 不负责：

- 裁定判断内容的普遍正误或质量；
- 认证作者专业性或现实身份；
- 决定当前任务该采用哪份资产；
- 授予文件、网络、支付或部署权限；
- 保证模型采用资产或结果更好。

## 创作自己的资产

Studio 是创作工具，不是格式合法性的唯一入口。当前创作源码及其独立采用、保存和
复验边界见 [Studio CLI](https://github.com/aikdna/kdna-studio-cli#readme)。
下面保留 Studio CLI 0.11.0 与 Runtime CLI 0.36.1 的已发布创作路径：

```bash
npm install -g @aikdna/kdna-studio-cli@0.11.0 @aikdna/kdna-cli@0.36.1
kdna-studio create my-domain --name @yourscope/my-domain
kdna-studio card add my-domain axiom \
  --field one_sentence="一条有明确取舍含义的判断" \
  --field full_statement="说明这条判断如何影响选择" \
  --field why="说明理由" \
  --field applies_when='["适用情境"]' \
  --field does_not_apply_when='["不适用情境"]' \
  --field failure_risk="误用风险"
kdna-studio export my-domain --out ./my-domain.kdna
kdna validate ./my-domain.kdna
kdna plan-load ./my-domain.kdna
```

人、AI、Agent、工具和混合流程都可以创建资产。只有资产声称代表某个人或机构时，
才需要相应主体确认该代表关系。

## 17 仓生态

KDNA 的公开生态保留 17 个仓库使命，覆盖协议/Core、Runtime CLI、Studio、参考
资产、Apple、Agent/MCP/编辑器、Web、授权与远程消费。它们成熟度不同，也不会
同时发布。机器可读的精确版本与生命周期见
[`ecosystem-manifest.json`](./ecosystem-manifest.json)。

## 成熟度

当前整体是 **Pre-release**。已发布包、本地纠错候选、源码实验、Source-only 集成
和兼容承诺必须分别判断。请以精确版本的规范、Schema、fixture、conformance、
release notes 和产物为准。

## License

Apache-2.0。见 [LICENSE](./LICENSE)。
