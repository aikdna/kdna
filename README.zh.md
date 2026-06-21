# KDNA

> **KDNA 是一种开放文件格式，用于封装有边界的判断，并加载进 AI Agent。**

> `.kdna` 资产推荐通过 KDNA 工具链创建、检查、保护、加载和消费。第三方产品应通过 KDNA 官方 SDK、CLI、Loader 或 API 接入 KDNA。Agent 可以通过官方 SDK 创建 `.kdna` 文件——格式合法性由 `kdna validate` 决定，不由作者身份决定。

> KDNA Core 内容中立，不评价判断内容好坏，不提供官方内容推荐、交易、评级或信任背书。

> 官方网站: [aikdna.com](https://aikdna.com) · [![npm](https://img.shields.io/npm/v/@aikdna/kdna-cli)](https://www.npmjs.com/package/@aikdna/kdna-cli)

KDNA Core 定义 `.kdna` 文件格式、Schema、运行时加载契约和官方工具链核心实现。人、Agent、工具或混合流程都可以创建 `.kdna` 文件；格式合法性由 `kdna validate` 判断。

Prompt 改变表达。RAG 扩展信息获取。Skill / 工具扩展行动能力。  
**KDNA Core 加载领域判断。**

KDNA Core 不是让 Agent 扮演专家，而是让 Agent 在一套明确的判断系统中工作。

KDNA Core 不是提示词库，不是知识库，也不是操作手册。它是一种结构化方式，封装一个领域的判断层:公理、术语边界、常见误解、场景信号、推理链条和能力演进。

> 本仓库定义 KDNA Core 格式、Schema、运行时加载契约与官方工具链核心实现。
> KDNA 官方工具链由本仓库及配套仓库共同发布。推荐通过官方 SDK、CLI、Loader 或 API 接入 KDNA。通过官方 validator 的第三方兼容实现同样有效。

## 为什么现在需要 KDNA

> **Agent 越来越会调用工具，但它们仍然缺少领域判断。**

当前的 Agent 生态已经解决了"行动"问题：函数调用、MCP、工具使用、工作流。但能行动不等于能判断——一个什么都能做的 Agent，如果分辨不了"价格异议"和"确定性缺失"，就会带着自信执行错误的操作。

工具让 AI 能行动。**KDNA 让 AI 不乱行动。**

自我改进型 Agent 需要显式判断治理。没有显式判断的改进，本质上只是漂移。KDNA 让判断结构可以被记录、验证、加载和演进；人类确认、Human Lock、签名和发布证据是可选来源与信任层，不是 `.kdna` 格式合法性的前提。

每个领域都有专家级的判断模式，目前只存在于资深从业者的头脑中。KDNA 是一种把这些模式提取出来、编码为可机器验证的结构、作为判断参照层加载到 Agent 中的格式——独立于 Prompt，独立于知识库，独立于工具。

## KDNA Core 与官方工具链

KDNA Core 是本仓库定义的判断资产格式与运行时加载契约。
`.kdna` 资产的创建、加载、消费、验证、保护都由 KDNA 工具链负责。

| 工具链组件 | 角色 | 仓库 |
|---|---|---|
| **KDNA Studio** | 人类判断资产创作环境 | [aikdna/kdna-studio-core](https://github.com/aikdna/kdna-studio-core) |
| **KDNA CLI** | 官方命令行入口（inspect / validate / pack / unpack / load） | 本仓库 + [aikdna/kdna-cli](https://github.com/aikdna/kdna-cli) |
| **KDNA Loader** | 官方运行时 loader，集成到 Agent | [aikdna/kdna-skills](https://github.com/aikdna/kdna-skills) |
| **KDNA SDK** | 官方可嵌入库，供第一方集成 | 本仓库 `packages/kdna-core/` |

第三方产品可通过官方 SDK、CLI、Loader 或 API 接入 KDNA。通过官方 validator 校验通过的第三方兼容实现同样被认可。

## 为什么需要 KDNA

大多数 Agent 框架关注工具、检索、工作流或记忆。KDNA 关注的是**判断力**：

- Agent 应该从哪些假设出发？
- 这个领域里哪些概念是核心？
- 哪些术语应该使用，哪些应该避免？
- 哪些常见误解应该被提前识别？
- 哪些场景信号应该改变 Agent 的响应策略？
- Agent 应该如何从原则推导到行动？

## Before / After KDNA

> **KDNA 优化的不是措辞，而是推理路径。**

| 没有 KDNA | 有 KDNA |
|---|---|
| 通用、知识层面的回答 | 领域特化的专家判断 |
| 把反对意见当作字面陈述 | 诊断隐藏在话语背后的不确定性 |
| "客户说太贵 → 给折扣" | "价格异议是确定性缺失 → 诊断是哪个维度" |
| "员工不执行 → 积极性问题" | "执行失败 → 检查上游系统条件" |
| "老人不参加 → 活动不够有趣" | "拒绝参与 → 识别隐形障碍（恐惧、负担感、尊严威胁）" |
| 这是个 Prompt 库 | 这是个认知编码格式 |
| 无法验证 | 每个公理、误解、自查项都可测试 |

详见 [`docs/kdna-in-action.md`](./docs/kdna-in-action.md)（英文），包含五个详细案例：相同输入，不同 KDNA 领域，完全不同的认知路径。

## KDNA 与 Skill 的关系

| 维度 | KDNA | Skill |
|---|---|---|
| 核心角色 | 认知框架 | 执行流程 |
| 核心问题 | Agent 应该怎么思考？ | Agent 应该做什么？ |
| 激活方式 | 作为领域判断加载 | 为某个任务调用 |
| 成功标志 | 判断力更好，领域错误更少 | 任务完成 |
| 典型内容 | 公理、本体、模式、推理 | 步骤、脚本、模板、工具 |

**Skill 负责执行。KDNA 塑造判断。**

## KDNA 与 LLM Wiki

KDNA 不替代 LLM Wiki——它们构成一条流水线：

```
原始材料  →  LLM Wiki  →  KDNA  →  Skills / Agents
```

| 层级 | LLM Wiki | KDNA |
|---|---|---|
| 角色 | 知识组织 | 认知编码 |
| 产出 | 链接化的 Markdown 知识库 | 领域公理、模式、判断 |
| 问题 | 团队知道什么？ | Agent 应该如何思考？ |
| 用户 | 人和 Agent | 加载领域判断的 Agent |

LLM Wiki 将文档转化为知识。KDNA 将专业知识转化为判断力。

> LLM Wiki turns documents into knowledge.  
> KDNA turns expertise into judgment.

## 文件模型

KDNA 的公共资产是一个打包后的 `.kdna` 文件。作者工具、检查工具或 `unpack` 可以把它展开成可查看、可编辑的结构化视图，但公开消费和运行时加载的主对象始终是 `.kdna` 文件本身。

```text
example.kdna
├── mimetype
├── kdna.json       # manifest、身份、版本、access mode、load contract
├── payload.kdnab   # 结构化判断 payload
└── checksums.json  # 完整性摘要
```

判断 payload 可以包含公理、适用边界、不适用边界、失败风险、术语、常见误解、自检和场景信号等结构。用户不需要直接面对内部 JSON 文件；需要检查或二次创作时，应通过官方工具链 inspect / unpack / fork / export。

## 快速开始

```bash
npm install -g @aikdna/kdna-cli
kdna validate <asset>.kdna
kdna plan-load <asset>.kdna
kdna load <asset>.kdna --profile=compact --as=prompt
```

你会看到这份 `.kdna` 的 compact profile：公理、边界、自检、失败模式和 patterns 都会被渲染成 Agent 可读的判断上下文。

```bash
# 检查一切是否正常
kdna doctor --agents
```

或克隆仓库：

```bash
git clone https://github.com/aikdna/kdna.git
cd kdna
npm install
npm run validate:examples
```

## 安装到你的 Agent

```bash
npm i -g @aikdna/kdna-cli
kdna setup
```

`kdna setup` 自动检测你的 Agent（OpenCode、Codex、Claude Code、Cursor、Gemini），安装 `kdna-loader` 技能，并创建数据目录。

只有 **一个** 技能：

| 技能 | 作用 |
|---|---|
| **kdna-loader** | 加载领域认知——检测领域、应用公理、运行自查。领域是数据资产，由 CLI 管理。 |

支持 **Codex**、**Claude Code**、**OpenCode**、**Cursor** 和 **GitHub Copilot**。

## 本地使用 KDNA

```bash
# 1. 安装 CLI + 技能
npm i -g @aikdna/kdna-cli
kdna setup

# 2. 校验一个本地 v1 .kdna
kdna validate <asset>.kdna

# 3. 规划加载
kdna plan-load <asset>.kdna

# 4. 加载为 Agent prompt
kdna load <asset>.kdna --profile=compact --as=prompt
```

要创建自己的领域：

```bash
npm install -g @aikdna/kdna-studio-cli
kdna-studio create my_expertise --name @yourscope/my_expertise
# 导入材料、生成判断卡片；需要发布证据时可加入人工确认记录
kdna-studio migrate ./my_expertise --format v1 --out dist/my_expertise.kdna --name @yourscope/my_expertise --by your-id --statement "confirmed for v1 export"
kdna validate dist/my_expertise.kdna
kdna plan-load dist/my_expertise.kdna
kdna load dist/my_expertise.kdna --profile=compact --as=prompt
```

由 KDNA Studio CLI 导出的 v1 `.kdna` 是当前 KDNA 官方工具链的最终产物。VS Code 和 `kdna dev` 命令只用于开发源工作区的诊断。签名、加密和私有资产是后续 gated 阶段，不是当前 Core v1 基线。

## 规范

完整 Core v1 规范见 [SPEC.md](./SPEC.md)。

### 试试 Demo

```bash
node examples/minimal-agent/agent.js
```

同一个用户输入，加载不同的 KDNA 领域，产生完全不同的认知分析。不需要 LLM——纯粹的判断路径对比。

## 示例资产

KDNA 的公开示例以打包的 `.kdna` 文件形式分发，不通过 GitHub 仓库作为入口。

下载 `.kdna` 文件后：

```bash
kdna validate <asset>.kdna
kdna plan-load <asset>.kdna
kdna load <asset>.kdna --profile=compact --as=prompt
```

公开示例资产的下载入口见官方网站 examples 页面。

### 演示样例

`examples/` 目录包含最小演示样例，用于测试校验器和说明规范。这些 **不是** 官方领域目录——它们是规范示例。

| 示例 | 用途 |
|---------|---------|
| [decision_state](./examples/decision_state) | 校验器测试的最小领域夹具 |
| [minimal-agent](./examples/minimal-agent) | 加载多个 KDNA 领域的 Demo Agent |
| [from-wiki-to-kdna](./examples/from-wiki-to-kdna) | LLM Wiki 到 KDNA 的流水线演示 |

### 核心文档

| 文档 | 说明 |
|---|---|
| [SPEC.md](./SPEC.md) | Core v1 协议规范 |
| [docs/getting-started.zh.md](./docs/getting-started.zh.md) | 安装、创建和使用 KDNA |
| [docs/evaluation.zh.md](./docs/evaluation.zh.md) | 如何检验 KDNA 是否改善了判断力 |
| [docs/meta-cognition.zh.md](./docs/meta-cognition.zh.md) | 何时用 KDNA、冲突仲裁、领域组合 |
| [docs/archive/legacy-registry-policy.zh.md](./docs/archive/legacy-registry-policy.zh.md) | 历史 KDNA 收录标准（已废弃,仅作存档） |
| [docs/kdna-in-chinese.md](./docs/kdna-in-chinese.md) | 中文 KDNA 编写指南 |

## 工具

| 工具 | 仓库 | 说明 |
|---|---|---|
| Skills | [kdna-skills](https://github.com/aikdna/kdna-skills) | kdna-loader 技能 + CLI 安装器，支持所有主流 Agent |

## 中文资源

- [README.zh.md](./README.zh.md) — 中文 README（当前页面）
- [docs/getting-started.zh.md](./docs/getting-started.zh.md) — 快速上手指南
- [docs/kdna-in-chinese.md](./docs/kdna-in-chinese.md) — 中文 KDNA 编写指南
- [docs/archive/legacy-registry-policy.zh.md](./docs/archive/legacy-registry-policy.zh.md) — 历史 KDNA 收录标准（已废弃,仅作存档）
- [docs/i18n.md](./docs/i18n.md) — KDNA 国际化策略

## 许可

- 代码: Apache-2.0
- 文档和示例: CC BY 4.0
