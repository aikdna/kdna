# KDNA Agent 集成

> 本页命令固定于已发布的 Runtime CLI **0.36.1** 与 Studio CLI **0.11.0**。
> 旧版资产、LoadPlan/Runtime Capsule 和 project/card API 仅适用于这组版本。
> 当前源码请从 [Core/Read](./core-read-current-status.md) 和 [Studio](https://github.com/aikdna/kdna-studio-cli#readme) 进入；当前实现不接纳这些旧版输入，也不支持本页旧式加载与 project/card 流程；同名的 `inspect`、`validate` 使用不同的当前契约。

## 当前源码适配器

当前 [Skills/MCP 源码](https://github.com/aikdna/kdna-skills#readme)通过精确绑定的
Core/Read/CLI 依赖图提供显式本地目录、选择和公开 Read，没有旧式加载回退。
本地源码和打包 stdio 检查不证明原生 Host 安装、交付或语义采用；这些需要各自的验证。

从用户明确选择的文件或 Host 批准的精确附加关系开始，显示资产身份与作用域，
保留用户控制。文件存在或适配器安装不能产生使用权限。

## 已发布 CLI 0.36.1 的手动交接

下面是单独的旧版流程，用于生成 Runtime Capsule：

```bash
npm install -g @aikdna/kdna-cli@0.36.1
kdna validate ./asset.kdna --runtime
kdna plan-load ./asset.kdna --json
kdna load ./asset.kdna --profile=compact --as=json
```

命令成功只证明 Capsule 已输出到 stdout；Host 接收与模型采用需要另外观察。
`inspect → plan-load → load` 仅属于这组已发布版本，不是当前 Skills/MCP 的命令合同。

`kdna setup`、Skill 文件存在、全局发现或静默加载都不能证明 Host 集成正确。
共同的选择和权限边界，以及带版本的旧版顺序，见
[Agent 适配器行为](./loader-behavior.zh.md)。
