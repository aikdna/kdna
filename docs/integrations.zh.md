# KDNA Agent 集成

## 当前支持的技术路径

所有兼容 Host 都可以从同一份明确的 `.kdna` 文件开始：

```bash
npm install -g @aikdna/kdna-cli
kdna validate ./asset.kdna --runtime
kdna plan-load ./asset.kdna --json
kdna load ./asset.kdna --profile=compact --as=json
```

Host 得到 Runtime Capsule。这只证明技术交付，不证明模型已经采用其中判断，也不
证明结果更好。

## Agent 适配器

`kdna-skills` 为 Codex、Claude Code、OpenCode、Cursor 和兼容 Host 保存 Skill 与
MCP 适配使命，但当前 loader Skill 的发布成熟度是 **Unassessed**。过去“全局自动
发现并静默加载”的模型不是当前产品合同。

合格适配器必须从用户明确选择的文件，或 Host 批准的精确工作区/应用/会话附加
关系开始；必须调用 `inspect → plan-load → load`，通过 Host 状态显示当前资产身份
和作用域，也不能从文件存在推导使用权。

在该流程重新验收前，请使用上面的显式 CLI/Core 路径，或在 Host 中直接集成同一
合同。`kdna setup` 成功不能证明 Agent 集成正确。

目标边界见 [Agent 适配器行为](./loader-behavior.zh.md)。
