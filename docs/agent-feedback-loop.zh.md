# Agent 反馈闭环

KDNA 加载的 Agent 如何将现实世界经验转化为受治理的判断演化。

本文档描述了从 Agent 执行到域更新的完整管道。它是 [Human-Governed Self-Improving Agents](./human-governed-self-improvement.zh.md) 概念文档的操作对应物。

---

## 概览

```
Agent 工作
    → 判断追踪
    → 结果记录
    → 失败分类
    → 改进提案
    → 人工审核
    → 人类判断锁定
    → 新域版本
    → 回归测试
    → 部署
```

每个箭头都是一次转换。每个框都是一个带有定义 schema 的产物。

---

## 步骤 1：Agent 工作

Agent 接收输入，加载一个或多个 KDNA 域，并产生判断。

**输入：**
- 用户消息或系统事件
- 加载的 KDNA 域及其版本
- 运行时上下文（环境、会话、标签）

**输出：**
- Agent 响应或行动
- 可选：`判断追踪`（见步骤 2）

生产环境的 Agent **应该**为每个受 KDNA 影响的决策生成判断追踪。没有追踪，就无法审计应用了哪些规则。

---

## 步骤 2：判断追踪

追踪记录了判断过程中触发了哪些 KDNA 规则。

**Schema：** [`specs/judgment-trace-schema.json`](./judgment-trace-schema.json)

**关键字段：**
- `trace_id`：唯一标识符
- `loaded_package`：加载了哪些域及版本
- `triggered_axioms`：触发了哪些公理
- `triggered_misunderstandings`：检测到了哪些误解
- `self_checks`：哪些检查通过或失败
- `selected_scenario`：匹配到了哪个场景
- `generated_judgment`：最终分类和建议

当加载多个域时（集群模式），追踪**必须**包括：
- `loaded_domains`：所有加载的域标识符数组
- `conflicts`：域之间任何冲突的公理或价值
- `composition_policy_id`：解决冲突所使用的组合策略

**示例（最小化）：**

```json
{
  "trace_version": "0.1.0",
  "trace_id": "trace_20260523_001",
  "timestamp": "2026-05-23T10:00:00Z",
  "input_hash": "sha256:a3f5c8...",
  "loaded_package": {
    "domain": "@aikdna/decision_state",
    "version": "0.7.1",
    "source": "registry",
    "loaded_files": ["KDNA_Core.json", "KDNA_Patterns.json", "KDNA_Scenarios.json"]
  },
  "triggered_axioms": [
    {
      "id": "ds_ax_structural_problem",
      "statement": "大多数决策延迟是由信息缺失引起的，而非风险规避。"
    }
  ],
  "generated_judgment": {
    "classification": "MISSING_INFORMATION",
    "confidence": "high",
    "recommended_action": "找出能让该决策可执行的三条最小信息。"
  }
}
```

---

## 步骤 3：结果记录

Agent 行动后，现实产生结果。结果记录将判断的预测与实际发生的情况进行比较。

**Schema：** [`specs/outcome-record-schema.json`](./outcome-record-schema.json)

**关键字段：**
- `judgment_reference.trace_id`：链接回追踪
- `predicted`：判断预测的内容
- `actual_outcome.status`：confirmed_correct | partially_correct | incorrect | outcome_unknown
- `revision_needed`：如果判断错误则为 true
- `revision_type`：false_positive | false_negative | misclassification | missing_signal | overconfident
- `feedback.suggested_changes`：人工对域改进的建议
- `improvement_proposal_refs`：链接到正式改进提案（见步骤 5）

**何时记录：**
- 如果结果立即可知，则立即记录（例如，用户确认分类正确）
- 如果结果需要时间，则延迟记录（例如，一周后回顾使用 Agent 建议做出的决策）
- 如果在审计中发现失败模式，则追溯记录

**重要：** 结果记录中的 `suggested_changes` 是自由形式的人工反馈。它**不是**受治理的变更。要成为变更，必须提升为改进提案。

---

## 步骤 4：失败分类

并非每个错误判断都值得更新域。在创建提案之前，先分类失败：

