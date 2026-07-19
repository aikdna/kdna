# KDNA Core 状态 — 2026 年 7 月

> 中文摘要。完整技术状态请参见 [status.md](./status.md)（英文）。

## 当前定位

KDNA Core 是 KDNA 判断资产格式与运行时加载合约的公开 beta 实现。`.kdna` 是开放的判断资产文件格式。

## 已发布的基础功能

下列命令已在当前 CLI 中发布；“已发布”不表示 KDNA Core/CLI 已达到 GA，
整体工具链当前仍为 Beta。

- **`.kdna` 文件格式** — 单一当前容器结构、清单 schema、CBOR payload profile、校验和
- **`kdna validate`** — 当前 `.kdna` 容器完整校验
- **`kdna plan-load`** — 加载前检查（权利状态、访问模式）
- **`kdna load`** — 渲染 agent 可读的判断上下文（`--profile=index|compact|scenario|full`，`--as=json|prompt`）
- **`kdna pack` / `kdna unpack`** — 确定性打包与解包
- **`kdna identity` / `kdna sign` / `kdna verify`** — Ed25519 签名体系
- **`kdna revoke <asset>` / `kdna revocation status <asset>`** — 撤销状态机
- **`kdna load --remote-server`** — 远程资产加载（需自托管 kdna-remote-server）

## Beta 消费编排功能

- **`kdna route` / `kdna compose` / `kdna project`** — 带 Trace 的选择、有限组合与已打包资产投影
- **`kdna eval-consumption`** — 使用公开安全 fixture 的消费评测、预算报告与审查流程

## 安装

```bash
npm install -g @aikdna/kdna-cli   # 运行时 CLI（0.35.1）
npm install -g @aikdna/kdna-studio-cli  # 创作 CLI（0.10.2）
```

需要按任务选择、组合和评测资产时，请参见[消费运行时指南](./consumption-runtime.md)。

## 参考资产

公开资产仓库当前展示两个符合现行格式的技术参考资产和零个 Cluster。
展示不等于认可，也不代表已经证明行为价值；CLI 本地生成示范资产仍是
推荐的首次上手路径，协议不依赖官方持续生产内容。

→ [公开参考展示](https://github.com/aikdna/kdna-assets)

## 其他成熟度边界

- `kdna-studio`：AI 辅助创作功能（distill、interview、feynman）为实验性
- `kdna-loader` 为 Beta；MCP server adapter 为实验性
- `kdna-core-swift`：Beta 运行时，仍需持续维护与 JS Core 的一致性证据
- `@aikdna/kdna-eval@0.3.2` 已发布：实验性评测工具；输出是评价者范围内的证据，
  不是 Core 权威。CLI 的 Asset 观测矩阵不生成来源声明，Cluster 的 trust/economics
  晋级必须在可信证据生产者内调用 Eval API
- `@aikdna/kdna@0.13.2` 已发布：面向 CLI 0.35.1 的维护中 Legacy 兼容桥；
  新集成仍直接使用 CLI 与 Core
- `@aikdna/agent`、`@aikdna/kdna-artifact-engine` 与
  `@aikdna/kdna-fidelity-core` 为已弃用的历史 npm 坐标，不属于当前工具链

## 路线图

→ [公开路线图](./public-roadmap.md)
