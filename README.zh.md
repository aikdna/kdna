# KDNA

[English](./README.md) | 简体中文 · [官方网站](https://aikdna.com/zh) · [KDNA Reader 桌面版](https://aikdna.com/zh/downloads) · [中文文档](./docs/start-here.zh.md) · [认知原石实验室](https://aikdna.cn)

**面向判断与判断系统的开放文件格式及核心参考实现。**

文字与排版有文档（`.md`、`.pdf`），数据与测算有电子表格，现场表达有幻灯片，互联页面有网页（HTML），确定性执行有代码。唯独一个人在真实实践中打磨出的**思考、判断、取舍次序、适用边界与审美品味**，过去一直散落在聊天记录、提示词和一次性成品里，没有属于自己的独立文件形态。

当 AI 让文字、代码和方案的生成越来越轻便，真正稀缺、真正拉开结果差距的，是背后的**思考、判断与品味——它们本身就是“作品”**。KDNA（`.kdna`）为这类作品提供开放、可核验、可演进的文件格式：人可以在 [KDNA Reader 桌面版](https://aikdna.com/zh/downloads)中先读懂它的主张与边界，兼容的 Agent 也可以在本地创建、口令加密、校验并带着完整前提去采用它。

> **保持克制的选择：** 如果一篇普通 Markdown 文档、几句提示词或现有的 Skill 已经足以解决手头任务，继续使用即可，不必为了格式而迁移。当一套判断需要清晰署名、明确停手边界、人眼审阅、版本对比以及跨工具协作时，`.kdna` 才真正发挥价值。

| 维度 | `CLAUDE.md` / 系统提示词 / 普通 Markdown | `.kdna` 判断作品 |
| --- | --- | --- |
| **内在结构** | 线性纯文本，结论、背景故事与例外条件混杂 | 显式区分具体问题、核心主张、推理机制、适用条件、停手边界与防误用说明 |
| **任务读取** | 整篇塞入上下文，或按长度盲目截断 | 先读 `catalog` 目录，再按需精确读取（`exact_selection`）目标判断及其必需前提与边界 |
| **版本演进** | 原地静默覆盖，难以追溯改了哪条取舍 | 明确版本号（如 `1.0.0` → `1.1.0`），升级前可用 `kdna diff --format human` 逐项核对差异 |
| **私密保护** | 本地明文裸露 | 支持本地离线口令加密（`kdna protect`，PBKDF2 + AES-256-GCM），**永久无需在线账号** |

---

## 立即体验真实 `.kdna` 判断作品（永久免账号）

首部官方公开判断作品 **《KDNA 白皮书》`v1.0.1`**（作者：张零 / Zhang Ling · `CC BY 4.0` · container `0.6.0` · `45` 个关联判断问题）现已提供中英双语 `.kdna` 正式版：

- **中文 `.kdna` 正式版（`zh-CN`）：** [`kdna-whitepaper-1.0.1.zh-CN.kdna`](https://aikdna.com/downloads/whitepaper/v1.0.1/kdna-whitepaper-1.0.1.zh-CN.kdna)（`2,595,031` 字节 · SHA-256 `9f01c10bc06771c6d28c0543cda9aa64118ae470d75a0178ea023b73b812a92b`，创建者 `张零`）
- **等义英文 `.kdna` 正式版（`en`）：** [`kdna-whitepaper-1.0.1.en.kdna`](https://aikdna.com/downloads/whitepaper/v1.0.1/kdna-whitepaper-1.0.1.en.kdna)（`2,711,958` 字节 · SHA-256 `9db199060f5d957b9aaeee38546dfed68b56d9a3a6f479eb2cc93181fba3580e`，创建者 `Zhang Ling`）
- **macOS 桌面版（Apple Silicon · Developer ID 签名与 Apple 公证）：** [aikdna.com/zh/downloads](https://aikdna.com/zh/downloads)（内置中英双语《KDNA 白皮书》`v1.0.1`，支持中英界面切换、浅色与深色模式、本地口令解锁、多资产标签页管理及 `.kdna` 原件无损导出——永久无需注册账号）
- **公开参考资产仓库：** [`aikdna/kdna-assets`](https://github.com/aikdna/kdna-assets)（收录中英双语《KDNA 白皮书》`v1.0.1`、SHA-256 校验值、演进说明与容器核验套件；`1.0.0` → `1.1.0` 版本 `kdna diff` 示例见 [`examples/native-team-update`](./examples/native-team-update/README.md)）

> **一键复制给你的 Agent（Claude Code / Cursor / Codex / Antigravity 等，需 Node.js `>=22`）：**
> `请先下载首份公开 .kdna 作品《KDNA白皮书》（curl -fsSLo kdna-whitepaper-1.0.1.zh-CN.kdna https://aikdna.com/downloads/whitepaper/v1.0.1/kdna-whitepaper-1.0.1.zh-CN.kdna），用 npx -y @aikdna/kdna-cli@0.43.5 read kdna-whitepaper-1.0.1.zh-CN.kdna --mode catalog --format human --allow-read 查看全部 45 个议题目录；再根据我想讨论的问题，用 --mode exact_selection --judgment-id <id1,id2> --format human --allow-read 按需精读对应判断（切勿用 whole_asset 或不加 --compact/--format human 裸读大体积 JSON）。`

---

## 30 秒开发者与 Agent 快速上手

需要 **Node.js `>=22`**。以下全部流程——创建、本地口令加密（container `0.6.0`）、容器校验、按需读取与版本对比——**永久无需注册任何在线账号**，安装后可完全离线运行：

```sh
# 1. 创建：生成可立即编译的示例草稿，并打包为 0.6.0 的 .kdna 作品
npx -y @aikdna/kdna-cli@0.43.5 init --example --mode interview --output draft.json
npx -y @aikdna/kdna-cli@0.43.5 validate-input draft.json --format human
npx -y @aikdna/kdna-cli@0.43.5 create --draft draft.json --output my-judgments.kdna --allow-create

# 2. 校验与按需读取：校验容器完整性，先浏览目录，再读取目标判断及其必需前提与边界
npx -y @aikdna/kdna-cli@0.43.5 validate my-judgments.kdna
npx -y @aikdna/kdna-cli@0.43.5 read my-judgments.kdna --mode catalog --allow-read --format human
npx -y @aikdna/kdna-cli@0.43.5 read my-judgments.kdna \
  --mode exact_selection \
  --judgment-id decision:first-dilemma \
  --allow-read --compact

# 3. 本地口令加密保护（离线 AEAD 加密，无任何在线账号依赖）
printf '%s' 'a long passphrase' > password.txt
npx -y @aikdna/kdna-cli@0.43.5 protect my-judgments.kdna --output locked.kdna --password-file password.txt
npx -y @aikdna/kdna-cli@0.43.5 read locked.kdna \
  --mode exact_selection \
  --judgment-id decision:first-dilemma \
  --allow-read --password-file password.txt --format human
```

- **Agent 接入指南（Claude Code、Codex、Cursor、OpenCode、Antigravity）：** 请参阅 [`docs/agent-entry.md`](./docs/agent-entry.md) 与 [`aikdna/kdna-skills`](https://github.com/aikdna/kdna-skills)。
- **最新已发布包版本与 SHA-256 校验矩阵：** 统一以英文主文档 [`README.md`](./README.md#published-package-coordinates) 及机器可读真源 [`docs/release-coordinates.json`](./docs/release-coordinates.json) 为准。
- **深入阅读：** [为什么需要 KDNA](./docs/why-kdna.zh.md) · [从这里开始](./docs/start-here.zh.md) · [什么时候使用 KDNA](./docs/when-to-use-kdna.zh.md) · [公开状态](./docs/status.zh.md) · [公开路线图](./docs/public-roadmap.md)

---

## 仓库结构与配套开源生态

本仓库维护 KDNA 开放协议规范、一致性测试向量及核心 npm 包：

| 包 / 目录 | 职责说明 |
| --- | --- |
| [`packages/kdna-core`](./packages/kdna-core) (`@aikdna/kdna-core`) | Container `0.6.0` 与 `0.5.0` 准入校验、规范化摘要、作品打包，以及本地口令加密保护 |
| [`packages/kdna-read`](./packages/kdna-read) (`@aikdna/kdna-read`) | 按需读取协议（`catalog` 目录、`exact_selection` 精确选取与支撑/限定前提自动随行、展开句柄，以及受保护作品本地口令解锁） |
| [`packages/kdna-conformance`](./packages/kdna-conformance) (`@aikdna/kdna-conformance`) | 确定性一致性测试套件与跨语言核验规则 |
| [`conformance/`](./conformance) 与 [`fixtures/`](./fixtures) | 版本化正反测试样本与参考向量 |
| [`specs/`](./specs) 与 [`rfcs/`](./rfcs) | 规范索引（[`SPEC-INDEX.md`](./SPEC-INDEX.md#kdna-public-specification-index)）与演进提案 |
| [`examples/native-team-update`](./examples/native-team-update/README.md) | 最小虚构教学样本对（`1.0.0` / `1.1.0`，`CC BY 4.0`），用于演示容器结构与版本差异对比 |

配套公开仓库与阅读器：
- [`aikdna/kdna-cli`](https://github.com/aikdna/kdna-cli) — 官方命令行工具（`@aikdna/kdna-cli`），用于创建（`kdna.draft/1` 与 `0.6.0`）、口令保护、校验、读取与对比 `.kdna` 作品
- [`aikdna/kdna-skills`](https://github.com/aikdna/kdna-skills) — Agent 技能包（`kdna-creator`、`kdna-loader`）与本地 stdio MCP 服务
- [`aikdna/kdna-assets`](https://github.com/aikdna/kdna-assets) — 官方公开 `.kdna` 代表作品仓（含《KDNA 白皮书》`v1.0.1` 中英双语正式版与容器核验套件）
- [`@aikdna/kdna-studio-cli`](https://www.npmjs.com/package/@aikdna/kdna-studio-cli) / [`@aikdna/kdna-studio-core`](https://www.npmjs.com/package/@aikdna/kdna-studio-core) — **旧版 container `0.5.0` 会话线**（不用于当前 container `0.6.0` 作品创作；创建与读取 `0.6.0` 作品请使用 `@aikdna/kdna-cli`）
- [`aikdna/kdna-core-swift`](https://github.com/aikdna/kdna-core-swift) — 面向 Apple 平台的 Swift Core 实现
- [KDNA Reader 桌面版](https://aikdna.com/zh/downloads) — 免费、永久免账号的 Apple 公证 macOS 桌面阅读器（内置《KDNA 白皮书》`v1.0.1` 中英双语版）

---

## 三条核心设计边界

1. **格式合规不等于内容正确。** 通过 `kdna validate` 只证明文件字节与结构符合协议规范；一条判断是否成立、是否适合当前处境，始终需要人结合事实与证据自行审定。
2. **读到内容不等于授权行动。** 读取一份 `.kdna` 只交付结构化的判断文本，绝不自动授予改写文件、访问网络、执行交易或跨任务静默沿用的系统权限。
3. **版本演进不搞静默覆盖。** 修订判断会生成明确的新版本（可用 `kdna diff --format human` 直观核对差异），便于采用者看清变化后再决定是否升级。`0.5.0` 向 `0.6.0` 的显式迁移步骤见 [`docs/migration-checklist.md`](./docs/migration-checklist.md)。

---

## 当前源码：选择匹配的实现

详见[当前支持与分发矩阵](./docs/current-release-support.md)和
[Core/Read 源码指引](./docs/core-read-current-status.md)，区分源码版本、包字节、
容器合同与公开渠道。

| 入口 | 精确已发布组合 | 使用边界 |
| --- | --- | --- |
| Core/Read | Core `0.37.10` / Read `0.13.4` | 普通与 Host 解锁的受保护浏览器 SDK、声明的 Node 参考入口；Node >=20 |
| [原生 CLI](https://github.com/aikdna/kdna-cli#readme) | CLI `0.43.5` 与其自身精确 Core `0.37.9` / Read `0.13.3` | container `0.6.0` / Read `0.7.0-candidate`；创建、保存、检查、验证、会话读取和 Source 修订；Node >=22 |
| [Loader/MCP](https://github.com/aikdna/kdna-skills#readme) | MCP `0.8.0-rc.native-sections.3` 与其自身的 CLI `0.43.5` 及 Core `0.37.9` / Read `0.13.3` | 可选的完整源码、本地 operator 绑定的 stdio Read；具名 Host 交付与采用尚未评估 |
| [Studio 会话](https://www.npmjs.com/package/@aikdna/kdna-studio-cli) | StudioCLI `0.14.0` / StudioCore `4.1.0` 在各自固定的 Core `0.37.2` / Read `0.11.3` 线上 | 完整源码会话创作、修订、保存/读取/复验和显式保护导出；container `0.5.0` / Read `0.6.4` |

两条容器路径使用不同的读取与 Source API，共享 SDK 包版本不代表资产可互换。
原生 CLI 的 Plan/load 不可用；Core `/execution` 的原生 0.3.1 Plan/Capsule 与显式 Host 参考 API 是独立入口。普通 root/browser 入场保留加密、签名和 checksums 文档拒绝；[显式 Node 保护入口](./specs/protection-admission.md)有自己的输入和可信 provider 边界。离线交付包与可复现脚本见 [交付生成说明](https://github.com/aikdna/kdna-cli/blob/main/docs/native-delivery.md)、[作者示例](https://github.com/aikdna/kdna-cli/blob/main/examples/team-update/README.md)、[可执行配方](https://github.com/aikdna/kdna-cli/blob/main/examples/native-workflow.cjs) 及[合成周报案例](./examples/native-team-update/README.md)。

已发布的精确坐标可从空缓存安装：

```sh
mkdir kdna-native-example
cd kdna-native-example
npm init -y
npm install --save-exact --ignore-scripts --omit=optional --no-audit --no-fund --registry=https://registry.npmjs.org @aikdna/kdna-cli@0.43.5
node node_modules/@aikdna/kdna-cli/examples/native-workflow.cjs node_modules/@aikdna/kdna-cli/examples/team-update/author.json ./team-update-output
```

已发布 Core `0.37.0` / Read `0.11.1`、原生 CLI `.2` 和加载 CLI `0.36.1`
保留各自的精确依赖图和产物。不要向旧安装注入新的 SDK 对；当前原生创作/Source
已发布稳定线是 `0.43.5`，不能覆盖已经发布的 `.2` 或 `.3`。

## 已发布旧线

旧版发布线（早期原生预览线、`0.36.1`、`0.22.0`、`0.11.0`）的独立归档示例已移至 [`docs/historical-published-lines.md`](./docs/historical-published-lines.md)。

---

## 本地测试与参与贡献

```sh
npm ci
npm test
node scripts/render-release-coordinates.mjs --check
node scripts/check-packaged-readme.mjs
```

贡献流程见 [`CONTRIBUTING.md`](./CONTRIBUTING.md)，安全漏洞披露渠道见 [`SECURITY.md`](./SECURITY.md)。

## 开源许可

代码采用 [Apache-2.0](./LICENSE) 许可；文档与教学样例许可详见 [`LICENSE-DOCS`](./LICENSE-DOCS) 与 [`NOTICE`](./NOTICE)。
