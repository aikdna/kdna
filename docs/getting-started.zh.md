# KDNA 快速上手指南

> [English](./getting-started.md)

如何安装 KDNA、创建你的第一个领域、并在 Agent 中使用。

## 1. 安装加载器技能

**推荐：一键安装**

```bash
curl -fsSL https://raw.githubusercontent.com/aikdna/kdna-skills/main/install.sh | bash
```

这会自动检测你安装的 Agent 并完成配置。详见 [kdna-skills](https://github.com/aikdna/kdna-skills)。

**手动安装（OpenCode）：**

```bash
mkdir -p ~/.agents/skills/kdna-loader
cp skills/kdna-loader/SKILL.md ~/.agents/skills/kdna-loader/SKILL.md
mkdir -p ~/.agents/skills/kdna-create
cp skills/kdna-create/SKILL.md ~/.agents/skills/kdna-create/SKILL.md
```

## 2. 搭建 KDNA 本地库

```bash
mkdir -p ~/.agents/Kdna
```

从官方 [kdna-registry](https://github.com/aikdna/kdna-registry) 添加领域，或创建自己的。

## 3. 创建你的第一个领域

从模板开始：

```bash
cp -r templates/minimal-domain ~/.agents/Kdna/my_domain
```

编辑两个 JSON 文件：

- `KDNA_Core.json` — 公理、本体、框架、因果结构、立场
- `KDNA_Patterns.json` — 术语、禁用词、常见误解、自查清单

填写模板中的占位符。一开始保持简短——2-3 条公理、2-3 个概念、2-3 个常见误解就够了。

**更好的方式：** 安装 `kdna-create` 技能后，直接对你的 Agent 说"帮我创建一个 XX 领域的 KDNA"，Agent 会通过访谈引导你完成。

## 4. 校验

```bash
npx kdna dev validate ~/.agents/Kdna/my_domain
```

修复所有错误后再使用。

## 5. 添加到注册表（可选）

创建或编辑 `~/.agents/Kdna/registry.json`：

```json
{
  "version": "1.0-rc",
  "root": "~/.agents/Kdna",
  "domains": [
    {
      "id": "my_domain",
      "name": "我的领域",
      "path": "my_domain",
      "status": "local",
      "description": "这个领域涵盖的内容。",
      "triggers": ["关键词1", "关键词2"]
    }
  ]
}
```

`triggers` 字段帮助 Agent 根据用户的问题自动发现应该加载哪个领域。

## 6. 使用

当你的 Agent 安装了 `kdna-loader` 技能，用户提出与你的领域相关的问题时，Agent 会：

1. 在 `~/.agents/Kdna/` 中搜索匹配的领域
2. 加载 `KDNA_Core.json` 和 `KDNA_Patterns.json`
3. 根据用户任务按需加载可选文件
4. 在回答前应用领域公理、术语和自查清单

用户看到的是一个被领域判断塑造过的回答——而不是 KDNA 的摘要。

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
