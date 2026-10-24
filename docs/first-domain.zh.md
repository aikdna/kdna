# 你的第一个 KDNA 领域

> 本页命令固定于已发布的 Runtime CLI **0.36.1** 与 Studio CLI **0.11.0**。
> 旧版资产、LoadPlan/Runtime Capsule 和 project/card API 仅适用于这组版本。
> 当前源码请从 [Core/Read](./core-read-current-status.md) 和 [Studio](https://github.com/aikdna/kdna-studio-cli#readme) 进入；当前实现不接纳这些旧版输入，也不支持本页旧式加载与 project/card 流程；同名的 `inspect`、`validate` 使用不同的当前契约。

> 简明指南。详细端到端教程见 [First Domain Walkthrough](./first-domain-walkthrough.md)（英文）。

10 分钟内构建一个可工作的 KDNA 领域，并看到它如何改变 Agent 的判断。

## 第一步：安装

```bash
npm i -g @aikdna/kdna-cli@0.36.1
```

## 第二步：创建开发源工作区

```bash
kdna demo minimal ./my-domain
```

这会生成一个非权威的开发源工作区（`mimetype`、`kdna.json`、`payload.kdnab`、`checksums.json`）。阅读更完整的判断结构示例，可查看仓库内 `templates/minimal-domain/` 的 `KDNA_Core.json` 与 `KDNA_Patterns.json`（仅作阅读参考；对模板目录执行 `kdna inspect`/`validate` 会因结构不属于该发布线而 exit 2）。需要可信 `.kdna` 资产时，请使用 [`@aikdna/kdna-studio-cli`](https://github.com/aikdna/kdna-studio-cli)（`kdna-studio create` / `card` / `export`）完成 Human Lock、编译和导出。

## 第三步：查看

```bash
kdna inspect ./my-domain
```

你会看到：1 条公理、1 个本体概念、1 个框架、2 个立场、2 个禁用词、2 条自检。

## 第四步：理解判断结构

打开 `KDNA_Core.json`，注意：

- **公理** 不是泛泛而谈的建议，而是具体可验证的原则。比如"清晰度是写作者唯一的义务"。
- **本体** 定义了概念的含义和边界。比如"认知负荷是心智努力，不是降智"。
- **立场** 声明了领域的默认姿态。比如"写作是为了传递理解，不是为了炫耀智力"。

打开 `KDNA_Patterns.json`，注意：

- **禁用词** 包括 `"obviously"`——附有为什么误导和该用什么替代的解释。
- **误解识别** 捕捉错误假设。比如"好文章需要复杂词汇"是错误的。
- **自检** 是 Agent 在回答前问自己的 yes/no 问题。

## 第五步：看到变化

**不使用 KDNA**——如果你让 Agent "帮我审这篇博客"，它给出的是通用编辑建议。

**加载 writing KDNA 后**——同一个 Agent：

1. 检查每个段落是否服务于一个明确的想法
2. 标记使用禁用词的句子
3. 自问："每个句子能被目标读者一次性读懂吗？"
4. 建议删除多于重写

核心转变：**KDNA 改变的是 Agent 注意到什么，而不仅仅是措辞。**

## 第六步：创建你自己的

上面的源目录是生成的演示工件。请按 [30 分钟创作指南](./30-minute-authoring-guide.md)（英文）在新目录中创建你的正式创作项目，包括判断材料、显式确认与导出；复用生成的演示目录作为新 Studio 项目会失败，空项目不能导出。对开发源工作区的检查命令仍是：

```bash
kdna validate ./my-domain
```

注：更早草稿时代的 `kdna publish --check` 不存在于任何已发布线的命令清单（在
0.36.1 与当前线均 exit 2）；本线可用的检查命令是上面的 `kdna validate`。

**下一步**：[Loader 行为规范](./loader-behavior.zh.md) — 理解 Agent 该如何使用 KDNA。
