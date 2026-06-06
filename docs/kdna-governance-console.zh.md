# KDNA Governance Console

KDNA Governance Console 是组织用于批准、发布、回滚和审计判断更新的界面。

[KDNA Studio](./kdna-studio-principles.zh.md) 生产判断资产，而 Governance Console 治理其组织生命周期。它确保自我改进型 Agent 不会漂移——不是因为禁止 Agent 学习，而是因为每次判断更新都是可见的、经过审核的、被刻意批准的。

---

## 核心目的

部署自我改进型 Agent 的组织需要回答：

- Agent 学到了什么？
- 这些学习是否被审核过？
- 它是否改变了原有判断标准？
- 谁批准了这种改变？
- 新旧版本差异是什么？
- 能否回滚？

Governance Console 提供了回答所有这些问题的界面。

---

## Governance Console 做什么

### 1. 改进提案审核

Agent 和人类提交改进提案。Console 是审核这些提案的地方：

- **摄取**来自 Agent 运行时、评估失败或人工建议的提案
- **显示**证据：追踪、结果、评估结果、风险评估
- **分配**基于领域专业知识和组织角色的审核者
- **追踪**提案状态：proposed → under_review → accepted / rejected / deferred
- **记录**每个被接受提案的人类判断锁定

### 2. 域生命周期管理

Console 管理组织内判断资产的完整生命周期：

- **Draft**（草稿）— Studio 中开发中的域
- **Review**（审核中）— 提交组织审批的域
- **Approved**（已批准）— 获准内部部署的域
- **Published**（已发布）— 发布到 registry（公开或私有）的域
- **Deprecated**（已弃用）— 计划替换的域
- **Yanked**（已撤销）— 因严重缺陷被撤回的域

### 3. 审计与合规

每次判断更新都可审计：

- 谁提议了变更
- 什么证据支持它
- 谁审核了它
- 做了什么决定及原因
- 何时部署的
- 是否引入了退化

Console 导出完整审计追踪以供合规审查。

### 4. Registry 治理

对于运行私有 registry 的组织：

- 批准哪些域进入组织 registry
- 强制执行质量门槛（最低评估数量、验证分数阈值）
- 管理范围信任和签名密钥
- 控制不同团队或 Agent 可以加载哪些域

### 5. 回滚与恢复

当已部署的判断更新导致问题时：

- 识别受影响的版本
- 回滚到上一版本
- 通知所有消费 Agent
- 记录回滚原因
- 创建解决根本问题的新提案

---

## Governance Console vs. Studio

| 关注点 | Authoring environment (production) | KDNA Governance Console（审批端） |
|--------|----------------------|-----------------------------------|
| **主要用户** | 域作者、专家 | 治理官、团队负责人、合规人员 |
| **核心活动** | 表达、挑战、锁定、测试判断 | 审核、批准、审计、回滚判断更新 |
| **AI 角色** | 访谈者、挑战者、编译者、评估者 | 证据汇总者、一致性检查者、风险标记者 |
| **人工锁定** | 作者锁定自己的判断再导出 | 审核者锁定组织批准再部署 |
| **输出** | 签名的 `.kdna` 包 | 已批准、已部署、可审计的域版本 |
| **评估重点** | 这个域是否表达了良好判断？ | 这次更新是否改善了判断且没有退化？ |

Studio 和 Governance Console 相连但分离：

- Studio **生产**草稿域并提交它们
- Governance Console **审核**提案并批准部署
- 两者都使用 **KDNA CLI** 作为共享协议层
- 两者都读写**相同的 schema**（改进提案、人类锁定、评估结果）

---

## 治理角色

| 角色 | 责任 |
|------|------|
| **域作者** | 创建和维护 KDNA 域。使用 Studio 表达判断。 |
| **提案审核者** | 审核改进提案。检查证据、评估风险、决定接受/拒绝/推迟。 |
| **治理官** | 管理组织 registry 策略。强制执行质量门槛。处理审计。 |
| **运行时操作员** | 将已批准的域部署到 Agent 运行时。监控生产环境判断质量。 |

一个人可以担任多个角色。在小团队中，域作者可能同时是提案审核者。在企业中，这些角色通常是分离的。

---

## 组织反馈闭环

```
Agent 工作（生产环境）
    → 判断追踪 + 结果记录
    → 改进提案（自动或人工创建）
    → Governance Console 审核队列
    → 审核者检查证据和风险
    → 人类判断锁定（组织批准）
    → 域作者在 Studio 中更新域
    → 回归测试（旧 + 新评估）
    → Governance Console 批准发布
    → 部署到 Agent 运行时
    → Agent 使用更新后的判断
```

这个闭环确保 Agent 学习通过人类治理渠道流动，而不会成为瓶颈。

---

## 质量门槛

Governance Console 在域或更新被批准前强制执行可配置的质量门槛：

| 门槛 | 最低要求 | 目的 |
|------|----------|------|
| 结构验证 | 通过 | JSON 有效且符合 schema |
| 行为验证 | 验证分数 ≥ 阈值 | 判断质量可度量 |
| 评估覆盖 | 最低 N 个案例 | 边缘案例经过测试 |
| 回归测试 | 零退化 | 保留旧能力 |
| 人类锁定 | 存在 | 每次判断更新都经过人工批准 |
| 签名 | 有效 Ed25519 | 域完整性经过密码学保证 |

组织可以配置更严格的门槛。Console 阻止部署任何未通过必需门槛的域。

---

## 与 KDNA CLI 集成

Governance Console 是 KDNA CLI 协议之上的 UI 层：

```bash
# 摄取提案（Phase 6 — CLI 待实现）
kdna proposal ingest ./proposal.json --console

# 审核队列（Phase 6 — CLI 待实现）
kdna proposal list --status under_review

# 应用人类锁定（Phase 6 — CLI 待实现）
kdna proposal lock prop_ds_001 --accept --reason "证据充分。"

# 批准前回归测试（Phase 6 — CLI 待实现）
kdna verify @aikdna/decision_state --judgment --regression

# 发布已批准的域
kdna publish ./dist/decision_state.kdna --release-tag v0.7.2
```

Console 可以用 Web 界面包装这些命令，但协议保持 CLI。这确保治理动作是可脚本化、可审计的，不锁定在任何单一 UI 中。

---

## 总结

An authoring environment 生产判断。KDNA Governance Console 治理其演化。

二者共同实现了核心原则：

> Agent 可以从工作中学习，但判断标准的更新必须被治理。

Studio 确保判断由人类表达。Console 确保判断更新由人类批准。CLI 为两者提供动力。这就是人类判断治理的自我改进型 Agent 的完整基础设施。
