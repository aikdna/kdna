# KDNA 快速上手指南

> [English](./getting-started.md)

KDNA Core v1 有一条已验证路径：通过 Studio CLI 在本地创建有边界的 `.kdna` 资产，用运行时 CLI 校验，规划加载，并加载进 Agent 上下文。

---

## 安装工具链

```bash
npm install -g @aikdna/kdna-cli @aikdna/kdna-studio-cli
```

现在有两个命令可用：
- `kdna` — 运行时 CLI：inspect、validate、pack、unpack、load
- `kdna-studio` — 创作 CLI：create project、add cards、export assets

---

## 创建 .kdna 资产

```bash
kdna-studio create my_domain --name @yourscope/my_domain
```

这会创建一个 Studio 项目（`studio.project.json`）——正式的创作工作区。

### 添加判断材料

```bash
kdna-studio card add my_domain axiom \
  --field one_sentence="KDNA assets preserve judgment before style." \
  --field full_statement="A KDNA asset must preserve boundaries, self-checks, and failure modes before presentation polish." \
  --field why="Without boundaries, a KDNA asset becomes a prompt template instead of reusable judgment." \
  --field applies_when="teaching KDNA to a new user" \
  --field does_not_apply_when="only demonstrating CLI syntax" \
  --field failure_risk="Users may copy the format without preserving judgment."
```

### 确认并导出

```bash
kdna-studio card approve my_domain <card-id> --by <your-id> --statement "I confirm this judgment for v1 export."
kdna-studio export my_domain --format v1 --out dist/my_domain.kdna
```

---

## 校验

```bash
kdna validate dist/my_domain.kdna
kdna plan-load dist/my_domain.kdna
```

预期结果：

```json
{
  "format_valid": true,
  "schema_valid": true,
  "payload_valid": true,
  "checksums_valid": true,
  "load_contract_valid": true,
  "overall_valid": true,
  "problems": []
}
```

---

## 加载进 Agent 上下文

```bash
kdna load dist/my_domain.kdna --profile=compact --as=prompt
```

这会输出 Agent 可读的判断上下文。Agent 静默引用判断结构——用户看到更好的回答，而非 KDNA 内部细节。

---

## 不想创建只想试用

如果只想看工具链跑通，不需要创建自己的领域：

```bash
kdna demo minimal ./minimal
kdna pack ./minimal ./minimal.kdna
kdna validate ./minimal.kdna
kdna plan-load ./minimal.kdna
kdna load ./minimal.kdna --profile=compact --as=prompt
```

---

## 不是当前官方路径的操作

- `kdna dev scaffold` — 面向高级工作流的实验性创作者工具
- `kdna dev pack` — 实验性创作者工具；推荐的创作路径是 Studio 导出
- 手动编辑 JSON — 可用于早期原型；面向发布的资产应优先走 Studio 导出
- `kdna setup` — Agent 适配器安装；基础 validate / plan-load / load 路径不需要它
- `kdna install <domain>` — 不属于当前本地 packaged `.kdna` 路径

---

## 当前边界

- KDNA Core v1 定义文件格式、校验、打包、解包和加载契约。
- `kdna validate` 证明结构、schema、payload、checksum、load contract 是否成立。
- `kdna load` 把资产渲染成 Agent 可消费的上下文。
- KDNA Core v1 不评价内容质量，不做官方推荐，也不替调用方决定运行时策略。

---

## KDNA 不是什么

KDNA 是判断层，不是：
- 提示词库
- 知识库
- 工具 API
- 检索系统
- 操作手册

它位于 Agent 和任务之间，在 Agent 行动之前提供可校验、可加载、可版本化的领域判断结构。
