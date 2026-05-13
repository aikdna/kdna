# KDNA

**KDNA（Knowledge DNA）** 是一种开放格式，用于为 AI Agent 编码**领域认知**。

Prompt 告诉 AI 说什么。  
Skill 告诉 AI 做什么。  
**KDNA 告诉 AI 在某个领域里怎么思考。**

KDNA 不是提示词库，不是知识库，也不是操作手册。它是一种结构化方式，封装一个领域的判断层：公理、术语边界、常见误解、场景信号、推理链条和能力演进。

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
git clone https://github.com/knowledge-dna/kdna.git
cd kdna
npm install
npm run lint:examples
```

校验一个领域：

```bash
node validators/kdna-lint.js examples/communication
```

## 规范

完整 v0.1 规范见 [SPEC.md](./SPEC.md)。

## 示例

| 领域 | 核心洞见 | 语言 |
|--------|-------------|----------|
| [communication](./examples/communication) | 先修复关系状态，再讨论内容 | EN |
| [code_review](./examples/from-wiki-to-kdna/kdna) | 每条评论必须分级；先理解意图再评价代码 | EN |
| [product_decision](./examples/product_decision) | 假设验证优于功能交付 | ZH |
| [sales](./examples/sales) | 价格异议是确定性缺失，不是价格问题 | EN |
| [silver_age](./examples/silver_age) | 心理进入成本比活动质量更重要 | EN |
| [management](./examples/management) | 执行失败是系统输出，不是动力问题 | EN |

## 中文资源

- [README.zh.md](./README.zh.md) — 中文 README（当前页面）
- [docs/kdna-in-chinese.md](./docs/kdna-in-chinese.md) — 中文 KDNA 编写指南
- [docs/i18n.md](./docs/i18n.md) — KDNA 国际化策略

## 许可

- 代码: Apache-2.0
- 文档和示例: CC BY 4.0
