# KDNA Creator Workflow

> Historical pre-v1 authoring workflow. This document is retained as process
> history for domain design. The current public beta authoring path is:
> `kdna-studio ... --format v1 --out asset.kdna`, then `kdna validate`,
> `kdna plan-load`, and `kdna load` on the packaged `.kdna` file. Registry,
> publish commands, Human Lock requirements, and quality promotion in this file
> are not KDNA Core v1 format-validity requirements.

> 从零到发布 — 创建高质量 KDNA 领域的完整流程

本文档沉淀了创建 6 个 first-wave 领域的经验和踩过的坑。用这个流程，下次建域不需要临场手艺。

---

## 阶段 0：判断这个域是否值得做

### 0.1 域选择检查清单

在写任何一行 JSON 之前，回答：

| 问题 | 标准 |
|------|------|
| 这个域帮助 AI 判断什么？ | 必须是一个具体的判断问题，不是泛领域。例："判断会议是否真的形成了决策" ✅；"管理" ❌ |
| 谁需要这个判断？ | 必须能说出具体人群。例："用 Obsidian 但发现笔记越存越多的知识工作者" ✅；"所有人" ❌ |
| 错误判断的代价是什么？ | AI 在这个域里最常见的错误是什么？错了会怎样？ |
| 和现有域是否有重叠？ | 检查 kdna-x 资产库。如果是同一判断问题的新角度，标注关系。如果是已有域的弱化版，不要建。 |

### 0.2 Scope / Out-of-Scope 模板

```
## Scope

This KDNA helps AI agents judge [specific judgment]. It is designed for [specific audience] who [specific situation].

## Out of Scope

This KDNA is NOT [closest possible misunderstanding 1]. It is NOT [closest possible misunderstanding 2]. It does not [closest possible feature confusion].
```

每个域必须在 README 里有这一段。这是防止泛化传播的第一道防线。

---

## 阶段 1：写 KDNA_Core.json

### 1.1 先写一句话核心判断

在写公理之前，先写：

```
This domain helps an AI agent judge ______ so that ______.
```

例：`This domain helps an AI agent judge whether a piece of content has a real argument — or just explains concepts — so that feedback targets the structural void rather than polishing sentences.`

这句会变成 `kdna.json` 的 `core_insight` 和 `description`。

### 1.2 公理写作规则

每个公理必须满足：

| 规则 | 说明 |
|------|------|
| 具体 | 两个专家可以就"这个公理在此场景是否适用"达成一致 |
| 可证伪 | 你能构造一个此公理不适用的场景 |
| 行为改变 | 加载此公理后 Agent 会给出不同的回答 |
| 非口号 | 拒绝 "X is important" / "X matters" / "X is key" 模式 |

**Bad → Good：**
```
"Communication is important."
→ "The speaker's intent and the listener's interpretation are different things. Judge the gap, not the words."

"Be user-centered."
→ "When a user requests feature X, first identify what outcome they are trying to achieve. Features are means; outcomes are ends."
```

**最少 2 条，推荐 3 条。超过 5 条通常是概念没收敛。**

### 1.3 本体概念写作

每个概念需要真实的边界——不是字典定义，不是仅否定：

```
Bad:  "Trust is important." Boundary: "Not distrust."
Good: "The buyer believes you will prioritize their outcome over your commission."
      Boundary: "Not rapport. Rapport is comfort; trust is confidence in your intent."
```

### 1.4 框架写作

有步骤的诊断结构。每个框架有一个 `when_to_use` 触发条件和有序步骤列表。

### 1.5 因果结构

至少 2 条 `{ from, to, via }` 映射。这是域的核心因果模型。

---

## 阶段 2：写 KDNA_Patterns.json

### 2.1 术语表

- **standard_terms**：域内关键概念的定义，2-5 个。每个定义要有操作含义。
- **banned_terms**：AI 容易误用的词。每个必须有 `why`（为什么误导）和 `replace_with`（该用什么）。最少 2 个。

### 2.2 误解

误解是 AI 最常见错误判断的具体描述。规则：

- `wrong` 必须是真实 Agent 可能持有的信念。**拒绝稻草人**（"沟通不重要"——没有 Agent 会这么想）。
- 每个误解必须有 `key_distinction`（核心区别）和 `why`（这个误解会导致什么坏判断）。

**最少 2 个，推荐 3 个。**

### 2.3 自检

yes/no 问题，Agent 在输出前问自己。规则：

- 领域特定。拒绝 "Is this helpful?" / "Is this clear?"。
- 每一条都应该能抓到域内最常犯的错误。

**最少 3 个。**

---

## 阶段 3：可选的 4 个文件

在 Core + Patterns 通过 lint 和 validate 后，再补可选文件。

### 3.1 KDNA_Scenarios.json

**场景触发与应对策略。** 最重要的可选文件——它决定 Agent 在具体情境中如何切换判断框架。

每个 sub_scenario 的字段约束：

| 字段 | 类型 | 说明 |
|------|------|------|
| `action_template` | `string[]` | 步骤列表，Agent 应如何诊断/响应这个场景 |
| `replace` | `[{avoid, use}]` | 每个元素是一个 "不要做 X，要改成 Y" 的替换对 |

**这是最常见的 schema 错误点。** 最容易错把 `action_template` 写成 `string`、把 `replace` 写成 `string`。

