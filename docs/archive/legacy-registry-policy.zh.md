# 注册表收录标准（历史）

> ⚠️ **历史 / 已废弃。** 本文件是旧版 KDNA 注册表策略。KDNA Core v1 不再定义 registry、marketplace 或 quality-badge 系统,官方 `kdna-registry` 仓库已不在 KDNA Core 范围。本文件仅作存档。
>
> 当前 KDNA Core 定位:`README.md`、`README.zh.md`、`docs/core/definition.md`、`docs/core/principles.md`。
>
> English:[./legacy-registry-policy.md](./legacy-registry-policy.md)
>
> ⚠️ **Historical / deprecated.** This document is the legacy KDNA registry policy. KDNA Core v1 no longer defines a registry, marketplace, or quality-badge system, and the canonical `kdna-registry` repository is out of scope for KDNA Core. This file is kept for reference only.

本文档定义了领域 KDNA 仓库被列入官方 [kdna-registry](https://github.com/aikdna/kdna-registry) 必须满足的条件。

KDNA 是一个**协议**，不是内容库。主仓库（[KDNA](https://github.com/aikdna/kdna)）定义标准。领域仓库编码领域判断。注册表是二者之间的桥梁——它是精选索引，不是自动列表。

`KDNA/examples/` 和 `KDNA/registry/` 目录只是协议夹具，不是官方领域目录。

## 收录条件

领域仓库必须满足以下全部条件：

1. **规范兼容。** 每个 KDNA 文件必须在 `meta.version` 声明规范版本，注册表条目必须声明与已发布 KDNA 规范版本兼容的 `spec_version`。

2. **校验通过。** 必须无错误地通过 `kdna-validate`（结构校验）。

3. **最小文件集。** 必须至少包含规范定义的 `KDNA_Core.json` 和 `KDNA_Patterns.json`。

4. **README 必备。** 必须包含 README，说明领域范围、核心洞见和文件清单。

5. **边界声明。** 必须说明领域涵盖什么以及明确不涵盖什么。

6. **许可证。** 必须包含许可证。内容文件（KDNA JSON）应使用 CC BY 4.0 或兼容许可。

7. **无隐私数据。** 不得包含个人信息、商业机密或未经授权的第三方材料。

8. **自查项。** `KDNA_Patterns.json` 必须包含可用"是/否"回答的自查项。

## 领域状态

注册表中的每个条目都有一个状态标识：

| 状态 | 含义 |
|---|---|
| `draft` | 草稿，仅表示初步判断结构，不建议使用 |
| `experimental` | 可用，但结构可能大幅变化。使用时应有此意识 |
| `stable` | 字段和核心判断稳定。可用于生产环境 Agent |
| `deprecated` | 不再推荐使用。保留在索引中仅供参考 |

## 添加领域

1. 在 `aikdna/` 下创建公开仓库，命名规范为 `kdna-<domain>`。
2. 确保满足以上全部收录条件。
3. 向 `kdna-registry` 仓库提交 Pull Request，在 `domains.json` 中添加条目。
4. PR 描述中必须包含领域简介、边界说明以及确认符合收录条件的声明。

PR 将根据收录条件进行审核。审核通过不代表对领域内容的认可——仅表示满足加入索引的结构和治理要求。
