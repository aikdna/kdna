# KDNA

[English](./README.md) | 简体中文 · [官方网站](https://aikdna.com/zh) · [对比案例与实测](https://aikdna.com/zh/explore/systems) · [KDNA Reader 桌面版](https://aikdna.com/zh/downloads) · [社区讨论](https://github.com/aikdna/kdna/discussions) · [中文文档](./docs/start-here.zh.md) · [KDNA 中文官网](https://aikdna.cn)

**面向思考、判断与品味的开放、可迁移、永久免账号文件格式（`.kdna`）。**

KDNA 将个人或团队在真实实践中沉淀的判断——包含它回应的具体问题、核心主张、推理与方法、真实取舍、停手边界和常见误用——保存为独立且有版本号的文件：人可以在 [KDNA Reader 桌面版](https://aikdna.com/zh/downloads)直接阅读审视，兼容的 AI Agent 则可以按需选读（`catalog` → `exact_selection`）并完整带上支撑前提与制约边界。同一份 `.kdna` 文件可跨 Claude Code、Cursor、Codex、OpenCode、Antigravity 或任意 CLI / MCP 宿主直接复用，无需把整本长规范硬塞进每次对话。

### 一条命令立刻运行（需 Node.js `>=22`，无需账号）

```sh
# 下载官方公开《KDNA 白皮书》v1.0.2（45 条关联判断，CC BY 4.0）并查看议题目录
curl -fsSLo kdna-whitepaper-1.0.2.zh-CN.kdna \
  https://aikdna.com/downloads/whitepaper/v1.0.2/kdna-whitepaper-1.0.2.zh-CN.kdna
npx -y @aikdna/kdna-cli@0.45.2 read kdna-whitepaper-1.0.2.zh-CN.kdna \
  --mode catalog --allow-read --format human
```

### 真实 Before / After 对照案例（`HW-04`：稀薄材料 1,500 字防编造陷阱）

在公开实测用例 **`HW-04`**（[完整提示、评分规则与双模型原始输出](https://aikdna.com/zh/explore/human-writing)）中，用户只给了三条抽象想法（开会打断写代码、多人念进度、文档方便回查），却要求写一篇 **1,500 字“有活人带队真实画面感”的公众号长文**：

- **Before（未加载 KDNA / 简短提示）：** 两个受测模型均直接替作者编造虚构故事凑够字数（如虚构“周一上午十点，阿哲盯着线上 bug……带七人团队的前两年……”或“会议室里没喝完的咖啡……”）。
- **After（加载 KDNA 按需选读 — `catalog` → `exact_selection`）：** 仅加载与材料底线相关的少数判断（`verify-material-sufficiency-before-drafting`、`never-fabricate-facts-or-fake-anecdotes`、`ground-voice-in-provenance-not-pronouns`）及其关联约束，直接卡住停手边界、拒绝编造虚构经历，改交诚实短稿骨架并集中追问真实素材，同时将第 3 步上下文体积减少 `-85.2%`。

### 192 次公开实测数据与坦诚代价说明

基于两套公开中英双语示范作品（[体系总览与下载表](https://aikdna.com/zh/explore/systems) · [GitHub Releases 镜像](https://github.com/aikdna/kdna-assets/releases) — 每个领域 `2` 个模型 × `4` 组对照 × `12` 个无泄漏用例，共 `192` 次完整运行）：

- **活人感写作（`v1.0.1`，96 次实测 · [对比案例与实测数据](https://aikdna.com/zh/explore/human-writing)）：** KDNA 按需选读达成 **`23/24`（`95.8%`）**，与等长全量 Markdown 对照组（`23/24`）持平（无系统对照组为 `11/24`，短提示为 `12/24`），同时第 3 步加载上下文减少 **`-85.2%`**，总输入 Token 降低 **`-39.7%` 至 `-45.2%`**。
- **代码审查（`v1.0.2`，96 次实测 · [对比案例与实测数据](https://aikdna.com/zh/explore/code-review)）：** 缺陷与 P0 紧急止血严格通过率 **`17/18`（`94.4%`）**（全量字面严格通过率 **`20/24`**，等长全量 Markdown 为 **`22/24`**），同时第 3 步加载上下文减少 **`-84.0%`**，总输入 Token 降低 **`-52.6%` 至 `-54.5%`**。
- **代价与已知反例：** 按需选读相比直接灌入全量 Markdown 会多出 **1 次选读往返延迟（`+8–38s`）**；此外在代码审查第 3 组“好 PR 防误杀”反例中，`GPT-6-Luna` 因作者图谱遗漏 `#19↔#01` 冲突边而出现误拦——说明按需选读只有在图谱关系维护完整时才能达到预期效果，并非自动免疫边界遗漏。

### 一份 `.kdna` 作品里装了什么

- **完整的判断脉络**：每条判断都写明它回应的具体问题、核心主张、背后理由与方法、真实取舍、适用条件、停手边界和常见误用，不再只剩一句孤零零的结论。
- **按需读取、不断章取义**：Agent 先浏览作品目录（`catalog`），再只读取与眼前任务相关的几条判断（`exact_selection`），同时自动带上支撑前提、限定条件和相互制约的关联判断。
- **人眼可读、跨工具通用**：同一份本地文件，人可以用 KDNA Reader 直接审读，也可以直接交给 Claude Code、Cursor、Codex、OpenCode、Antigravity 等任意兼容工具使用，不被单一平台锁死。
- **清晰演进、离线隐私保护**：修订判断会生成明确的新版本（如 `1.0.0` → `1.1.0`），升级前可用 `kdna diff --format human` 逐项核对改动；私密作品支持本地离线口令加密（`kdna protect`，`RFC-0018`），**永久无需注册在线账号**。

---

## 立即体验真实 `.kdna` 作品

首部官方公开判断作品 **《KDNA 白皮书》`v1.0.2`**（作者：张零 / Zhang Ling · `CC BY 4.0` · `45` 个关联判断）现已提供中英双语 `.kdna` 正式版（开放格式与 `@aikdna/kdna-cli` 永久无需在线账号）：

- **中文 `.kdna` 正式版（`zh-CN`）：** [`kdna-whitepaper-1.0.2.zh-CN.kdna`](https://aikdna.com/downloads/whitepaper/v1.0.2/kdna-whitepaper-1.0.2.zh-CN.kdna)（`2,725,359` 字节 · SHA-256 `e344944a53f8d4bb2ca40a8d42bcd3c104e3067bfa92dce99e327cbc5aed40aa`，作者 `张零`）
- **等义英文 `.kdna` 正式版（`en`）：** [`kdna-whitepaper-1.0.2.en.kdna`](https://aikdna.com/downloads/whitepaper/v1.0.2/kdna-whitepaper-1.0.2.en.kdna)（`2,843,386` 字节 · SHA-256 `6da515820eed210508d72a4ddbf68f7052cb180afe592c64e85e9a3fbb60c49e`，作者 `Zhang Ling`）
- **KDNA Reader 桌面版（macOS · Apple Silicon · 已获 Apple 公证）：** [aikdna.com/zh/downloads](https://aikdna.com/zh/downloads)（GitHub Releases 镜像与 SHA-256 校验：[`aikdna/kdna-reader-releases`](https://github.com/aikdna/kdna-reader-releases)；永久免费；打开即可免登录离线阅读内置中英双语《KDNA 白皮书》与本地公开或口令保护 `.kdna` 文件，同时可选免费登录 `KDNA ID` 开启多标签对照；其他中英双语示范作品可免登录直接从 [aikdna.com/zh/explore](https://aikdna.com/zh/explore) 与 [`aikdna/kdna-assets`](https://github.com/aikdna/kdna-assets/releases) 下载；非 Mac 用户可使用 `@aikdna/kdna-cli`、`@aikdna/kdna-mcp-server` 或访问 [aikdna.com/zh/explore](https://aikdna.com/zh/explore)）
- **公开参考作品仓：** [`aikdna/kdna-assets`](https://github.com/aikdna/kdna-assets)（收录中英双语《KDNA 白皮书》`v1.0.2`、校验值与容器核验脚本）

> **一键复制给你的 Agent（Claude Code / Cursor / Codex / Antigravity 等，需 Node.js `>=22`）：**
> `请先下载首份公开 .kdna 作品《KDNA白皮书》（curl -fsSLo kdna-whitepaper-1.0.2.zh-CN.kdna https://aikdna.com/downloads/whitepaper/v1.0.2/kdna-whitepaper-1.0.2.zh-CN.kdna），用 npx -y @aikdna/kdna-cli@0.45.2 read kdna-whitepaper-1.0.2.zh-CN.kdna --mode catalog --format human --allow-read 查看全部 45 个议题目录；再根据我想讨论的问题，用 --mode exact_selection --judgment-id <id1,id2> --format human --allow-read 按需精读对应判断（请始终带 --format human 或 --compact，不要使用 whole_asset）。`

---

## 30 秒命令行快速上手

需要 **Node.js `>=22`**。以下创建、校验、按需读取与本地口令加密（Container `0.6.0`）全部在本地运行，**永久无需注册任何在线账号**：

```sh
# 1. 创建：生成示例草稿，校验并打包为 0.6.0 .kdna 作品
npx -y @aikdna/kdna-cli@0.45.2 init --example --mode interview --output draft.json
npx -y @aikdna/kdna-cli@0.45.2 validate-input draft.json --format human
npx -y @aikdna/kdna-cli@0.45.2 create --draft draft.json --output my-judgments.kdna --allow-create

# 2. 校验与按需读取：先看目录，再按需读取目标判断及关联前提
npx -y @aikdna/kdna-cli@0.45.2 validate my-judgments.kdna
npx -y @aikdna/kdna-cli@0.45.2 read my-judgments.kdna --mode catalog --allow-read --format human
npx -y @aikdna/kdna-cli@0.45.2 read my-judgments.kdna \
  --mode exact_selection \
  --judgment-id decision:first-dilemma \
  --allow-read --compact

# 3. 本地口令加密（通过标准输入传入，离线 AEAD 加密，不依赖在线账号，不在磁盘留下明文口令文件）
# 实际使用时建议从密码管理器管道传入，或先静默读入变量（`IFS= read -rs KDNA_PASS`）再通过 /dev/stdin 传入。
printf '%s' 'a long passphrase' | npx -y @aikdna/kdna-cli@0.45.2 protect my-judgments.kdna --output locked.kdna --password-file /dev/stdin
printf '%s' 'a long passphrase' | npx -y @aikdna/kdna-cli@0.45.2 read locked.kdna \
  --mode exact_selection \
  --judgment-id decision:first-dilemma \
  --allow-read --password-file /dev/stdin --format human
```

- **阅读中文文档：** [从这里开始](./docs/start-here.zh.md) · [为什么是 KDNA](./docs/why-kdna.zh.md) · [创作指南](./docs/authoring-guide.zh.md) · [什么是判断系统](./docs/judgment-systems.zh.md) · [为什么叫 KDNA](./docs/why-the-name.zh.md) · [当前状态](./docs/status.zh.md)
- **Agent 接入与发布坐标：** [Agent 接入指南](./docs/agent-entry.md) · [公开路线图](./docs/public-roadmap.md) · 精确版本与 SHA-256 见英文主文档 [`README.md`](./README.md#published-package-coordinates) 及 [`docs/release-coordinates.json`](./docs/release-coordinates.json)。

---

## 三条清晰原则

1. **格式核验管完整，判断高下由人定。** `kdna validate` 确认文件结构完整、没有被篡改；一条判断是否契合眼前处境，始终由人结合事实与经验自己审定。
2. **读懂判断，不等于授予操作权限。** 读取 `.kdna` 只提供结构化的判断内容，不会自动替用户改文件、发请求或执行外部操作，系统权限始终掌握在用户与宿主工具手里。
3. **修订可见，版本清晰。** 每次更新判断都会生成带版本号的新文件，升级前可用 `kdna diff --format human` 清楚看到到底改了哪一条，避免暗中变样。

---

## 仓库结构与开源生态

本仓库维护 KDNA 开放协议规范（Container `0.6.0`）、一致性测试向量与核心参考包：

| 包 / 目录 | 说明 |
| --- | --- |
| [`packages/kdna-core`](./packages/kdna-core) (`@aikdna/kdna-core`) | Container `0.6.0` 与 `0.5.0` 校验、规范摘要、作品打包与本地口令加密 |
| [`packages/kdna-read`](./packages/kdna-read) (`@aikdna/kdna-read`) | 按需读取协议（`catalog` 目录、`exact_selection` 精确选读与前提关联闭包、本地口令解锁） |
| [`packages/kdna-conformance`](./packages/kdna-conformance) (`@aikdna/kdna-conformance`) | 历史 `0.1.0`/`0.36.1` `planLoad` 一致性测试包（Container `0.6.0` 核验使用 `npm run conformance:container-0.6`；公共语义契约核验使用 `npm run conformance:public-obligations` 与 `scripts/public-contract/run-vectors.mjs`） |
| [`conformance/public-contract/`](./conformance/README.md#dsp095-public-contract-candidate) | 公共语义契约（`kdna.core/0.8.2` · `kdna.payload.judgment/0.5.1` · 基础容器 `0.5.0` / `kdna.read/0.6.4`）运行时义务与 94 条正反决策向量；Container `0.6.0` 测试入口为 `npm run conformance:container-0.6`；`conformance/` 根目录其余套件与 `fixtures/` 仅保留作历史 `0.1.0` `planLoad` 回归样本 |
| [`specs/`](./specs) 与 [`rfcs/`](./rfcs) | 规范索引（[`SPEC-INDEX.md`](./SPEC-INDEX.md#kdna-public-specification-index)）与演进提案 |
| [`examples/native-team-update`](./examples/native-team-update/README.md) | 最小合成教学夹具对（`1.0.0` / `1.1.0`），用于演示 CLI 读取与 `kdna diff` 命令 |

配套开源仓库与应用：
- [`aikdna/kdna-cli`](https://github.com/aikdna/kdna-cli) — 官方命令行工具（`@aikdna/kdna-cli@0.45.2`），负责创建、本地加密、校验、读取、对比与修订 `0.6.0` `.kdna` 作品
- [`aikdna/kdna-skills`](https://github.com/aikdna/kdna-skills) — 面向主流 AI Agent 的创作与读取技能包（`kdna-creator`、`kdna-loader`）及本地 stdio MCP 适配器（`@aikdna/kdna-mcp-server@0.8.4`）
- [`aikdna/kdna-assets`](https://github.com/aikdna/kdna-assets) — 官方公开 `.kdna` 作品仓库（含《KDNA 白皮书》`v1.0.2` 中英双语正式版）
- [KDNA Reader 桌面版](https://aikdna.com/zh/downloads)（[`aikdna/kdna-reader-releases`](https://github.com/aikdna/kdna-reader-releases)） — 永久免费、已获 Apple 公证的 macOS（Apple Silicon）桌面阅读器（免登录离线阅读内置白皮书与本地 `.kdna` 文件，可选免费 `KDNA ID` 开启多标签对照；不提供在线托管 Web 阅读器，非 Mac 用户可使用 CLI、MCP 或 `/explore` 网页）

### 活跃发布坐标（Container `0.6.0`）

| npm 包 | 版本 | 标签 | 说明 |
| --- | --- | --- | --- |
| `@aikdna/kdna-core` | `0.37.11` | `latest` | Container `0.6.0` & `0.5.0` 准入、Canonical IR、摘要与离线口令加密 |
| `@aikdna/kdna-read` | `0.13.5` | `latest` | 按需读取协议（`catalog`、`exact_selection` 必需闭包、`expand`） |
| `@aikdna/kdna-cli` | `0.45.2` | `latest` | 官方 CLI（Node.js `>=22`，永久无需在线账号） |
| `@aikdna/kdna-mcp-server` | `0.8.4` | `latest` | 可选本地 stdio MCP 适配器（来自 [`aikdna/kdna-skills`](https://github.com/aikdna/kdna-skills)） |

> **版本说明：** 所有 Container `0.6.0` 作品的创作、加密、读取与对比请统一使用 **`@aikdna/kdna-cli@0.45.2`**（如需 MCP 接入请使用 **`@aikdna/kdna-mcp-server@0.8.4`**）。早期的 Studio（`0.5.0`）与 `0.36.1` 历史线仅保留作旧版本归档，详见 [当前状态](./docs/status.zh.md) 与 [0.5 → 0.6 迁移清单](./docs/migration-checklist.md)。

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

代码采用 [Apache-2.0](./LICENSE) 许可；文档与示例许可详见 [`LICENSE-DOCS`](./LICENSE-DOCS) 与 [`NOTICE`](./NOTICE)。