| 分类 | 原因 | 行动 |
|------|------|------|
| **操作性** | Agent 判断正确但执行不佳（错误工具调用、格式错误、忽略输出指令） | 修复 Agent 代码或提示词。无需更改域。 |
| **证据缺口** | 域缺少这种情况的案例 | 向 `KDNA_Cases.json` 添加案例。可自动记录。 |
| **信号误分类** | Agent 匹配了错误的场景或公理 | 查看追踪中的 `triggered_axioms` 和 `selected_scenario`。考虑更新场景信号。 |
| **判断错误** | 公理本身是错误、不完整或优先级错位的 | 这需要判断更新。创建改进提案。 |
| **边界违反** | Agent 做了域明确禁止的事 | 操作性修复：更好地执行自检。如果自检正确但 Agent 忽略了，修复运行时而非域。 |
| **价值冲突** | 两条公理冲突，Agent 选择了错误的优先级 | 查看 `KDNA_Core.json` 中的 `value_order`。需要判断更新。 |

只有**判断错误**和**价值冲突**才应产生针对公理、价值或边界的改进提案。

---

## 步骤 5：改进提案

改进提案是更改 KDNA 域判断层的结构化、带版本控制的请求。

**Schema：** `specs/improvement-proposal-schema.json`

**关键字段：**
- `proposal_id`：唯一标识符
- `source`：outcome_record | human_feedback | eval_failure | trace_analysis | agent_reflection
- `domain`：目标域（例如 `@aikdna/decision_state`）
- `domain_version`：提案适用的版本
- `proposed_change_type`：add_axiom | revise_axiom | add_misunderstanding | revise_boundary | add_scenario_signal | revise_risk_model | update_self_check
- `target_element`：要更改的文件和元素
- `evidence`：支持变更的追踪 ID、结果 ID 或评估结果数组
- `reason`：人工可读的理由
- `risk_if_accepted`：采纳此变更可能出什么问题
- `risk_if_rejected`：忽略此变更可能出什么问题
- `requires_human_lock`：判断更新始终为 `true`
- `status`：proposed | under_review | accepted | rejected | deferred

**示例：**

```json
{
  "proposal_id": "prop_ds_20260523_001",
  "source": "outcome_record",
  "domain": "@aikdna/decision_state",
  "domain_version": "0.7.1",
  "proposed_change_type": "revise_axiom",
  "target_element": {
    "file": "KDNA_Core.json",
    "element_id": "ds_ax_structural_problem"
  },
  "evidence": [
    {
      "type": "outcome_record",
      "id": "out_20260523_001",
      "summary": "Agent 将 5 个风险规避案例中的 3 个分类为信息缺失。全部 3 个都是错误的。"
    }
  ],
  "reason": "公理太强。风险规避是决策延迟的真实原因，不仅仅是信息缺失。公理应承认两种原因。",
  "risk_if_accepted": "Agent 可能过度诊断风险规避，漏诊信息缺失。",
  "risk_if_rejected": "Agent 将继续误分类真正的风险规避案例，导致不当的行动建议。",
  "requires_human_lock": true,
  "status": "proposed"
}
```

Agent **可以**自动提出改进提案。但**必须**在人类判断锁定后才能应用。

---

## 步骤 6：人工审核

人工审核者——最好是域作者或指定的治理角色——审查提案。

**审核清单：**
1. **证据质量**：证据是否充分？案例是否具有代表性？
2. **边界检查**：变更是否削弱了现有边界？
3. **冲突检查**：新公理是否与现有公理或价值冲突？
4. **风险平衡**：`risk_if_accepted` 是否比 `risk_if_rejected` 更糟？
5. **普遍性**：这是一次性案例还是真正的模式？
6. **价值对齐**：变更是否符合域的 `value_order`？

审核者可以：
- **接受**提案原样
- **拒绝**提案并记录理由
- **推迟**提案，等待更多证据
- **修改**提案并重新审核

AI **可以**协助审核：
- 扮演挑战者：生成反例和压力测试
- 检查一致性：验证提案是否符合所有现有公理
- 总结影响：预测哪些评估案例会改变行为

但最终决定**必须**由人类做出。

---

## 步骤 7：人类判断锁定

一旦接受，提案就获得人类判断锁定。

这记录在域的 `KDNA_Evolution.json` 中：

```json
{
  "human_locks": [
    {
      "lock_id": "lock_20260523_001",
      "proposal_id": "prop_ds_20260523_001",
      "locked_at": "2026-05-23T14:00:00Z",
      "locked_by": "zhangling",
      "lock_type": "accept",
      "reason": "证据充分。一周内 3 次误分类。风险平衡支持变更。",
      "affected_files": ["KDNA_Core.json"]
    }
  ]
}
```

域包**禁止**发布缺少相应人类判断锁定的判断更新。

