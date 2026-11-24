# KDNA 当前状态

[English](./status.md) | 简体中文

## 现行稳定线（Container `0.6.0`）

当前所有新作品与工具链均基于 **Container `0.6.0`** 与按需读取协议（`catalog` → `exact_selection`）。各核心包已发布在 npm `latest`，精确版本与 SHA-256 见 [`release-coordinates.json`](./release-coordinates.json)：

| 组件 | 当前版本 | 作用 |
| --- | --- | --- |
| `@aikdna/kdna-core` | `0.37.11` | Container `0.6.0` 与 `0.5.0` 校验、规范摘要、作品打包与本地口令加密（`RFC-0018`） |
| `@aikdna/kdna-read` | `0.13.5` | 按需读取协议（`catalog` 目录、`exact_selection` 精确选读与前提闭包、本地解锁） |
| `@aikdna/kdna-cli` | `0.45.2` | 官方命令行（`init`、`validate-input`、`create`、`protect`、`unprotect`、`inspect`、`validate`、`read`、`diff`、`source-open`、`source-pack`、`convert`） |
| `aikdna/kdna-skills` | `main`（MCP `0.8.4`） | Agent 技能包（`kdna-creator`、`kdna-loader`）与可选本地 stdio MCP 适配器 |
| `aikdna/kdna-assets` | 《KDNA 白皮书》`v1.0.2`（中/英双语） | 官方公开 `.kdna` 作品（`CC BY 4.0`） |
| **KDNA Reader** | macOS 桌面应用（Apple Silicon · [`aikdna.com/zh/downloads`](https://aikdna.com/zh/downloads) / [`aikdna/kdna-reader-releases`](https://github.com/aikdna/kdna-reader-releases)） | 永久免费、已获 Apple 公证的 macOS 桌面阅读器（打开即可免登录离线阅读内置双语《KDNA 白皮书》与本地公开/口令保护 `.kdna` 文件；可选免费登录 `KDNA ID` 开启多标签对照；其他中英双语示范作品可免登录通过 `/explore` 与 [`aikdna/kdna-assets`](https://github.com/aikdna/kdna-assets/releases) 下载；不提供在线托管 Web 阅读器，非 Mac 用户可使用 CLI、MCP 或 `/explore` 网页） |

创建、校验、本地口令加密、按需读取、版本对比以及桌面离线阅读全链路**永久无需在线账号**，均可完全离线使用。

## 已归档历史线

- **Container `0.5.0`（旧版 Studio 会话线）**：`@aikdna/kdna-studio-cli@0.14.0` 与 `@aikdna/kdna-studio-core@4.1.0` 仅保留用于维护历史 `0.5.0` 项目，不再用于新建 `0.6.0` 作品（迁移见 [0.5 → 0.6 迁移核对清单](./migration-checklist.md)）。
- **Container `0.1.0`（旧版 `CLI 0.36.1`）**：早期的 `plan-load`、`load` 与 `Runtime Capsule` 流程已退役，现行统一采用 `inspect` → `validate` → `read`。

## 相关文档

- [从这里开始](./start-here.zh.md) · [成熟度说明](./maturity.md) · [发布支持与渠道历史](./current-release-support.md) · [公开路线图](./public-roadmap.md)
