# KDNA Agent 集成

KDNA 通过 kdna-skills 系统集成到主流 AI 编程 Agent 中。所有集成共享同一个 KDNA 根目录：`~/.kdna/`。

## 支持的 Agent

| Agent | Skill 路径 | 备注 |
|-------|-----------|------|
| **Claude Code** | `~/.claude/skills/kdna-loader/SKILL.md` | Anthropic — 每次请求运行 kdna-loader |
| **Codex** (OpenAI) | `~/.codex/skills/kdna-loader/SKILL.md` | OpenAI — 相同 skill，不同目录 |
| **OpenCode** | `~/.agents/skills/kdna-loader/SKILL.md` | 开源 Agent |
| **Cursor** | `~/.cursor/skills/kdna-loader/SKILL.md` | AI 原生代码编辑器 |
| **GitHub Copilot** | 通过 kdna-loader skill | 手动配置 |

## 工作原理

kdna-loader skill 是一个纯文本指令文件 (SKILL.md)，告诉 Agent：

1. 在 `~/.kdna/` 中查找 KDNA 领域
2. 用关键词匹配用户请求与领域清单
3. 加载匹配领域的 Core + Patterns 到上下文
4. 静默应用公理、立场、框架和自检

无需 API 密钥、无需网络调用、无需运行时依赖。skill 就是纯指令文本。

## 跨 Agent 兼容

所有 Agent 共享同一 `~/.kdna/` 目录。安装一次，到处使用：

```bash
kdna install writing
# 现在 Claude Code、Codex、Cursor、OpenCode 都能用
```

如果你的 Agent 使用不同路径，创建软链接：

```bash
ln -s ~/.kdna ~/.claude/Kdna
```

## 安装

```bash
curl -fsSL https://aikdna.com/install | bash
```

或手动：

```bash
npm install -g @knowledge-dna/kdna
kdna install writing
```

然后从 [kdna-skills](https://github.com/knowledge-dna/kdna-skills) 安装对应 Agent 的 loader skill。
