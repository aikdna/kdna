# KDNA 公开状态

> 当前公开状态的中文摘要。版本级命令事实见各包的 CHANGELOG 和
> [工具状态矩阵](./tool-status-matrix.md)。

## 产品定位

KDNA 是开放的判断资产协议。任何人、Agent 或工具都可以创建 `.kdna` 文件。
KDNA Core 校验结构、完整性、来源声明和授权事实；它不判断内容是否正确、专业、
有用或值得采用。

当前默认消费路径从一份明确选择的文件或一项精确、经用户批准的 Host 附加项开始：

```text
inspect → validate → LoadPlan → authorization → load/project
→ Runtime Capsule → Agent Host
```

协议不要求全局资产库、安装步骤、自动发现或 Agent Skill。保存或发现文件不等于
授权；授权不等于每个任务都适用；加载成功不等于 Agent 已遵循，也不保证结果更好。

## 当前成熟度

整个生态处于预发布阶段。本页不会把任何组件提升为 Beta、stable 或 GA。

| 层级 | 状态 | 含义 |
|---|---|---|
| `.kdna` 容器与 JS Core | Pre-release / 参考实现 | 当前格式、校验与加载合同，精确版本仍需按发布证据判断 |
| Runtime CLI | Pre-release | `inspect`、`validate`、`plan-load`、`load`、`pack`、`unpack` |
| Studio 创作工具链 | Pre-release | 项目、判断卡、编译和 `.kdna` 导出 |
| 加密、授权、签名与撤销 | Pre-release / Candidate | 技术原语不等于内容认证或托管商业服务 |
| Remote / Activation 服务器 | Experimental | 可自托管参考实现，不代表 AIKDNA 提供线上服务 |
| 多资产、路由、评测表面 | Experimental | 待重新认证的高级实现，不属于默认路径 |
| Swift、Web、React、编辑器和 Agent 适配 | 各自独立 | 必须检查精确版本、依赖坐标和证据 |
| `kdna-loader` Skill | Unassessed | 使命保留；旧的广泛发现与静默加载模型不是当前 Host 合同 |

## 用户与 Host 边界

兼容 Host 只能从用户明确选择的文件或已经批准并固定身份、版本、digest 的附加项
开始。在资产生效时，它必须显示资产身份、作用域和采用原因，并提供停用、切换和
回滚入口。Skill 和 MCP 只能是薄适配器，不能替用户决定权威。

## 公开边界

- 有效资产不要求行为实验、真人背书、官方批准或注册表登记。
- 公开参考资产只展示技术工具链，不代表内容认可。
- Prompt、Skill、Policy、Memory 和普通文档都可以携带判断；KDNA 增加的是独立
  身份、版本、完整性、授权、加载和投影合同。
- 托管注册表、市场、计费和 AIKDNA 托管加载服务不属于当前公开基线。
- 已发布版本保持自己的历史合同；未发布纠正候选不能被叙述成已经上线。

参见[成熟度](./maturity.md)、[公开路线图](./public-roadmap.md)和
[核心叙事与边界](./core-narrative-and-boundaries.md)。
