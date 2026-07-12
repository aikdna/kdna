# 团队与组织试点

组织是 KDNA 的一种使用场景，不是 KDNA 的定义。本指南用于验证：一份明确的判断资产能否跨模型保留，并改善一个边界清晰的决策情境。

## 先选择一个清晰判断

选择一种高频情境：有经验的人会作出与通用模型明显不同的区分。不要从“全组织所有 Agent”开始。

例如：升级判断、设计评审标准、事故风险、编辑品味，或工作流何时必须停下来交给人。

## 先创建单个资产

使用公开 Studio 工具链创建范围明确的资产。Human Review 和 Evidence 是可选层；只有组织希望发布相应声明时才需要。

```bash
npm install -g @aikdna/kdna-studio-cli @aikdna/kdna-cli
kdna-studio create ./pilot --name @example/pilot
kdna-studio export ./pilot --out ./pilot.kdna
kdna validate ./pilot.kdna
kdna plan-load ./pilot.kdna
kdna load ./pilot.kdna --profile=compact --as=prompt
```

默认从单资产开始。只有任务确实需要多个范围清晰的判断资产和显式角色时，才使用 Cluster。

## 测判断，不测术语复述

使用真实任务比较：

1. 同一模型、不加载 KDNA；
2. 同一模型、加载该资产；
3. 更换模型、加载同一资产；
4. 不适用任务，资产应跳过、阻止或询问。

评审实际决策、边界使用、错误类型和一致性。模型复述资产术语，不等于判断已经迁移。

可选评测路径：

```text
validate → plan-load → load/project → eval/replay → 专家评审
```

## 访问与部署

- 内容不需要保密时使用 `public`；
- 依赖本地加密分发前，应验证对应 release 的完整 `licensed` 生命周期；
- remote 和 activation server 默认视为可自托管的实验性参考实现；
- 不依赖私有 registry 或 AIKDNA 托管服务。

## 退出标准

一个有信息价值的试点应包含：固定资产版本、可复现任务、基线、模型切换结果、不适用用例、已观察失败和回滚方式。它不需要证明普遍正确，也不需要成为“官方资产”。
