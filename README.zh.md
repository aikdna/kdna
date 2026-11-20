# KDNA

[English](./README.md) | 简体中文 · [官方网站](https://aikdna.com/zh) · [KDNA Reader 桌面版](https://aikdna.com/zh/downloads) · [社区讨论](https://github.com/aikdna/kdna/discussions) · [中文文档](./docs/start-here.zh.md) · [认知原石实验室](https://aikdna.cn)

**面向思考、判断与品味的开放文件格式。**

文字与排版有文档（`.md`、`.pdf`），数据与测算有表格，现场演讲有幻灯片，互联页面有网页（HTML），确定性逻辑有代码。唯独一个人在真实实践中打磨出的**思考、判断、取舍次序、适用边界与审美品味**，过去一直散落在聊天记录、零散笔记和一次性成品里，没有属于自己的独立文件形态。

当 AI 让文章、界面和代码的生成越来越容易，真正稀缺、真正决定作品高下的，恰恰是背后那套思考、判断与品味——**它们本身就是“作品”**。KDNA（`.kdna`）为这类作品提供开放、清晰、可演进的文件格式：无论是一份围绕某个具体问题提炼出的六七条精炼判断，还是覆盖完整领域的几十条关联判断，都可以独立保存为一份 `.kdna` 作品。人可以在 [KDNA Reader 桌面版](https://aikdna.com/zh/downloads)里直接阅读与审视，兼容的 AI Agent 也可以按需读取对应判断，并完整带上它的依据与停手边界。

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
- **KDNA Reader 桌面版（macOS · Apple Silicon · 已获 Apple 公证）：** [aikdna.com/zh/downloads](https://aikdna.com/zh/downloads)（永久免费；默认提供免费 `KDNA ID` 注册与登录以解锁内置中英双语《KDNA 白皮书》与多标签对照，同时支持免登录直接打开单个本地公开或口令保护 `.kdna` 文件）
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

# 3. 本地口令加密（离线 AEAD 加密，不依赖任何在线账号）
printf '%s' 'a long passphrase' > password.txt
npx -y @aikdna/kdna-cli@0.45.2 protect my-judgments.kdna --output locked.kdna --password-file password.txt
npx -y @aikdna/kdna-cli@0.45.2 read locked.kdna \
  --mode exact_selection \
  --judgment-id decision:first-dilemma \
  --allow-read --password-file password.txt --format human
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
| [`packages/kdna-conformance`](./packages/kdna-conformance) (`@aikdna/kdna-conformance`) | 历史 `0.1.0`/`0.36.1` 一致性测试包（现行 `0.6.0` 容器核验使用 `conformance/canonical-conformance.mjs`） |
| [`conformance/`](./conformance) 与 [`fixtures/`](./fixtures) | 版本化正反测试样本与参考向量 |
| [`specs/`](./specs) 与 [`rfcs/`](./rfcs) | 规范索引（[`SPEC-INDEX.md`](./SPEC-INDEX.md#kdna-public-specification-index)）与演进提案 |
| [`examples/native-team-update`](./examples/native-team-update/README.md) | 最小合成教学夹具对（`1.0.0` / `1.1.0`），用于演示 CLI 读取与 `kdna diff` 命令 |

配套开源仓库与应用：
- [`aikdna/kdna-cli`](https://github.com/aikdna/kdna-cli) — 官方命令行工具（`@aikdna/kdna-cli@0.45.2`），负责创建、本地加密、校验、读取、对比与修订 `0.6.0` `.kdna` 作品
- [`aikdna/kdna-skills`](https://github.com/aikdna/kdna-skills) — 面向主流 AI Agent 的创作与读取技能包（`kdna-creator`、`kdna-loader`）及本地 stdio MCP 适配器
- [`aikdna/kdna-assets`](https://github.com/aikdna/kdna-assets) — 官方公开 `.kdna` 作品仓库（含《KDNA 白皮书》`v1.0.2` 中英双语正式版）
- [KDNA Reader 桌面版](https://aikdna.com/zh/downloads) — 永久免费无限制的 macOS 桌面阅读器

> **版本说明：** 所有当前 Container `0.6.0` 作品的创作、加密、读取与对比请统一使用 **`@aikdna/kdna-cli@0.45.2`**。早期的 Studio（`0.5.0`）与 `0.36.1` 历史线仅保留作旧版本归档，详见 [当前状态](./docs/status.zh.md) 与 [0.5 → 0.6 迁移清单](./docs/migration-checklist.md)。

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
