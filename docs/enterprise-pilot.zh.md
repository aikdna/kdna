# 企业试点指南

如何在一个真实组织中部署 KDNA，评估其对 Agent 判断质量的影响。

## 试点目标

企业试点的目的不是"工具上线"，而是回答一个问题：

> KDNA 是否让我们的 Agent 在特定领域内判断得更准确、更一致？

## 试点框架

### 第 1 周：选择试点领域

- 选一个判断错误成本高、但频率适中的领域
- 好例子：客户工单分类、合同条款审查、技术方案评估
- 坏例子：全公司所有 Agent 的所有对话（范围太大，无法测量）

### 第 2 周：创建或适配 KDNA

- 如果公开 KDNA 接近需求，直接使用并记录初始印象
- 如果需要内部知识，创建一个内部 KDNA（不必公开发布）
- 至少定义 3 条公理、3 个概念边界、5 条自检

### 第 3-4 周：A/B 测试

对同一类型的任务，随机分配：
- A 组：Agent 无 KDNA（基线）
- B 组：Agent 加载 KDNA

每组的评判标准：
- 判断准确性（领域专家评审）
- 判断一致性（相同输入是否产生相同判断）
- 错误类型（是漏判还是误判）

### 第 5 周：结果评估

- 如果 KDNA 组显著优于基线 → 扩大试点范围
- 如果无明显差异 → KDNA 需要修订或领域选择不对
- 如果 KDNA 组更差 → KDNA 的公理可能有误，需要专家重新审阅

## 企业私有 KDNA

企业内部 KDNA 不需要公开发布。它可以：

- 包含专有业务流程知识
- 反映公司特定的判断标准
- 存储在私有仓库中
- 通过私有 registry 安装：在 `~/.kdna/config.json` 加 `registries: { "@company": "https://registry.company.com" }`，然后 `kdna install @company/private-kdna`
- 开发期可用 `kdna dev pack ./your-domain-source --output ./dist` 生成仅供诊断的 dev-only bundle；可信 `.kdna` 必须由 Studio-compatible compiler 或 Studio-compatible compiler 编译导出后再安装

## 回滚策略

如果 KDNA 产生负面效果：
1. 从 Agent 配置中移除 KDNA 加载指令
2. Agent 回到基线行为
3. KDNA 本身不受影响，可以修订后重新部署

KDNA 是 Agent 的"判断插件"——可以随时加载或卸载，不影响 Agent 的其他能力。
