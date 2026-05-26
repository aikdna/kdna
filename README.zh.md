# KDNA — 面向 AI 系统的开放判断协议

> [aikdna.com](https://aikdna.com) — 官方网站 . [![npm](https://img.shields.io/npm/v/@aikdna/kdna-cli)](https://www.npmjs.com/package/@aikdna/kdna-cli)

**KDNA 是面向 AI 系统的开放判断协议。**

它把经过人类治理的领域判断，转化为 Agent 可加载、可追踪、可验证、可进化的可携带结构资产。

Prompt 改变表达。RAG 扩展信息获取。Skill/工具扩展行动能力。  
**KDNA 加载领域判断。**

KDNA 不是让 Agent 扮演专家，而是让 Agent 在一套明确的判断系统中工作。

KDNA 不是提示词库，不是知识库，也不是操作手册。它是一种结构化方式，封装一个领域的判断层：公理、术语边界、常见误解、场景信号、推理链条和能力演进。

> **本仓库仅定义 KDNA 协议、Schema、校验规则与治理方式。**  
> 具体领域的 KDNA 应放在[独立仓库](#领域仓库)中，符合收录标准后进入官方 [kdna-registry](https://github.com/aikdna/kdna-registry)。
> 安装 KDNA 到你的 Agent，使用 [kdna-skills](https://github.com/aikdna/kdna-skills)。  
> 添加领域到注册表的标准详见 [docs/registry-policy.md](./docs/registry-policy.md)。

## 为什么现在需要 KDNA

> **Agent 越来越会调用工具，但它们仍然缺少领域判断。**

当前的 Agent 生态已经解决了"行动"问题：函数调用、MCP、工具使用、工作流。但能行动不等于能判断——一个什么都能做的 Agent，如果分辨不了"价格异议"和"确定性缺失"，就会带着自信执行错误的操作。

工具让 AI 能行动。**KDNA 让 AI 不乱行动。**

自我改进型 Agent 需要判断治理。没有显式判断的改进，本质上只是漂移。KDNA 是人类判断治理的自我改进基础设施：Agent 可以从工作中学习，但判断标准的更新必须经过人类判断锁定。

每个领域都有专家级的判断模式，目前只存在于资深从业者的头脑中。KDNA 是一种把这些模式提取出来、编码为可机器验证的结构、作为判断参照层加载到 Agent 中的格式——独立于 Prompt，独立于知识库，独立于工具。

## KDNA 三层体系

AIKDNA = 生态/品牌  
KDNA Protocol = 开放判断协议  
KDNA Domain Package = 可携带的领域判断资产

**协议优先。产品是参考实现。**

KDNA Protocol 是开放的。KDNA CLI 是参考工具。KDNAChat 是使用和对比判断的参考客户端。KDNAStudio 是编写和锁定领域的参考环境。KDNAWork 是工作流中应用判断的参考工作空间。第三方应用可以实现同样的运行时协议。

## 为什么需要 KDNA

大多数 Agent 框架关注工具、检索、工作流或记忆。KDNA 关注的是**判断力**：

- Agent 应该从哪些假设出发？
- 这个领域里哪些概念是核心？
- 哪些术语应该使用，哪些应该避免？
- 哪些常见误解应该被提前识别？
- 哪些场景信号应该改变 Agent 的响应策略？
- Agent 应该如何从原则推导到行动？

## Before / After KDNA

> **KDNA 优化的不是措辞，而是推理路径。**

| 没有 KDNA | 有 KDNA |
|---|---|
| 通用、知识层面的回答 | 领域特化的专家判断 |
| 把反对意见当作字面陈述 | 诊断隐藏在话语背后的不确定性 |
| "客户说太贵 → 给折扣" | "价格异议是确定性缺失 → 诊断是哪个维度" |
| "员工不执行 → 积极性问题" | "执行失败 → 检查上游系统条件" |
| "老人不参加 → 活动不够有趣" | "拒绝参与 → 识别隐形障碍（恐惧、负担感、尊严威胁）" |
| 这是个 Prompt 库 | 这是个认知编码格式 |
| 无法验证 | 每个公理、误解、自查项都可测试 |

详见 [`docs/kdna-in-action.md`](./docs/kdna-in-action.md)（英文），包含五个详细案例：相同输入，不同 KDNA 领域，完全不同的认知路径。

## KDNA 与 Skill 的关系

| 维度 | KDNA | Skill |
|---|---|---|
| 核心角色 | 认知框架 | 执行流程 |
| 核心问题 | Agent 应该怎么思考？ | Agent 应该做什么？ |
| 激活方式 | 作为领域判断加载 | 为某个任务调用 |
| 成功标志 | 判断力更好，领域错误更少 | 任务完成 |
| 典型内容 | 公理、本体、模式、推理 | 步骤、脚本、模板、工具 |

**Skill 负责执行。KDNA 塑造判断。**

## KDNA 与 LLM Wiki

KDNA 不替代 LLM Wiki——它们构成一条流水线：

```
原始材料  →  LLM Wiki  →  KDNA  →  Skills / Agents
```

| 层级 | LLM Wiki | KDNA |
|---|---|---|
| 角色 | 知识组织 | 认知编码 |
| 产出 | 链接化的 Markdown 知识库 | 领域公理、模式、判断 |
| 问题 | 团队知道什么？ | Agent 应该如何思考？ |
| 用户 | 人和 Agent | 加载领域判断的 Agent |

LLM Wiki 将文档转化为知识。KDNA 将专业知识转化为判断力。

> LLM Wiki turns documents into knowledge.  
> KDNA turns expertise into judgment.

## 文件体系

一个完整的 KDNA 领域最多包含六个文件：

```text
KDNA_Core.json        # 公理、本体、框架、核心因果结构、立场
KDNA_Patterns.json    # 术语、禁用词、常见误解、自查清单
KDNA_Scenarios.json   # 场景触发信号和行动导向
KDNA_Cases.json       # 展示结构而非脚本的完整案例
KDNA_Reasoning.json   # 推理链：结论 → 逻辑 → 实践后果
KDNA_Evolution.json   # 成长阶段、能力层次、可测量指标
```

最小有效 KDNA 领域：

```text
KDNA_Core.json
KDNA_Patterns.json
```

## 快速开始

```bash
npm i -g @aikdna/kdna-cli
kdna --help
```

或克隆仓库：

```bash
git clone https://github.com/aikdna/kdna.git
cd KDNA
npm install
npm run lint:examples
```

校验一个领域：

```bash
npx kdna dev validate examples/decision_state
```

## 安装到你的 Agent

```bash
npm i -g @aikdna/kdna-cli
kdna setup
```

`kdna setup` 自动检测你的 Agent（OpenCode、Codex、Claude Code、Cursor、Gemini），安装 `kdna-loader` 技能，并创建数据目录。

只有 **一个** 技能：

| 技能 | 作用 |
|---|---|
| **kdna-loader** | 加载领域认知——检测领域、应用公理、运行自查。领域是数据资产，由 CLI 管理。 |

支持 **Codex**、**Claude Code**、**OpenCode**、**Cursor** 和 **GitHub Copilot**。

## 本地使用 KDNA

```bash
# 1. 安装 CLI + 技能
npm i -g @aikdna/kdna-cli
kdna setup

# 2. 装一个领域（asset_digest + 签名验证）
kdna install @aikdna/writing
# 装到 ~/.kdna/packages/@aikdna/writing/0.7.2/writing-0.7.2.kdna

# 3. 检查
kdna list
kdna verify @aikdna/writing --judgment
```

要创建自己的领域：

```bash
kdna init my_expertise
# 填写 KDNA_Core.json 和 KDNA_Patterns.json
kdna dev validate my_expertise
kdna publish my_expertise
```

或使用 **KDNAChat** Mac App 或 **VS Code 插件** 进行引导式创作。从[最小模板](./templates/minimal-domain/)开始也很方便。

## 规范

完整 v1.0-rc 规范见 [SPEC.md](./SPEC.md)。

### 试试 Demo

```bash
node examples/minimal-agent/agent.js
```

同一个用户输入，加载不同的 KDNA 领域，产生完全不同的认知分析。不需要 LLM——纯粹的判断路径对比。

## 领域仓库

领域认知包存放在独立仓库中。官方机器可读索引见 [aikdna/kdna-registry](https://github.com/aikdna/kdna-registry)。

| 领域 | 仓库 | 状态 |
|---|---|---|
| Writing | [kdna-writing](https://github.com/aikdna/kdna-writing) | experimental |
| Knowledge Management | [kdna-knowledge_management](https://github.com/aikdna/kdna-knowledge_management) | experimental |
| Prompt Diagnosis | [kdna-prompt_diagnosis](https://github.com/aikdna/kdna-prompt_diagnosis) | experimental |
| Agent Safety Judgment | [kdna-agent_safety](https://github.com/aikdna/kdna-agent_safety) | experimental |
| Open-source Project | [kdna-open_source_project](https://github.com/aikdna/kdna-open_source_project) | experimental |
| Content Strategy | [kdna-content_strategy](https://github.com/aikdna/kdna-content_strategy) | experimental |

### 参考示例

`examples/` 目录包含最小参考实现，用于测试校验器和说明规范。这些 **不是** 官方领域目录——它们是规范示例。

| 示例 | 用途 |
|---------|---------|
| [decision_state](./examples/decision_state) | 校验器测试的最小领域夹具 |
| [minimal-agent](./examples/minimal-agent) | 加载多个 KDNA 领域的 Demo Agent |
| [from-wiki-to-kdna](./examples/from-wiki-to-kdna) | LLM Wiki 到 KDNA 的流水线演示 |

### 核心文档

| 文档 | 说明 |
|---|---|
| [SPEC.md](./SPEC.md) | 协议规范 v1.0-rc |
| [docs/getting-started.zh.md](./docs/getting-started.zh.md) | 安装、创建和使用 KDNA |
| [docs/evaluation.zh.md](./docs/evaluation.zh.md) | 如何检验 KDNA 是否改善了判断力 |
| [docs/meta-cognition.zh.md](./docs/meta-cognition.zh.md) | 何时用 KDNA、冲突仲裁、领域组合 |
| [docs/registry-policy.zh.md](./docs/registry-policy.zh.md) | 领域收录标准 |
| [docs/kdna-in-chinese.md](./docs/kdna-in-chinese.md) | 中文 KDNA 编写指南 |

## 工具

| 工具 | 仓库 | 说明 |
|---|---|---|
| Skills | [kdna-skills](https://github.com/aikdna/kdna-skills) | kdna-loader 技能 + CLI 安装器，支持所有主流 Agent |

## 中文资源

- [README.zh.md](./README.zh.md) — 中文 README（当前页面）
- [docs/getting-started.zh.md](./docs/getting-started.zh.md) — 快速上手指南
- [docs/kdna-in-chinese.md](./docs/kdna-in-chinese.md) — 中文 KDNA 编写指南
- [docs/registry-policy.zh.md](./docs/registry-policy.zh.md) — 注册表收录标准
- [docs/i18n.md](./docs/i18n.md) — KDNA 国际化策略

## 许可

- 代码: Apache-2.0
- 文档和示例: CC BY 4.0
