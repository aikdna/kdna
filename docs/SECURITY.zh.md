# 安全策略

> **规范安全策略主文档：** 请参阅仓库根目录 [`SECURITY.md`](../SECURITY.md) 了解当前 Container `0.6.0` 安全边界、本地口令加密说明与官方包坐标核验规则。

## 报告漏洞

如发现 KDNA 工具体系安全漏洞，请通过 [GitHub 私密安全通告](https://github.com/aikdna/kdna/security/advisories/new) 或发送邮件至 **hi@aikdna.com**（或 **security@aikdna.com**）私密报告，72 小时内响应。请勿公开提交 Issue。

## 范围

本策略覆盖 KDNA 开源工具与协议实现（`@aikdna/kdna-core`、`@aikdna/kdna-read`、`@aikdna/kdna-cli`、`@aikdna/kdna-mcp-server`、`kdna-skills` 及历史归档包）。`.kdna` 文件中的领域判断内容是否适用具体场景，由作者与使用者自行评估负责。

## 支持的版本

| 工具 | 版本 | 状态 |
| --- | --- | :---: |
| `@aikdna/kdna-core` | `0.37.11`（Container `0.6.0` & `0.5.0`） | 活跃 |
| `@aikdna/kdna-read` | `0.13.5`（按需读取协议） | 活跃 |
| `@aikdna/kdna-cli` | `0.44.x`（Container `0.6.0`） | 活跃 |
| `@aikdna/kdna-mcp-server` | `0.8.x`（Container `0.6.0`） | 活跃 |
| `@aikdna/kdna-studio-cli` / `@aikdna/kdna-studio-core` | `0.14.0` / `4.1.0`（旧版 `0.5.0` 归档线） | 历史归档 |

详见英文原版：[SECURITY.md](./SECURITY.md) 与根目录 [`SECURITY.md`](../SECURITY.md)。
