# KDNA

**KDNA（Knowledge DNA）** 是一种开放格式，用于为 AI Agent 编码**领域认知**。

Prompt 告诉 AI 说什么。  
Skill 告诉 AI 做什么。  
**KDNA 告诉 AI 在某个领域里怎么思考。**

KDNA 不是提示词库，不是知识库，也不是操作手册。它是一种结构化方式，封装一个领域的判断层：公理、术语边界、常见误解、场景信号、推理链条和能力演进。

> **本仓库仅定义 KDNA 协议、Schema、校验规则与治理方式。**  
> 具体领域的 KDNA 应放在[独立仓库](#领域仓库)中，符合收录标准后可进入 [registry](./registry/domains.json)。  
> 安装 KDNA 到你的 Agent，使用 [kdna-skills](https://github.com/aikdna/kdna-skills)。  
> 添加领域到注册表的标准详见 [docs/registry-policy.md](./docs/registry-policy.md)。

## 为什么现在需要 KDNA

> **Agent 越来越会调用工具，但它们仍然缺少领域判断。**

当前的 Agent 生态已经解决了"行动"问题：函数调用、MCP、工具使用、工作流。但能行动不等于能判断——一个什么都能做的 Agent，如果分辨不了"价格异议"和"确定性缺失"，就会带着自信执行错误的操作。

工具让 AI 能行动。**KDNA 让 AI 不乱行动。**

每个领域都有专家级的判断模式，目前只存在于资深从业者的头脑中。KDNA 是一种把这些模式提取出来、编码为可机器验证的结构、作为认知层加载到 Agent 中的格式——独立于 Prompt，独立于知识库，独立于工具。

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

## KDNA vs Skill

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
git clone https://github.com/aikdna/KDNA.git
cd KDNA
npm install
npm run lint:examples
```

校验一个领域：

```bash
node validators/kdna-lint.js examples/communication
```

## 安装到你的 Agent

使用 **[kdna-skills](https://github.com/aikdna/kdna-skills)** 一键安装 KDNA 技能：

```bash
curl -fsSL https://raw.githubusercontent.com/aikdna/kdna-skills/main/install.sh | bash
```

安装两个技能：

| 技能 | 作用 |
|---|---|
| **kdna-loader** | 加载领域认知——检测领域、应用公理、运行自查 |
| **kdna-create** | 创建/获取 KDNA——对话创建、注册表下载、URL 导入、模板搭建 |

支持 **Codex**、**Claude Code**、**OpenCode**、**Cursor** 和 **GitHub Copilot**。

## 本地使用 KDNA

推荐使用上方安装器。手动安装：

```bash
# 1. 安装两个技能
mkdir -p ~/.agents/skills/kdna-loader
cp skills/kdna-loader/SKILL.md ~/.agents/skills/kdna-loader/SKILL.md
mkdir -p ~/.agents/skills/kdna-create
cp skills/kdna-create/SKILL.md ~/.agents/skills/kdna-create/SKILL.md

# 2. 创建 KDNA 本地库
mkdir -p ~/.agents/Kdna/communication_expert
cp examples/communication/KDNA_Core.json ~/.agents/Kdna/communication_expert/
cp examples/communication/KDNA_Patterns.json ~/.agents/Kdna/communication_expert/

# 3. 校验
node validators/kdna-lint.js ~/.agents/Kdna/communication_expert
```

要创建自己的领域，安装了 `kdna-create` 后直接问 Agent，或从[最小模板](./templates/minimal-domain/)开始。

Agent 加载了 `kdna-loader` 后，当用户提出沟通相关问题时，Agent 会自动从 `~/.agents/Kdna/` 找到对应领域，加载认知文件并重塑判断。

要创建自己的领域，从[最小模板](./templates/minimal-domain/)开始，参考[快速上手指南](./docs/getting-started.md)。

## 规范

完整 v0.1 规范见 [SPEC.md](./SPEC.md)。

### 试试 Demo

```bash
node examples/minimal-agent/agent.js
```

同一个用户输入，加载不同的 KDNA 领域，产生完全不同的认知分析。不需要 LLM——纯粹的判断路径对比。

## 领域仓库

领域认知包存放在独立仓库中。机器可读索引见 [registry/domains.json](./registry/domains.json)。

| 领域 | 仓库 | 状态 |
|---|---|---|
| 业务增长 | [kdna-business-growth](https://github.com/aikdna/kdna-business-growth) | experimental |
| 沟通 | [kdna-communication](https://github.com/aikdna/kdna-communication) | experimental |
| 销售 | [kdna-sales](https://github.com/aikdna/kdna-sales) | experimental |
| 管理 | [kdna-management](https://github.com/aikdna/kdna-management) | experimental |
| 银发服务 | [kdna-silver-age](https://github.com/aikdna/kdna-silver-age) | experimental |
| 产品决策 | [kdna-product-decision](https://github.com/aikdna/kdna-product-decision) | experimental |

### 参考示例

`examples/` 目录包含最小参考实现，用于测试校验器和说明规范。这些 **不是** 领域内容——它们是规范示例。

| 示例 | 用途 |
|---------|---------|
| [communication](./examples/communication) | 校验器测试的参考领域 |
| [minimal-agent](./examples/minimal-agent) | 加载多个 KDNA 领域的 Demo Agent |
| [from-wiki-to-kdna](./examples/from-wiki-to-kdna) | LLM Wiki 到 KDNA 的流水线演示 |

## 工具

| 工具 | 仓库 | 说明 |
|---|---|---|
| Skills | [kdna-skills](https://github.com/aikdna/kdna-skills) | 安装器 + kdna-loader 和 kdna-create 两个技能，支持主流 Agent |

## 中文资源

- [README.zh.md](./README.zh.md) — 中文 README（当前页面）
- [docs/kdna-in-chinese.md](./docs/kdna-in-chinese.md) — 中文 KDNA 编写指南
- [docs/i18n.md](./docs/i18n.md) — KDNA 国际化策略

## 许可

- 代码: Apache-2.0
- 文档和示例: CC BY 4.0
