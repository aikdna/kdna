> **预发布生态——正在核对精确合同与公开叙事**
>
> KDNA 是判断资产格式与生态。本仓库负责协议和 Core Runtime；其余公开仓库负责
> 创建、消费、授权、Apple、Web、Agent、编辑器和开发者集成。仓库使命、成熟度、
> 发布波次与兼容承诺是不同事实。

# KDNA

> **KDNA 让可复用判断获得独立身份和生命周期。**

KDNA 是开放的判断资产格式与运行协议。个人、团队、组织、Agent 和工具都可以
创建有边界的 `.kdna` 资产，让其中的判断、版本、来源、访问、投影和生命周期
独立于某个 Prompt、Skill、模型或应用被管理。

判断也可以继续存在于 Prompt、Skill、Policy、Memory、知识库、工作流、模型和
普通文档中。KDNA 只在判断需要独立文件与共享加载合同时增加价值，不宣称垄断
判断，也不承诺让模型更聪明或让输出自动更好。

KDNA Core 校验结构、完整性、来源声明和授权事实；它不决定资产内容是否真实、
正确、专业、优质或值得采用。兼容 Agent 消费遵循：

```text
明确文件或已授权附加
→ inspect
→ LoadPlan
→ authorization / integrity / compatibility
→ load/project
→ Runtime Capsule
→ Host / Agent
```

直接解压或解析原始 payload 不是兼容的 Agent 消费路径。

> 第一次使用 → [Start Here](./docs/start-here.md)
>
> KDNA 的定义与边界 → [Core Narrative and Boundaries](./docs/core-narrative-and-boundaries.md)
>
> 何时需要 KDNA → [Why KDNA](./docs/why-kdna.zh.md) · [什么时候使用 KDNA](./docs/when-to-use-kdna.zh.md)
>
> 当前状态与路线图 → [Status](./docs/status.zh.md) · [Public Roadmap](./docs/public-roadmap.md)

## 五分钟技术路径

当前推荐路径直接使用一份 `.kdna` 文件，不要求先建立全局资产库：

```bash
npm install -g @aikdna/kdna-cli

kdna demo judgment ./judgment
kdna pack ./judgment ./judgment.kdna
kdna validate ./judgment.kdna --runtime
kdna plan-load ./judgment.kdna --json
kdna load ./judgment.kdna --profile=compact --as=json
```

这条路径证明容器能够被当前工具链验证、规划和投影，不证明模型已经采用资产，
也不证明资产内容正确或结果更好。

## `.kdna` 是什么

一份 `.kdna` 是单文件、可携带的判断资产。当前容器包含公开 manifest、结构化
判断 payload、完整性摘要，以及按精确版本合同支持的可选加密、签名、来源和
谱系信息。

创作项目、展开 JSON、Registry 页面、receipt 和评价报告都可以围绕资产工作，
但不是 `.kdna` 分发对象本身。

## 本机与 Agent 使用边界

文件存在、保存副本、附加到工作区、授权、适用于当前任务和实际加载是六个不同
事实。KDNA 协议不要求“安装资产”才能使用；`~/.kdna`、项目 `.kdna/`、Store、
Registry、Skill 和 MCP 都只是产品实现选择。

当前稳定的技术入口是显式文件的 `validate → plan-load → load`。Agent 适配器的
最终产品模型仍在收敛：它只能执行用户明确选择或 Host 已授权的资产，不能从全机
任意资产中自主选择并隐藏使用。当前采用的资产身份、版本、作用域和原因必须可查，
并可停用、切换和回滚。

## Core 负责与不负责

Core 负责：

- 容器、Schema、Payload 与必需条目；
- 身份、版本、digest、兼容与可选谱系；
- 加密、签名、授权声明的技术表示；
- LoadPlan、Runtime 投影与 Capsule 合同；
- 兼容实现之间不静默改字节或丢关键语义。

Core 不负责：

- 裁定判断内容的普遍正误或质量；
- 认证作者专业性或现实身份；
- 决定当前任务该采用哪份资产；
- 授予文件、网络、支付或部署权限；
- 保证模型采用资产或结果更好。

## 创作自己的资产

Studio 是创作工具，不是格式合法性的唯一入口。当前命令行创作路径：

```bash
npm install -g @aikdna/kdna-studio-cli @aikdna/kdna-cli
kdna-studio create my-domain --name @yourscope/my-domain
kdna-studio card add my-domain axiom \
  --field one_sentence="一条有明确取舍含义的判断" \
  --field full_statement="说明这条判断如何影响选择" \
  --field why="说明理由" \
  --field applies_when='["适用情境"]' \
  --field does_not_apply_when='["不适用情境"]' \
  --field failure_risk="误用风险"
kdna-studio export my-domain --out ./my-domain.kdna
kdna validate ./my-domain.kdna
kdna plan-load ./my-domain.kdna
```

人、AI、Agent、工具和混合流程都可以创建资产。只有资产声称代表某个人或机构时，
才需要相应主体确认该代表关系。

## 17 仓生态

KDNA 的公开生态保留 17 个仓库使命，覆盖协议/Core、Runtime CLI、Studio、参考
资产、Apple、Agent/MCP/编辑器、Web、授权与远程消费。它们成熟度不同，也不会
同时发布。机器可读的精确版本与生命周期见
[`ecosystem-manifest.json`](./ecosystem-manifest.json)。

## 成熟度

当前整体是 **Pre-release**。已发布包、本地纠错候选、源码实验、Source-only 集成
和兼容承诺必须分别判断。请以精确版本的规范、Schema、fixture、conformance、
release notes 和产物为准。

## License

Apache-2.0。见 [LICENSE](./LICENSE)。
