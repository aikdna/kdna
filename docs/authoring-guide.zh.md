# 创作一份好的 `.kdna` 判断作品

[English](./authoring-guide.md) | 简体中文

这份指南讲两件事：**什么样的判断值得写进 `.kdna`**，以及**怎样用现行命令行 `@aikdna/kdna-cli@0.45.2`（Container `0.6.0`，Node.js `>=22`，永久无需在线账号）创建、校验、加密与修订作品**。

---

## 1. 先选一个真实、具体的切口

不要试图在一个文件里装下整个行业或一生的感悟。先挑一个具体问题——在这里，你的品味、取舍或实战经验跟大众套话明显不一样：

- **太宽泛：** `写作`、`管理`
- **具体锋利：** `非虚构专栏写作品味`、`极简界面视觉把关`、`务实代码评审尺度`、`弱势方商业谈判与止损`

一份 `.kdna` 作品既可以是围绕一个具体手艺提炼出的六七条精炼判断，也可以是几十条彼此关联的完整判断体系。决定它是不是好作品的是**判断本身清不清楚**，而不是条目多少。

## 2. 写好每一条判断的四个要点

写判断时，尽量把下面四件事说透：

1. **它回答什么具体难题（`focus`）**：别写空泛大词，直接写出人在真实处境里会碰到的两难问题。
2. **明确立场与取舍理由（`core_expression` + `reasons`）**：当两个好目标冲突时（比如“快”与“稳”、“简洁”与“周全”、“克制”与“情绪饱满”），先保哪一个、主动放弃什么、为什么这样选。
3. **怎么判断与真实例子（`method` + `materials`）**：给出可落地的审视步骤、判断依据，或正反对照例子。
4. **停手边界、例外与常见误用（`boundaries`、`exceptions`、`misuse`）**：说清什么情况下成立、遇到什么例外必须切换做法、最容易被怎么曲解滥用。

### 口号 vs. 真正的判断

| 空洞口号（差） | 清晰判断（好） |
| --- | --- |
| “好文章要写得清楚。” | “第一段直接摊开真实矛盾；删掉‘值得注意的是/总而言之’这类套话；没想透的问题宁可诚实留白，绝不强行鸡汤收尾。” |
| “要以用户为中心。” | “用户提功能需求时，先追问他真正想完成的结果；绝不为了迎合零散建议破坏核心流程的简洁度。” |
| “代码评审要认真。” | “先查数据损坏、并发竞态和静默吞错；每次评审只抓最关键的 3 条真风险，绝不拿 15 条格式建议把致命 Bug 淹没。” |

---

## 3. 推荐做法：和你的 AI Agent 对话共创

你不需要从零手写复杂的 JSON。最顺手的方式是直接让 Claude Code、Cursor、Codex、OpenCode 或 Antigravity（配合 [`aikdna/kdna-skills`](https://github.com/aikdna/kdna-skills) 里的 `kdna-creator` 技能）通过访谈或你的旧文稿帮你梳理草稿——每条判断都先列出来给你亲眼审定，你点头确认后，再由命令行编译成 `.kdna` 文件。

---

## 4. 用命令行创建、校验、加密与版本对比

### 方式一：通过 `kdna init` 快速起稿

```bash
# 1. 生成可运行的示例草稿（支持 minimal / interview / works / research 模式）
npx -y @aikdna/kdna-cli@0.45.2 init --example --mode interview --output draft.json

# 2. 按你的真实判断修改 draft.json（核心字段：focus / statement / applies_when / boundaries / method / reasons / example）后检查结构
#    （注意：kdna.draft/1 草稿不包含 exceptions / misuse / relationships；如需添加，请先运行 `kdna compile draft.json --output author-input.json` 转为方式二的完整结构源）
npx -y @aikdna/kdna-cli@0.45.2 validate-input draft.json --format human

# 3. 打包成 Container 0.6.0 的 .kdna 文件
npx -y @aikdna/kdna-cli@0.45.2 create --draft draft.json --output my-work.kdna --allow-create

# 4. 校验文件并预览 Agent 会读到的目录
npx -y @aikdna/kdna-cli@0.45.2 validate my-work.kdna
npx -y @aikdna/kdna-cli@0.45.2 read my-work.kdna --mode catalog --format human --allow-read
```

### 方式二：完整结构源 JSON（`{ manifest, payload, members }`）

如果需要精细编排整份作品的共同前提（`shared_declarations`）、判断间关联（`support` 支撑、`qualify` 限定、`conflict` 冲突张力、`complement` 补充）、来源材料与修订历史，可直接参考仓库内可运行的最小模板 [`docs/examples/author-input-minimal.json`](./examples/author-input-minimal.json)，再用 `create` 编译：

```bash
npx -y @aikdna/kdna-cli@0.45.2 create author-input.json --output my-work.kdna --allow-create
```

### 本地离线口令加密（`RFC-0018`，无需在线账号）

```bash
# 建议从密码管理器或静默读取的变量（`IFS= read -rs KDNA_PASS`）管道传入，避免在磁盘留下明文口令文件
printf '%s' '你的高强度口令' | npx -y @aikdna/kdna-cli@0.45.2 protect my-work.kdna --output my-work.locked.kdna --password-file /dev/stdin
```

### 修订升级与版本对比（`1.0.0` → `1.1.0`）

实践中遇到新反例、完善了判断后，导出新版本并用 `diff` 逐项核对差异：

```bash
npx -y @aikdna/kdna-cli@0.45.2 diff my-work-1.0.0.kdna my-work-1.1.0.kdna --format human
```

---

## 5. 发布前自查清单

- [ ] 每条判断都围绕一个真实具体的问题展开，并且写明了取舍和理由，而不只是口号。
- [ ] 作品整体范围、停手边界、例外情况与常见误用都交代清楚。
- [ ] 彼此有前提支撑、限定制约或张力冲突的判断已经连好关系，确保按需读取时不断章取义。
- [ ] 作者署名、版本号、来源出处与许可协议如实标注。
- [ ] `npx -y @aikdna/kdna-cli@0.45.2 validate <file.kdna>` 通过，且在 **KDNA Reader** 里用人眼通读自然顺畅。
