# KDNA 快速上手指南

> [English](./getting-started.md)

如何安装 KDNA、创建你的第一个领域、并在 Agent 中使用。

## 1. 安装 CLI

```bash
npm install -g @aikdna/kdna-cli
kdna setup
```

## 2. 安装一个领域

```bash
kdna install @aikdna/writing
kdna verify @aikdna/writing --judgment
```

安装的领域存放在 `~/.kdna/`（或通过 `$KDNA_HOME` 自定义）。

## 3. 创建你的第一个领域

通过 CLI：

```bash
kdna dev scaffold my_domain
```

或从最小模板开始：

```bash
cp -r templates/minimal-domain ~/.kdna/my_domain
```

编辑两个 JSON 文件：

- `KDNA_Core.json` — 公理、本体、框架、因果结构、立场
- `KDNA_Patterns.json` — 术语、禁用词、常见误解、自查清单

填写模板中的占位符。一开始保持简短——2-3 条公理、2-3 个概念、2-3 个常见误解就够了。

## 4. 校验

```bash
kdna dev validate ~/.kdna/my_domain
```

修复所有错误后再使用。

## 5. 在 Agent 中使用

为你的 Agent 安装 `kdna-loader` 技能：

```bash
mkdir -p ~/.agents/skills/kdna-loader
cp skills/kdna-loader/SKILL.md ~/.agents/skills/kdna-loader/SKILL.md
```

当 Agent 安装了 loader 技能且有领域被安装后，Agent 会自动发现并应用 KDNA 判断。

## 6. 分享（可选）

将你的领域发布到 [kdna-registry](https://github.com/aikdna/kdna-registry)，其他人就可以 `kdna install` 使用。

## 7. 何时扩展

从 Core + Patterns 开始。用一段时间。然后在以下情况添加文件：

| 添加 | 时机 |
|---|---|
| `KDNA_Scenarios.json` | 你发现 Agent 对场景的分类有偏差 |
| `KDNA_Cases.json` | 你需要可复用的案例 |
| `KDNA_Reasoning.json` | 用户频繁问"为什么"类问题 |
| `KDNA_Evolution.json` | 你需要跟踪能力成长路径 |

**不要一开始就写满六个文件。** 让实际使用告诉你缺少什么。

## KDNA 不是什么

KDNA 是判断层，不是：
- 提示词库（不存话术模板）
- 知识库（不存事实或文档）
- 工具 API（不执行操作）
- 检索系统（不搜索外部数据）
- 操作手册（不描述流程）

它位于你的 Agent 和任务之间，在 Agent 行动之前塑造它的思考方式。
