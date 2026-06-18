# KDNA 快速上手指南

> [English](./getting-started.md)

KDNA 有两个核心角色：

- **消费者**：校验、加载已有 `.kdna` 判断资产，让 Agent 使用其中的判断结构。
- **创作者**：用 Studio 工具链创建、迁移、导出正式的 v1 `.kdna` 判断资产。

KDNA Core v1 不依赖公开 registry。当前官方路径是本地 `.kdna` 文件：

```text
Studio / source
→ v1 .kdna container
→ kdna validate
→ kdna load --profile=compact --as=prompt
→ Agent context
```

---

## 消费者路径：使用已有 `.kdna`

### 1. 安装 CLI

```bash
npm install -g @aikdna/kdna-cli
```

### 2. 创建并校验一个本地 v1 示例

```bash
kdna demo minimal ./minimal
kdna pack ./minimal ./minimal.kdna
kdna validate ./minimal.kdna
```

成功时 `overall_valid` 应为 `true`，并且 format、schema、payload、checksums、load contract 都通过。

### 3. 加载为 Agent 可读上下文

```bash
kdna load ./minimal.kdna --profile=compact --as=prompt
```

这会输出 Agent 可直接读取的判断上下文。KDNA 不要求 Agent 在回答中引用“KDNA 说了什么”；它的作用是改变 Agent 判断任务的方式。

### 4. 安装 Agent Loader

```bash
kdna setup
kdna doctor --agents
```

`kdna setup` 会把 `kdna-loader` skill 安装到支持的 Agent 目录中。Loader 的当前职责是发现、校验、加载本地 `.kdna` 判断资产；它不把 registry 当成 v1 的必要路径。

---

## 创作者路径：创建正式 v1 资产

### 1. 安装 Studio CLI

```bash
npm install -g @aikdna/kdna-studio-cli
```

### 2. 创建或迁移 Studio 项目

```bash
kdna-studio create my_domain --name @yourscope/my_domain
```

如果你已有 KDNA 源目录或旧格式项目，可通过 Studio CLI 迁移为 v1：

```bash
kdna-studio migrate ./my_domain --format v1 --out ./my_domain.kdna
```

### 3. 校验并加载

```bash
kdna validate ./my_domain.kdna
kdna load ./my_domain.kdna --profile=compact --as=prompt
kdna load ./my_domain.kdna --profile=full --as=json
```

正式 v1 资产应包含：

- `mimetype`
- `kdna.json`
- `payload.kdnab`
- `checksums.json`

---

## 当前边界

- KDNA Core v1 定义文件格式、校验、打包、解包和加载契约。
- `kdna validate` 证明结构、schema、payload、checksum、load contract 是否成立。
- `kdna load` 把资产渲染成 Agent 可消费的上下文。
- KDNA Core v1 不定义 quality badge、内容评级、官方推荐、marketplace 或公开 registry。
- encryption / signature / private asset loading 是后续阶段，不能替代当前 v1 文件链路验收。

---

## KDNA 不是什么

KDNA 是判断层，不是：

- 提示词库
- 知识库
- 工具 API
- 检索系统
- 操作手册

它位于 Agent 和任务之间，在 Agent 行动之前提供可校验、可加载、可版本化的领域判断结构。
