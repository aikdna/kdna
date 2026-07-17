# KDNA Card 规范

> **状态：历史。** 这份切换前的 Card 把风险和质量当作资产内生字段，仅为
> 追溯保留，不是当前 Manifest、Runtime、Registry 或 Conformance 合同。

## 用途

KDNA Card 是每个 KDNA 领域的标准化元数据文档，帮助部署者做出负责任的决策。

## 必填字段

| 字段 | 说明 |
|------|------|
| name | 领域名称 |
| version | 领域版本 |
| risk_level | R0/R1/R2/R3 |
| intended_use | 预期用途 |
| out_of_scope | 不适用范围 |
| known_limitations | 已知局限 |
| author_responsibility | 作者责任声明 |
| human_lock_summary | 锁定卡片摘要 |
| quality_badge | 质量徽章 |
| review_status | 审核状态 |
| provenance | 来源信息 |
| license | 许可证 |

KDNA Studio Core 在编译时自动生成 KDNA_CARD.json。

详见英文原版：[KDNA_CARD_SPEC.md](https://github.com/aikdna/kdna/blob/main/docs/KDNA_CARD_SPEC.md)