### 3.2 KDNA_Cases.json

**真实案例，展示结构而非模板。** 每个 case 包含 context、what_happened、what_was_learned、structural_pattern。

### 3.3 KDNA_Reasoning.json

**推理链：结论 → 逻辑 → 所以。** 每个 chain 有 `one_sentence`、`logic`（string[]）、`so_what`。

### 3.4 KDNA_Evolution.json

**能力阶段和可测量指标。** stages、evolution_layers、measurement。

---

## 阶段 4：验证

### 4.1 结构验证

```bash
kdna-lint <domain-dir>      # 字段完整性
kdna-validate <domain-dir>   # JSON Schema 合规
```

两个都必须零错误通过。

### 4.2 反空洞检查

以下模式自动拒绝：

| 字段 | 拒绝模式 | 示例 |
|------|---------|------|
| axiom | 一元谓词语 "X is important" | "Trust is important." |
| ontology boundary | 仅否定 "Not X" | "Not distrust." |
| misunderstanding wrong | 稻草人 | "Communication doesn't matter." |
| self_check | 通用质量问句 | "Is this helpful?" |
| stance | 无人会反对的 truism | "Be honest." |

### 4.3 发布前检查清单

```
[ ] kdna-lint: 0 errors
[ ] kdna-validate: 0 errors
[ ] kdna.json 所有字段非空
[ ] README.md 包含 Scope / Out of Scope
[ ] 公理 ≥ 2，误解 ≥ 2，自检 ≥ 3
[ ] 每个 banned term 有 why + replace_with
[ ] 没有口号公理、稻草人误解、通用自检
[ ] file_count 与实际文件数一致
```

---

## 阶段 5：发布

### 5.1 创建独立仓库

```bash
gh repo create aikdna/kdna-<domain-id> --public -d "<description>"
```

### 5.2 仓库文件结构

```
kdna-<domain-id>/
├── KDNA_Core.json
├── KDNA_Patterns.json
├── KDNA_Scenarios.json    # 可选
├── KDNA_Cases.json        # 可选
├── KDNA_Reasoning.json    # 可选
├── KDNA_Evolution.json    # 可选
├── kdna.json              # manifest
├── README.md
└── LICENSE
```

### 5.3 README 模板

```markdown
> 🧬 [aikdna.com](https://aikdna.com) — Official website

# kdna-<domain-id>

[![KDNA Spec](https://img.shields.io/badge/KDNA-v1.0-4c1)](https://github.com/aikdna/kdna)

**<Domain Name>** — <one-line description>

## Core Insight

<core_insight>

## Install

\`\`\`bash
kdna load @aikdna/<domain-id> --profile=compact --as=prompt
\`\`\`

## Scope

This KDNA helps AI agents <specific judgment>. Designed for <audience> who <situation>.

## Out of Scope

This KDNA is NOT <misunderstanding 1>. It is NOT <misunderstanding 2>. It does not <feature confusion>.

## Files

| File | Purpose |
|------|---------|
| KDNA_Core.json | Axioms, ontology, frameworks, core causal structure, stances |
| KDNA_Patterns.json | Terminology, banned terms, misunderstandings, self-checks |
| ... (list all files present) |

## Validate

\`\`\`bash
kdna dev validate .
\`\`\`

## License

CC BY 4.0
```

### 5.4 Distribution

The current distribution path is:

```bash
kdna pack ./source-dir ./your-domain.kdna
kdna validate ./your-domain.kdna
```

Share the `.kdna` file directly, or publish to a GitHub Release. For curated
public assets, see [kdna-x](https://github.com/aikdna/kdna-x).

### 5.5 更新网站 Domains 页

在 `kdna-website/src/pages/domains.js` 的 `DOMAINS_DATA` 数组中添加新域卡片。

### 5.6 推送到 GitHub

```bash
git add -A && git commit -m "Initial commit: kdna-<domain-id> v0.1.0"
git remote add origin git@github.com:aikdna/kdna-<domain-id>.git
git push -u origin main
```

---

## 常见错误与修复

| 错误 | 原因 | 修复 |
|------|------|------|
| `kdna-validate` 报 Scenarios schema 错 | `action_template` 写成了 string | 改为 `string[]` |
| `kdna-validate` 报 Scenarios schema 错 | `replace` 写成了 string | 改为 `[{avoid, use}]` |
| file_count 不一致 | 补了可选文件但没更新 manifest | 同步 `kdna.json` 的 `file_count` |
| 公理太泛 | 没有具体行为改变 | 重写：添加具体的判断反转 |
| 误解是稻草人 | 选了没人会信的"错误" | 换成一个真实 Agent 会犯的错误 |
| 自检太通用 | "Is this helpful?" | 写成域内特有的诊断问题 |

---

## 经验总结

1. **先 Core + Patterns，通过验证后再补可选文件。** 不要一次写 6 个文件——迭代修 schema 的成本太高。
2. **action_template 和 replace 是最容易写错的两个字段。** 写完立刻跑 `kdna-validate`。
3. **每个域必须有 Scope / Out of Scope。** 传播型领域最容易被误用，边界声明是第一道防线。
4. **Registry 的 file_count 要和 repo 同步。** 补文件后记得两处都更新。
5. **不要一个晚上建 6 个域。** 每个域需要独立的思考时间。这次是特殊情况。
