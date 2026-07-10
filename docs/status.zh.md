# KDNA Core 状态 — 2026 年 7 月

> 中文摘要。完整技术状态请参见 [status.md](./status.md)（英文）。

## 当前定位

KDNA Core v1 已正式发布。`.kdna` 是开放的判断资产文件格式与运行时加载合约。

## 稳定功能

- **`.kdna` 文件格式** — 容器结构、清单 schema、payload profile v1、校验和
- **`kdna validate`** — 本地 v1 容器完整校验
- **`kdna plan-load`** — 加载前检查（权利状态、访问模式）
- **`kdna load`** — 渲染 agent 可读的判断上下文（`--profile=index|compact|scenario|full`，`--as=json|prompt`）
- **`kdna pack` / `kdna unpack`** — 确定性打包与解包
- **`kdna identity` / `kdna sign` / `kdna verify`** — Ed25519 签名体系
- **`kdna revoke` / `kdna revocation-status`** — 撤销状态机
- **`kdna load --remote-server`** — 远程资产加载（需自托管 kdna-remote-server）
- **`kdna route` / `kdna compose` / `kdna project`** — 带 Trace 的选择、有限组合与已打包资产投影
- **`kdna eval-consumption`** — 使用公开安全 fixture 的消费评测、预算报告与审查流程

## 安装

```bash
npm install -g @aikdna/kdna-cli   # 运行时 CLI（v0.29.0）
npm install -g @aikdna/kdna-studio-cli  # 创作 CLI（v0.8.12）
```

需要按任务选择、组合和评测资产时，请参见[消费运行时指南](./consumption-runtime.md)。

## 公共资产

| 资产 | 版本 | 用途 |
|---|---|---|
| agent:project_context | 0.1.2 | 判断 AGENTS.md 每一行该保留/迁移/删除/转换 |
| agent:completion_adjudication | 0.1.1 | 迫使 agent 在说"完成"前给出可证伪的依据 |

→ [kdna-assets](https://github.com/aikdna/kdna-assets)

## 实验性

- `kdna-studio`：AI 辅助创作功能（distill、interview、feynman）为实验性
- `kdna-core-swift`：Swift 运行时，测试覆盖率仍在追赶 JS 端

## 路线图

→ [公开路线图](./public-roadmap.md)
