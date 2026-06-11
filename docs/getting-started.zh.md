# KDNA 快速上手指南

> [English](./getting-started.md)

KDNA 有两个角色：**消费者**（使用已有领域）和**创作者**（自己创作）。本指南覆盖两者。

---

## 消费者路径：使用 KDNA 领域

### 1. 安装 CLI

```bash
npm install -g @aikdna/kdna-cli
kdna setup
```

这会安装 `kdna` 命令和为你的 AI Agent 安装 `kdna-loader` 技能。

### 2. 安装领域

```bash
kdna install @aikdna/writing
```

或浏览可用领域：

```bash
kdna list --available
```

### 3. 使用

你的 Agent 会通过 `kdna-loader` 自动发现已安装的 KDNA 领域。当用户提出领域相关问题，Agent 静默加载领域并应用其判断。用户看到的是更精准的判断，而不是 KDNA 内部细节。

---

## 创作者路径：创作 KDNA 领域

**受信 KDNA 资产的创建路径有且只有一条：**

```bash
npm install -g @aikdna/kdna-studio-cli
kdna-studio create my-domain
```

这会创建一个 Studio 项目（`studio.project.json`）——规范的创作工作区。

### 创作流程

1. **创建** Studio 项目：`kdna-studio create my-domain`
2. **添加卡片**（判断卡片：公理、本体、误解等）：`kdna-studio card add`
3. **锁定**卡片（内容确认后）：`kdna-studio lock --all`
4. **编译**为 `.kdna` 资产：`kdna-studio compile`
5. **导出**受信 `.kdna` 文件：`kdna-studio export`

### 以下路径不产生受信资产

- `kdna dev scaffold` — 创建非规范开发源目录，仅供实验
- `kdna dev pack` — 构建仅供开发的非受信包，不符合质量徽章要求
- 手动编辑 JSON — 适合早期原型，但不产生受信资产

### 开源领域贡献者

领域仓库使用 dev source 目录进行 Git 协作和 CI 校验。校验命令：

```bash
kdna dev validate .
```

受信 `.kdna` 资产通过 `kdna-studio` 编译发布。

---

## KDNA 不是什么

KDNA 是判断层，不是：
- 提示词库（不存话术模板）
- 知识库（不存事实或文档）
- 工具 API（不执行操作）
- 检索系统（不搜索外部数据）
- 操作手册（不描述流程）

它位于你的 Agent 和任务之间，在 Agent 行动之前塑造它的思考方式。