验证器**应该**检查：如果版本间 `axioms`、`value_order`、`boundaries` 或 `risk_model` 发生变更，`KDNA_Evolution.json` 中**必须**存在人类判断锁定。

---

## 步骤 8：新域版本

接受的变更被应用到域。域获得新版本。

**版本规则：**
- **Semver 升级**（`0.7.1` → `0.7.2`）：内容变更、新公理、修订边界
- **判断版本升级**（`2026.05` → `2026.06`）：判断表面显著变更（新公理、价值排序变化、新失败风险）
- 主版本升级（`0.7.x` → `0.8.0`）：破坏性 schema 变更或删除公理

更新的域**必须**：
1. 通过结构验证（`kdna validate`）
2. 通过行为验证（`kdna verify --judgment`）
3. 使用域作者的 Ed25519 密钥签名（`kdna publish`）

---

## 步骤 9：回归测试

部署前，新版本**必须**通过回归测试。

**测试内容：**
1. **旧评估仍通过**：所有之前的 `evals/` 案例必须产生相同或更好的结果。
2. **新增评估**：引发提案的变更应至少有一个新评估案例。
3. **公理触发检查**：已知的公理触发器必须仍然正确触发。
4. **禁用词避免**：禁用词仍必须被避免。
5. **场景分类**：场景匹配不得退化。

**CLI 支持：**

```bash
# 运行域的所有评估
kdna verify @aikdna/decision_state --judgment

# 比较两个版本以检测回归（Phase 6 — CLI --from/--to/--evals 待实现）
kdna compare @aikdna/decision_state --from 0.7.1 --to 0.7.2 --evals ./evals/

# 预期输出：
# - 新评估：1/1 通过
# - 旧评估：10/10 通过（0 退化）
# - 公理触发变化：ds_ax_structural_problem 现在对"风险规避"信号触发
# - 风险标记：无新增
```

如果任何旧评估失败，变更**必须**重新考虑。修复一个案例但破坏两个案例的判断更新不是改进。

---

## 步骤 10：部署

验证和回归测试通过后，部署新域版本。

**到 registry：**
```bash
kdna publish ./decision_state --release-tag v0.7.2 --repo aikdna/kdna-decision_state
```

**到 Agent 运行时：**
```bash
kdna update @aikdna/decision_state
```

更新后加载域的 Agent 将使用新的判断标准。现有会话中的 Agent **应该**使用旧版本完成，除非运行时显式支持会话中重新加载。

---

## 完整示例：一个闭环

**第 1 天：** Agent 使用 `@aikdna/decision_state` 帮助用户处理延迟决策。Agent 将其分类为 `MISSING_INFORMATION`。

**第 3 天：** 用户反馈："我有所有需要的信息。我只是害怕后果。"创建结果记录，`actual_outcome.status: incorrect`，`revision_type: misclassification`。

**第 3 天（自动）：** Agent 反思模块提出改进提案：`revise_axiom` 针对 `ds_ax_structural_problem`。

**第 4 天：** 域作者审核。证据：本周 3 次类似误分类。风险平衡支持变更。以人类判断锁定接受。

**第 4 天：** 作者编辑 `KDNA_Core.json`，向公理添加 `does_not_apply_when`，版本升级到 `0.7.2`，添加风险规避检测的新评估案例。

**第 4 天：** `kdna verify --judgment` → 11/11 评估通过（10 旧 + 1 新）。`kdna compare --from 0.7.1 --to 0.7.2` → 无退化。

**第 5 天：** 发布到 registry。全球 Agent 现在正确处理风险规避案例。

---

## 反模式

| 反模式 | 失败原因 |
|--------|----------|
| **自动应用所有建议** | Agent 通过对近期反馈过拟合降低判断质量。 |
| **不生成追踪** | 出现问题时，无法知道应用了哪些规则。 |
| **跳过回归测试** | "修复"一个案例通常会破坏其他案例。没有回归测试，你不会知道。 |
| **没有证据的人类锁定** | 治理变成官僚主义。每次锁定都应引用具体提案和结果。 |
| **更新公理但不更新评估** | 变更未经测试。评估套件必须随域一起成长。 |

---

## 总结

Agent 反馈闭环将经验转化为受治理的判断演化：

1. **追踪**每次判断
2. **记录**每次结果
3. **正确分类**失败
4. **提出**结构化变更
5. **人工审核**判断
6. **锁定**接受的变更
7. **版本化**域
8. 部署前**回归**测试
9. 自信**部署**

没有这个闭环，Agent 漂移。有了它，Agent 演化。
