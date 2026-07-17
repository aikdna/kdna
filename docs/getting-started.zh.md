# KDNA 快速上手指南

> [English](./getting-started.md)

KDNA 有一条默认已验证路径：通过 Studio CLI 创建范围明确的 `.kdna` 资产，用运行时 CLI 校验，规划授权与就绪状态，再为 Agent 加载 Runtime Capsule。

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
  --field applies_when='["teaching KDNA to a new user"]' \
  --field does_not_apply_when='["only demonstrating CLI syntax"]' \
  --field failure_risk="Users may copy the format without preserving judgment." \
  --field confidence="high" \
  --field evidence_type="practice"
```

### 确认并导出

```bash
kdna-studio card approve my_domain --all --by your-id --statement "I confirm this judgment for export."
kdna-studio export my_domain --out ./my_domain.kdna
```

---

## 校验

```bash
kdna validate ./my_domain.kdna
kdna plan-load ./my_domain.kdna
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
kdna load ./my_domain.kdna --profile=compact --as=prompt
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

## 高级工作流

当前 public beta 的基础路径刻意保持很小：创建或生成 packaged `.kdna`
文件，校验，规划加载，然后加载。高级创作者命令、Agent 适配器命令和
legacy 兼容命令统一记录在 [status.md](./status.md)。

---

## 当前边界

- KDNA Core 定义文件格式、校验、打包、解包和加载契约。
- `kdna validate` 证明结构、schema、payload、checksum、load contract 是否成立。
- `kdna load` 把资产渲染成 Agent 可消费的上下文。
- KDNA Core 不评价内容质量，不做官方推荐，也不替调用方决定运行时策略。

---

## KDNA 增加什么、不替代什么

Prompt、Skill、Policy、Memory、知识、检索和 Workflow 都可以携带判断；`.kdna`
也可以包含表达判断所需的事实前提、示例、引用和方法说明。

KDNA 不替代这些系统。它增加标准资产身份、完整性、授权、加载和投影合同；它
不负责搜索外部数据、授予工具权限、执行流程、认证事实前提或保证行为改善。
