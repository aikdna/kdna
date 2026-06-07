# KDNA 治理与安全框架

KDNA 是一种开放的、人类锁定的领域判断资产标准。KDNA 生态体系围绕人类责任、来源追踪、风险分级审核、质量门和透明加载进行设计。

## 1. 人类责任

**AI 可以提出判断候选。人必须审查、修改、锁定，并对发布的判断承担作者责任。**

## 2. 禁止一键生成

An authoring environment 及所有合规创作工具不得提供绕过人工审核的自动领域生成。

## 3. 预期用途与边界声明

每个 KDNA 领域必须声明：预期用途、不适用范围、风险边界、已知局限、作者责任。

## 4. 风险分级审核

R0 低风险 → R1 中风险 → R2 高风险 → R3 受限。

## 5. 来源追踪与签名

每个 .kdna 容器必须携带：作者身份、Studio Core 版本、证据来源、锁定卡片数量、内容指纹、构建时间戳、签名。

## 6. 运行时透明

Agent 加载 KDNA 时应记录：加载了哪个领域、版本、风险等级、是否签名、来源是否可信、触发了哪些公理。

## 7. 注册表审核

公开注册表按审核状态分类：unlisted → community → verified → reviewed → trusted → restricted → deprecated → yanked。

## 8. 用户控制

KDNA 不能覆盖系统安全策略、法律要求或用户明确拒绝。加载优先级：系统安全 > 法律 > 用户意图 > KDNA 判断 > 工具指令。

详见英文原版：[GOVERNANCE.md](https://github.com/aikdna/kdna/blob/main/docs/GOVERNANCE.md)
