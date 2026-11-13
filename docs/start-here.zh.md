# 从这里开始（Start Here）

[English](./start-here.md) | 简体中文 · [返回中文首页](../README.zh.md) · [KDNA Reader 桌面版](https://aikdna.com/zh/downloads) · [Agent 接入指南](./agent-entry.md)

**判断可以存在于许多载体之中。KDNA 为一套有边界的判断与判断系统提供独立的文件身份、完整性校验与按需读取契约。**

---

## 1. 先选对版本线（请先阅读）

使用前请确认你所处的版本线，详见[中文首页](../README.zh.md)与[当前支持与分发矩阵](./current-release-support.md)：

| 版本线 | 已发布坐标与获取方式 | 状态 |
| --- | --- | --- |
| **当前稳定发布线（Container `0.6.0`）** | Core `0.37.10`、Read `0.13.4`、CLI `0.43.5`（绑定 Core `0.37.9` / Read `0.13.3`）；每个包均由经审阅的源码提交构建并完成字节级核验 | 已在 npm `latest` 发布（**推荐**） |
| **旧版 Studio 会话线（Container `0.5.0`）** | Studio Core `4.1.0`、Studio CLI `0.14.0`（各自固定在 Core `0.37.2` / Read `0.11.3`） | 独立的 `0.5.0` 会话与导出线，不用于 `0.6.0` 作品 |
| **已归档历史加载线（Container `0.1.0`）** | CLI `0.36.1`、Studio CLI `0.11.0`、Core `0.21.0` / `0.22.0` | 保留用于历史复现（详见 [`./historical-published-lines.md`](./historical-published-lines.md)），与当前 `0.6.0` 作品不互通 |

---

## 2. 立即体验首部公开 `.kdna` 判断作品（《KDNA 白皮书》`v1.0.1`）

首部官方公开判断作品 **《KDNA 白皮书》`v1.0.1`**（作者：张零 / Zhang Ling · `CC BY 4.0` · Container `0.6.0` · `45` 个关联判断问题）提供中英双语正式版：

- **macOS 桌面阅读器（Apple Silicon · Developer ID 签名与 Apple 公证）：** [aikdna.com/zh/downloads](https://aikdna.com/zh/downloads)（内置中英双语《KDNA 白皮书》`v1.0.1`，支持中英界面切换、浅色与深色模式、本地口令解锁、多资产标签页管理及 `.kdna` 原件无损导出，**永久无需注册账号**）
- **规范 `.kdna` 原件直链下载：**
  - 中文版（`zh-CN`）：[`kdna-whitepaper-1.0.1.zh-CN.kdna`](https://aikdna.com/downloads/whitepaper/v1.0.1/kdna-whitepaper-1.0.1.zh-CN.kdna)（`2,595,031` 字节 · SHA-256 `9f01c10bc06771c6d28c0543cda9aa64118ae470d75a0178ea023b73b812a92b`）
  - 英文版（`en`）：[`kdna-whitepaper-1.0.1.en.kdna`](https://aikdna.com/downloads/whitepaper/v1.0.1/kdna-whitepaper-1.0.1.en.kdna)（`2,711,958` 字节 · SHA-256 `9db199060f5d957b9aaeee38546dfed68b56d9a3a6f479eb2cc93181fba3580e`）
- **官方公开参考作品仓：** [`aikdna/kdna-assets`](https://github.com/aikdna/kdna-assets)（收录中英双语《KDNA 白皮书》`v1.0.1`、演进说明与容器核验套件；`1.0.0` → `1.1.0` 版本 `kdna diff` 示例见 [`examples/native-team-update`](../examples/native-team-update/README.md)）

---

## 3. 当前稳定线快速上手（`@aikdna/kdna-cli@0.43.5`）

### 30 秒创建、按需读取与本地口令加密（`npx`）

需要 **Node.js `>=22`**。以下全部操作在本地完成，**永久无需注册任何在线账号**：

```bash
# 1. 创建：生成可立即编译的示例草稿，并打包为 Container 0.6.0 的 .kdna 作品
npx -y @aikdna/kdna-cli@0.43.5 init --example --mode interview --output draft.json
npx -y @aikdna/kdna-cli@0.43.5 validate-input draft.json --format human
npx -y @aikdna/kdna-cli@0.43.5 create --draft draft.json --output my-judgments.kdna --allow-create

# 2. 校验与按需读取：先看 catalog 目录，再按需精确读取（exact_selection）目标判断及其必需前提
npx -y @aikdna/kdna-cli@0.43.5 validate my-judgments.kdna
npx -y @aikdna/kdna-cli@0.43.5 read my-judgments.kdna --mode catalog --allow-read --format human
npx -y @aikdna/kdna-cli@0.43.5 read my-judgments.kdna \
  --mode exact_selection \
  --judgment-id decision:first-dilemma \
  --allow-read --compact

# 3. 本地离线口令加密（PBKDF2 + AES-256-GCM，无任何在线账号依赖）
printf '%s' 'a long passphrase' > password.txt
npx -y @aikdna/kdna-cli@0.43.5 protect my-judgments.kdna --output locked.kdna --password-file password.txt
npx -y @aikdna/kdna-cli@0.43.5 read locked.kdna \
  --mode exact_selection \
  --judgment-id decision:first-dilemma \
  --allow-read --password-file password.txt --format human
```

### 从空目录精确固定依赖图安装

```bash
mkdir kdna-first-asset && cd kdna-first-asset
npm init -y
npm install --save-exact --ignore-scripts --omit=optional --no-audit --no-fund --registry=https://registry.npmjs.org @aikdna/kdna-cli@0.43.5

# 1. 使用包内教学样本生成首个 .kdna 作品
npx --no-install kdna create node_modules/@aikdna/kdna-cli/examples/team-update/author.json --output first-asset.kdna --allow-create

# 2. 检查容器身份、契约元组与摘要（不展开判断正文）
npx --no-install kdna inspect first-asset.kdna

# 3. 校验容器结构与准入
npx --no-install kdna validate first-asset.kdna

# 4. 读取目录（catalog）：查看作品包含哪些判断议题
npx --no-install kdna read first-asset.kdna --mode catalog --budget 1000000 --allow-read

# 5. 精确读取单条判断及其必需支撑前提闭包（exact_selection）
npx --no-install kdna read first-asset.kdna --mode exact_selection --asset-id asset:team-update-format --asset-version 1.0.0 --judgment-id update:order --budget 1000000 --allow-read
```

要点说明：
- `--allow-create` 与 `--allow-read` 是每次调用时的显式本地技术操作许可，不代表验证真实作者身份，也不授予任何外部系统动作权限。
- 在多判断作品上供 Agent 阅读时，请始终配合 `--format human` 或 `--compact`，并遵循 `catalog` → `exact_selection` 分级读取；不要调用 `--mode whole_asset` 期待直接内联全部正文。
- 旧版 `plan-load` / `load` / `demo` / `pack` 命令属于已归档的 CLI `0.36.1` 历史线，在当前 `0.43.5` 线上不提供（详见 [`./historical-published-lines.md`](./historical-published-lines.md)）。

---

## 4. 你想做什么？（按目标导航）

| 我想要…… | 推荐起点 | 预计用时 |
| --- | --- | --- |
| **用桌面阅读器精读公开 `.kdna` 作品** | 下载 [KDNA Reader macOS 桌面版](https://aikdna.com/zh/downloads)（内置《KDNA 白皮书》`v1.0.1` 中英双语版）或下载 [`kdna-whitepaper-1.0.1.zh-CN.kdna`](https://aikdna.com/downloads/whitepaper/v1.0.1/kdna-whitepaper-1.0.1.zh-CN.kdna) | 1 分钟 |
| **体验当前 CLI 完整生命周期** | 本页上方[当前稳定线快速上手](#30-秒创建按需读取与本地口令加密npx) | 3 分钟 |
| **在 Claude Code / Codex / Cursor / Antigravity 中使用 `.kdna`** | [Agent 接入指南（单文件、单任务）](./agent-entry.md) 与 [`aikdna/kdna-skills`](https://github.com/aikdna/kdna-skills) | 5 分钟 |
| **亲手创作第一份 `.kdna` 判断作品** | [CLI 创作指南（中文）](./authoring-guide-cli.zh.md) · [`aikdna/kdna-cli` README](https://github.com/aikdna/kdna-cli#readme) | 15 分钟 |
| **理解为什么需要独立判断文件格式** | [为什么需要 KDNA](./why-kdna.zh.md) · [为什么叫 KDNA](./why-the-name.zh.md) | 10 分钟 |
| **判断手头场景是否适合用 `.kdna`** | [什么时候使用 KDNA](./when-to-use-kdna.zh.md) · [KDNA 与 AI 技术栈](./kdna-and-ai-stack.zh.md) | 10 分钟 |
| **将 `0.5.0` 作品显式迁移到 `0.6.0`** | [`0.5 → 0.6` 迁移核对清单](./migration-checklist.md) | 5 分钟 |
| **离线检查 `.kdna` 容器头与表摘要** | 仓库内置静态检查器 `docs/inspector/index.html`（双击在浏览器本地打开，零上传） | 1 分钟 |
| **查看已发布包精确版本、SHA-256 与支持边界** | [公开状态（中文）](./status.zh.md) · [支持与分发矩阵](./current-release-support.md) · [核心叙事与边界](./core-narrative-and-boundaries.md) | 10 分钟 |
| **查阅历史发布线（`0.36.1` / `0.11.0`）归档** | [已发布历史线归档](./historical-published-lines.md) | 5 分钟 |
| **参与贡献或报告安全问题** | [`CONTRIBUTING.md`](../CONTRIBUTING.md) · [`SECURITY.md`](../SECURITY.md) | 5 分钟 |

---

## 5. KDNA 是什么（以及不是什么）

| KDNA 将什么确立为一等公民 | KDNA 不宣称什么 |
| --- | --- |
| 具名、有明确适用边界的判断作品（`.kdna`） | 不宣称普通文档、提示词、Skill、RAG、Policy 或 Memory 不能承载判断 |
| 开放容器格式、身份标识、字节完整性与版本演进契约 | 不宣称通过格式校验就等于内容正确、高明或适合当前处境 |
| 先读目录（`catalog`）再按需读取（`exact_selection`）并完整保留支撑/限定前提 | 不授予工具执行权限、写文件权限、网络请求或越权动作 |
| 可选本地离线口令加密（`kdna protect`），**永久无需注册在线账号** | 不承诺在所有模型或所有任务上自动提升特定百分比分数 |

当一篇普通 Markdown、几句提示词或现有 Skill 已经足够解决问题时，请继续使用更简单的工具；当一套判断需要清晰署名、明确停手边界、人眼审阅、版本对比与跨工具协作时，再使用 `.kdna`。

---

## 6. 公开生态仓库地图

| 仓库 / 入口 | 职责定位 |
| --- | --- |
| [`aikdna/kdna`](https://github.com/aikdna/kdna) | KDNA 核心协议规范、Schema、一致性测试向量及 `@aikdna/kdna-core` / `@aikdna/kdna-read` 参考实现 |
| [`aikdna/kdna-cli`](https://github.com/aikdna/kdna-cli) | 官方命令行工具（`@aikdna/kdna-cli`）：创建（`init`、`validate-input`、`compile`、`create`）、本地口令加密（`protect`）、检查（`inspect`、`validate`）、按需读取（`read`）、对比（`diff`）与修订（`source-open`、`source-pack`、`convert`） |
| [`aikdna/kdna-skills`](https://github.com/aikdna/kdna-skills) | Agent 技能包（`kdna-creator`、`kdna-loader`）及可选本地 stdio MCP 适配器 |
| [`aikdna/kdna-assets`](https://github.com/aikdna/kdna-assets) | 官方公开 `.kdna` 代表作品与核验套件（含《KDNA 白皮书》`v1.0.1` 中英双语版，`CC BY 4.0`） |
| [KDNA Reader 桌面版](https://aikdna.com/zh/downloads) | 免费、永久免账号的 Apple 公证 macOS 桌面阅读器（内置《KDNA 白皮书》`v1.0.1` 中英双语版） |
| [`@aikdna/kdna-studio-cli`](https://www.npmjs.com/package/@aikdna/kdna-studio-cli) / [`@aikdna/kdna-studio-core`](https://www.npmjs.com/package/@aikdna/kdna-studio-core) | 独立的旧版 Container `0.5.0` 会话线（不用于当前 Container `0.6.0` 作品） |
| [`aikdna/kdna-core-swift`](https://github.com/aikdna/kdna-core-swift) / [`aikdna/kdna-app-shared`](https://github.com/aikdna/kdna-app-shared) / [`aikdna/kdna-studio-swift`](https://github.com/aikdna/kdna-studio-swift) | Apple 平台 Swift 实现与共享基础库 |
