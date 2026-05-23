# 产品决策 KDNA 示例

一个完整的中文 KDNA 领域示例，涵盖产品决策的核心认知。

## 领域概述

这个领域帮助 AI Agent 判断产品方案是否应该推进，以便在有限信息下做出可逆、可验证的产品决策。

## 文件列表

| 文件 | 说明 |
|------|------|
| `KDNA_Core.json` | 4 条公理、4 个核心概念、2 个决策框架、4 组因果结构、3 条立场 |
| `KDNA_Patterns.json` | 5 个标准术语、5 个禁用词、4 个常见误解、5 条自查项 |
| `KDNA_Scenarios.json` | 2 个场景（功能优先级冲突、MVP 范围争论） |
| `KDNA_Cases.json` | 2 个完整案例（MVP 学到零、老板需求变验证） |
| `KDNA_Reasoning.json` | 3 条推理链（速度优先、MVP 是学习工具、用户价值优先） |
| `KDNA_Evolution.json` | 4 个成长阶段、3 个能力层次、3 项可测量指标 |

## 核心认知

**公理 (Axioms)**
1. 问题先行，方案后置
2. 决策速度 > 决策完美度
3. 用户价值 > 老板意见
4. 优先选择可逆的决策

**禁用词 (Banned Terms)**
- 老板说的 → 转化为待验证假设
- 竞品做了 → 追问需求是否适用于我们的用户
- 我觉得 → 替换为假设 + 验证方案
- 先做出来再说 → 先定义假设，再最小验证
- 大而全 → 聚焦核心场景

**自查 (Self-Check)**
- 我是否先明确了用户问题再讨论方案？
- 这个决策如果错了，我们能在多长时间内发现并修正？
- 我是否区分了假设和事实？
- 用户从哪些具体的信号中可以判断这个方向是对的？
- 这个方案的最小验证成本是什么？

## 验证

```bash
node ../../validators/kdna-lint.js .
```

## Four Questions

### 1. What does this domain judge?

Whether a product decision (feature, priority, scope) is reversible, user-value-driven, and hypothesis-based — or irreversible, authority-driven, and assumption-based.

### 2. Where does it apply?

- Feature prioritization and roadmap decisions
- MVP scope and launch timing
- Product strategy and positioning
- A/B test design and metric selection

### 3. Where does it NOT apply?

- Technical implementation choices (architecture, stack)
- Marketing campaign messaging
- Pricing and revenue model decisions
- Post-launch quantitative analytics

### 4. How do I use it?

```bash
kdna install github:knowledge-dna/kdna-product_decision
kdna validate .
```
