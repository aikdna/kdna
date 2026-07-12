# KDNA Agent 集成

KDNA 通过一个 `kdna-loader` 适配 skill 集成到主流 AI 编程 Agent。本地 `.kdna` 资产通过 CLI 校验、规划和加载；不同领域是资产，不是分别注册的 skill。

## 支持的 Agent

| Agent | Skill 路径 | 备注 |
|-------|-----------|------|
| **Claude Code** | `~/.claude/skills/kdna-loader/SKILL.md` | Anthropic — 每次请求运行 kdna-loader |
| **Codex** (OpenAI) | `~/.codex/skills/kdna-loader/SKILL.md` | OpenAI — 相同 skill，不同目录 |
| **OpenCode** | `~/.agents/skills/kdna-loader/SKILL.md` | 开源 Agent |
| **Cursor** | `~/.cursor/skills/kdna-loader/SKILL.md` | AI 原生代码编辑器 |
| **GitHub Copilot** | 通过 kdna-loader skill | 手动配置 |

## 工作原理（默认安全模型）

`kdna-loader` skill 是一个纯文本指令文件（SKILL.md），它教 Agent 使用 KDNA 的协议。它不会预加载所有领域，也不会在每次请求时扫描和注入所有资产。

当你向 Agent 提问时，Agent 按任务判断：

1. **这个任务是否需要 KDNA？** 纯格式化、事实查询、代码执行等任务应静默跳过。
2. **本地有哪些 `.kdna`？** Agent 或 MCP server 通过 KDNA 工具链读取本地资产和元数据，不直接解压资产。
3. **哪份资产适用？** Agent 使用 CLI/Core 提供的元数据和资产声明的适用边界判断。
4. **加载 0 或 1 个主领域。** 如果 `does_not_apply_when` 命中，资产应自我取消资格；多个资产冲突时应让用户选择。
5. **静默应用。** 加载后，Agent 从资产的判断结构推理，但不把 KDNA 内容朗读给用户。

这样用户即使有很多 `.kdna` 文件，也不会造成上下文膨胀。Agent 先检查小型元数据，只在任务需要时加载 compact judgment profile。

## 跨 Agent 兼容

所有 Agent 可以使用同一批本地 `.kdna` 文件。先校验，再在支持 loader 的运行时中加载：

```bash
kdna demo minimal ./minimal
kdna pack ./minimal ./minimal.kdna
kdna validate ./minimal.kdna
kdna plan-load ./minimal.kdna
kdna load ./minimal.kdna --profile=compact --as=prompt
```

公开示例资产发布后，用对应 release card 中的 packaged `.kdna` 文件替换
`minimal.kdna`。

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
npm install -g @aikdna/kdna-cli
kdna demo minimal ./minimal
kdna pack ./minimal ./minimal.kdna
kdna validate ./minimal.kdna
kdna plan-load ./minimal.kdna
kdna load ./minimal.kdna --profile=compact --as=prompt
```

然后从 [kdna-skills](https://github.com/aikdna/kdna-skills) 安装对应 Agent 的 loader skill。

## 什么不会作为 skill 安装

- KDNA 领域本身。领域是 `.kdna` 资产，通过 CLI/Core 路径按需发现和加载。
- 领域创建器。正式 v1 `.kdna` 创建优先使用 Studio CLI；其它高级创作/调试工具不属于基础加载路径。
- 每项目强制加载配置。旧 `.kdna/config.json` 机制已移出主路径，因为它会让资产在用户没有请求的任务中被强制加载。
