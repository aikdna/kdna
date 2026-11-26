# 从这里开始（Start Here）

[English](./start-here.md) | 简体中文 · [返回中文首页](../README.zh.md) · [KDNA Reader 桌面版](https://aikdna.com/zh/downloads) · [Agent 接入指南](./agent-entry.md)

几分钟上手 KDNA：用 **KDNA Reader 桌面版**亲眼读一份真实 `.kdna` 作品，或者用官方命令行 **`@aikdna/kdna-cli@0.46.0`**（Container `0.6.0`，需 Node.js `>=22`，永久无需在线账号）自己创建、加密并读取。

---

## 1. 先读一份真实的 `.kdna` 作品

直接打开首部官方双语作品 **《KDNA 白皮书》`v1.0.2`**（作者：张零 / Zhang Ling · `CC BY 4.0` · `45` 条关联判断）：

- **macOS 桌面阅读器（Apple Silicon · 永久免费、已获 Apple 公证）：** [下载 KDNA Reader](https://aikdna.com/zh/downloads)（GitHub Releases 镜像：[`aikdna/kdna-reader-releases`](https://github.com/aikdna/kdna-reader-releases)） — 打开即可免登录离线阅读内置中英双语《KDNA 白皮书》与本地公开或口令保护 `.kdna` 文件，同时可选免费登录 `KDNA ID` 开启多标签对照。其他中英双语示范 `.kdna` 作品可免登录直接从 [aikdna.com/zh/explore](https://aikdna.com/zh/explore) 与 [`aikdna/kdna-assets`](https://github.com/aikdna/kdna-assets/releases) 获取。（不提供在线托管 Web 阅读器；非 Mac 用户可使用 `@aikdna/kdna-cli`、`@aikdna/kdna-mcp-server` 或访问 [aikdna.com/zh/explore](https://aikdna.com/zh/explore)。）
- **`.kdna` 原件直链下载：**
  - 中文版（`zh-CN`）：[`kdna-whitepaper-1.0.2.zh-CN.kdna`](https://aikdna.com/downloads/whitepaper/v1.0.2/kdna-whitepaper-1.0.2.zh-CN.kdna)（`2,725,359` 字节 · SHA-256 `e344944a53f8d4bb2ca40a8d42bcd3c104e3067bfa92dce99e327cbc5aed40aa`）
  - 英文版（`en`）：[`kdna-whitepaper-1.0.2.en.kdna`](https://aikdna.com/downloads/whitepaper/v1.0.2/kdna-whitepaper-1.0.2.en.kdna)（`2,843,386` 字节 · SHA-256 `6da515820eed210508d72a4ddbf68f7052cb180afe592c64e85e9a3fbb60c49e`）

---

## 2. 30 秒命令行体验（`@aikdna/kdna-cli@0.46.0`）

需要 **Node.js `>=22`**，全部在本地运行，**永久无需注册任何在线账号**：

```bash
# 1. 创建：生成示例草稿，校验并打包为 Container 0.6.0 .kdna 作品
npx -y @aikdna/kdna-cli@0.46.0 init --example --mode interview --output draft.json
npx -y @aikdna/kdna-cli@0.46.0 validate-input draft.json --format human
npx -y @aikdna/kdna-cli@0.46.0 create --draft draft.json --output my-judgments.kdna --allow-create

# 2. 校验与按需读取：先看目录，再按需选取目标判断及关联前提
npx -y @aikdna/kdna-cli@0.46.0 validate my-judgments.kdna
npx -y @aikdna/kdna-cli@0.46.0 read my-judgments.kdna --mode catalog --allow-read --format human
npx -y @aikdna/kdna-cli@0.46.0 read my-judgments.kdna \
  --mode exact_selection \
  --judgment-id decision:first-dilemma \
  --allow-read --compact

# 3. 导出单页作者审阅单并本地离线口令加密（RFC-0018 AEAD，支持 --password-prompt 或 --password-env，不在磁盘留下明文口令文件）
npx -y @aikdna/kdna-cli@0.46.0 review my-judgments.kdna --allow-read --output my-judgments-review.md
npx -y @aikdna/kdna-cli@0.46.0 protect my-judgments.kdna --output locked.kdna --password-prompt
KDNA_PASS='a long passphrase' npx -y @aikdna/kdna-cli@0.46.0 read locked.kdna \
  --mode exact_selection \
  --judgment-id decision:first-dilemma \
  --allow-read --password-env KDNA_PASS --format human
```

两条实用提示：
- `--allow-create` 与 `--allow-read` 只代表允许本次本地读写 `.kdna` 文件，不会授予任何外部系统动作权限。
- 让 AI Agent 读取多条判断作品时，请始终带上 `--format human` 或 `--compact`，遵循 `catalog` → `exact_selection` 按需读取，不要用 `--mode whole_asset` 期待直接吐出正文。

---

## 3. 按你的目标继续探索

| 我想要…… | 推荐入口 |
| --- | --- |
| **理解为什么判断和品味需要独立文件格式** | [为什么是 KDNA](./why-kdna.zh.md) · [什么是判断系统](./judgment-systems.zh.md) · [为什么叫 KDNA](./why-the-name.zh.md) |
| **在 Claude Code / Cursor / Codex / Antigravity 里用 `.kdna`** | [Agent 接入指南](./agent-entry.md) · [`aikdna/kdna-skills`](https://github.com/aikdna/kdna-skills) |
| **亲手创作第一份 `.kdna` 作品** | [创作指南（中文）](./authoring-guide.zh.md) |
| **在本地浏览器离线检查 `.kdna` 容器结构（零上传）** | 直接双击打开仓库内的 `docs/inspector/index.html` |
| **查阅协议技术规范与版本状态** | [SPEC.md](../SPEC.md) · [当前状态（中文）](./status.zh.md) · [公开路线图](./public-roadmap.md) |
| **将旧版 `0.5.0` 作品迁移到 `0.6.0`** | [`0.5 → 0.6` 迁移核对清单](./migration-checklist.md) |
| **参与贡献或反馈安全问题** | [`CONTRIBUTING.md`](../CONTRIBUTING.md) · [安全说明](./SECURITY.zh.md) |

---

## 4. 开源生态地图

| 仓库 / 应用 | 职责 |
| --- | --- |
| [`aikdna/kdna`](https://github.com/aikdna/kdna) | 开放协议规范、Schema、一致性测试套件以及 `@aikdna/kdna-core` / `@aikdna/kdna-read` 参考实现 |
| [`aikdna/kdna-cli`](https://github.com/aikdna/kdna-cli) | 官方命令行工具（`@aikdna/kdna-cli@0.46.0`）：创建、口令加密、校验、按需读取、对比差异与修订 |
| [`aikdna/kdna-skills`](https://github.com/aikdna/kdna-skills) | Agent 技能包（`kdna-creator`、`kdna-loader`）与可选本地 stdio MCP 适配器 |
| [`aikdna/kdna-assets`](https://github.com/aikdna/kdna-assets) | 官方公开 `.kdna` 作品仓库（含中英双语《KDNA 白皮书》`v1.0.2`） |
| [KDNA Reader 桌面版](https://aikdna.com/zh/downloads) · [`kdna-reader-releases`](https://github.com/aikdna/kdna-reader-releases) | 永久免费 macOS（Apple Silicon）桌面阅读器（免登录离线阅读内置白皮书与本地 `.kdna` 文件，可选免费 `KDNA ID` 开启多标签对照；不提供在线托管 Web 阅读器，非 Mac 用户可使用 CLI、MCP 或 `/explore` 网页） |
