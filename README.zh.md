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

## 当前源码：选择匹配的实现

先读[当前支持与分发矩阵](./docs/current-release-support.md)和
[Core/Read 源码指引](./docs/core-read-current-status.md)，区分源码版本、包字节、
容器合同与公开渠道。当前预览组合仍是候选；源码、`main` 或已有 `latest` 包
都不能证明这些精确版本已经发布。

| 入口 | 精确候选组合 | 使用边界 |
| --- | --- | --- |
| Core/Read | Core `0.37.1-rc.browser.1` / Read `0.11.2-rc.browser.1` | 普通与 Host 解锁的受保护浏览器 SDK、声明的 Node 参考入口；Node >=20 |
| [原生 CLI](https://github.com/aikdna/kdna-cli#readme) | CLI `0.39.0-rc.native-sections.3` 与上述精确 Core/Read | container `0.6.0` / Read `0.7.0-candidate`；创建、保存、检查、验证、会话读取和 Source 修订；Node >=22 |
| [Loader/MCP](https://github.com/aikdna/kdna-skills#readme) | MCP `0.8.0-rc.native-sections.1` 与上述精确 CLI/Core/Read | 完整源码、本地 operator 绑定的 stdio Read；具名 Host 交付与采用 `NOT_RUN` |
| [Studio 会话](https://github.com/aikdna/kdna-studio-cli#readme) | StudioCLI `0.13.0-rc.components.2` / StudioCore `4.0.0-rc.components.2` 与上述精确 Core/Read | 完整源码会话创作、修订、保存/读取/复验和显式保护导出；container `0.5.0` / Read `0.6.4` |

两条容器路径使用不同的读取与 Source API，共享 SDK 包版本不代表资产可互换。
请选择生产该资产的路径所声明的 reader。原生 CLI 的 Plan/load 不可用；
Core `/execution` 的原生 0.3.1 Plan/Capsule 与显式 Host 参考 API 是独立入口。
普通 root/browser 入场保留加密、签名和 checksums 文档拒绝；
[显式 Node 保护入口](./specs/protection-admission.md)有自己的输入和可信 provider 边界。

第一次做 Agent 任务，可让 Codex Agent 通过本地工具调用准备好的精确原生 CLI。
明确任务、资产文件和 Read 披露权限，再由 Agent 取得 catalog、读取精确选择，
用于撰写或修订任务输出。[合成周报案例](./examples/native-team-update/README.md)
记录了一次实际 Agent 任务的前后作品、所用偏好及 Agent 创作的 Source 修订。
它只证明这个 Agent 在这项合成任务中的使用，不证明 MCP 交付、具名 Host 激活或
真人确认。本地工具调用也不证明 Agent 模型在本地处理披露内容。

先从 [CLI 完整源码](https://github.com/aikdna/kdna-cli#readme)按
[交付生成说明](https://github.com/aikdna/kdna-cli/blob/main/docs/native-delivery.md)
准备源优先交付：CLI 与十一份必需依赖共十二份精确 archive、相对文件 lock、
完整成员绑定和许可证。包内[作者示例](https://github.com/aikdna/kdna-cli/blob/main/examples/team-update/README.md)
与[可执行配方](https://github.com/aikdna/kdna-cli/blob/main/examples/native-workflow.cjs)
演示创建、精确选择披露、实质 Source 修订、重新打开及原文件保持不变。

只有官方 registry 元数据确认这三个精确预览版本后，才可在新目录用独立的
registry 安装路径：

```sh
mkdir kdna-native-example
cd kdna-native-example
npm init -y
npm install --save-exact --ignore-scripts --omit=optional --no-audit --no-fund --registry=https://registry.npmjs.org @aikdna/kdna-cli@0.39.0-rc.native-sections.3
node node_modules/@aikdna/kdna-cli/examples/native-workflow.cjs node_modules/@aikdna/kdna-cli/examples/team-update/author.json ./team-update-output
```

保留各自生成的 lock 与旧文件，每次配方使用新输出目录。源码离线交付和 registry
安装使用不同 lock，但应绑定同一组声明的 KDNA 包字节。
[预览发行流程](./docs/release-preview.md)使用 Core/Read 的 `browser-preview` 与
CLI 的 `native-preview`，均保持 `latest` 不变。

规范 [Loader](https://github.com/aikdna/kdna-skills/blob/main/kdna-loader/SKILL.md) 与
[Creator](https://github.com/aikdna/kdna-skills/blob/main/kdna-creator/SKILL.md)
按 Host 的精确安装选择原生或明确匹配的 Studio 路径。本仓
[`skills/`](./skills/README.md) 保留历史兼容副本。Studio 的 container `0.5.0`
保护导出要求其自己的可信 Host、凭据通道和读回；具名 Host 交付与独立接受仍待实际执行。
任何路径都不运行模型、认证个人或授予行动权限。

已发布 Core `0.37.0` / Read `0.11.1`、原生 CLI `.2` 和加载 CLI `0.36.1`
保留各自的精确依赖图和产物。不要向旧安装注入新的 SDK 对；当前原生创作/Source
工作使用 `.3`，不能覆盖已经发布的 `.2`。技术检查和脚本配方不证明真人确认、
作品适用性或实际任务采用。

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

## 已发布 CLI 0.36.1 的五分钟路径

下面保留已发布线的独立示例：CLI `0.36.1` 绑定 Core `0.21.0` 与
`cbor-x` `1.6.4`。安装固定版本，不与当前 Core/Read 源码或资产混用：

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
合同；普通 root/browser 入场拒绝这些输入，显式 Node 保护入口按其合同处理。格式规范不等于平台、服务或独立接受清单。

创作项目、展开 JSON、Registry 页面、receipt 和评价报告都可以围绕资产工作，
但不是 `.kdna` 分发对象本身。

## 已发布 Core 0.22.0 的签名示例

本节只适用于 `@aikdna/kdna-core@0.22.0` 及其配套旧线资产，请在独立项目固定安装：

```sh
npm install --save-exact @aikdna/kdna-core@0.22.0
```

当前 Core 普通 root 入口不导出这些历史签名 API，普通入场拒绝已签名容器。签名规范和历史向量保留各自
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
同时发布。当前源码组合与公开渠道分别列在
[支持与分发矩阵](./docs/current-release-support.md)；机器可读的版本化记录见
[`ecosystem-manifest.json`](./ecosystem-manifest.json)。

## 成熟度

当前整体是 **Pre-release**。已发布包、本地纠错候选、源码实验、Source-only 集成
和兼容承诺必须分别判断。请以精确版本的规范、Schema、fixture、conformance、
release notes 和产物为准。

## License

Apache-2.0。见 [LICENSE](./LICENSE)。
