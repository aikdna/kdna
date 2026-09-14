# KDNA 公开状态

> 当前公开状态的中文摘要。版本级命令事实见各包的 CHANGELOG 和
> [工具状态矩阵](./tool-status-matrix.md)。

## 产品定位

KDNA 是开放的判断资产协议。任何人、Agent 或工具都可以创建 `.kdna` 文件。
Core 入场建立捕获字节的技术有效性，不认证作者、不判断内容质量，不代表采用，
也不授予读取或行动权限。

当前默认消费路径从一份明确选择的文件或一项精确、经用户批准的 Host 附加项开始：

```text
明确字节 → Core 入场 → 私有 snapshot / Canonical IR
→ 独立可信 control / Host provider 下的公开 Read
→ read_envelope | admission_rejection | no_body_control | transport_failure
```

这是当前源码实现的边界，见 [Core/Read 指引](./core-read-current-status.md) 与
各包 README。加密、签名、checksums 文档入场、Runtime Capsule / Plan 入场与执行
在当前实现中不可用。已发布 CLI 0.36.1 的 LoadPlan / Runtime Capsule 线保留自己的
合同，不能把旧资产、接口或测试结果直接视为当前兼容。

协议不要求全局资产库、安装步骤、自动发现或 Agent Skill。保存或发现文件不等于
授权；授权不等于每个任务都适用；加载成功不等于 Agent 已遵循，也不保证结果更好。

## 当前成熟度

整个生态处于预发布阶段。本页不会把任何组件提升为 Beta、stable 或 GA。

| 层级 | 状态 | 含义 |
|---|---|---|
| `.kdna` 容器与 JS Core | Pre-release / 参考实现 | 当前源码提供入场、snapshot 与 Read；版本化格式/加载规范不等于全部能力已实现 |
| Runtime CLI | Pre-release | 当前源码为 `inspect`、`validate`、`read`；CLI 0.36.1 的加载/打包命令属于已发布旧线 |
| Studio 创作工具链 | Pre-release | 当前 typed session、保存 bundle 复验与明确 Read；project/card 属于已发布 Studio CLI 0.11.0 |
| 加密、授权、签名与撤销 | 按精确版本判断 | 当前 Core 不支持加密/签名容器入场；已发布 Core 0.22.0 的能力不继承到当前候选 |
| Remote / Activation 参考实现 | Experimental | Remote 为 HTTP Read handler；Activation 为同进程 store observer，无独立 server/CLI，不代表托管服务 |
| 多资产、路由、评测表面 | Experimental | 待重新认证的高级实现，不属于默认路径 |
| Swift、Web、React、编辑器和 Agent 适配 | 各自独立 | 必须检查精确版本、依赖坐标和证据 |
| `kdna-loader` Skill | Unassessed | 使命保留；旧的广泛发现与静默加载模型不是当前 Host 合同 |

## 从哪里开始

当前源码使用 [Core/Read 指引](./core-read-current-status.md)、
[CLI README](https://github.com/aikdna/kdna-cli#readme) 和
[Studio CLI README](https://github.com/aikdna/kdna-studio-cli#readme) 的精确依赖与入口。
源码可用不代表 npm 发布、真人采用或原生 Host 验收。

需要重现旧发布线时，使用 [Start Here](./start-here.md#5-minute-quick-start) 中固定
CLI 0.36.1 的示例；创作使用 [完整教程](./30-minute-authoring-guide.md) 中固定的
Studio CLI 0.11.0。必须添加完整判断卡并确认判断后才能导出，空项目不能导出。
不混用当前候选；完整坐标与能力范围见 [版本矩阵](./version-and-capability-matrix.md)。

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
