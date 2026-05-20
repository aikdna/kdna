# Creator Workflow

KDNA 领域不应该依赖少数人临场手写好 JSON。这个流程定义了创建一个 experimental 公开领域的最小可重复路径。

当前阶段的目标是基础设施质量：边界清楚、文件有效、安装链路可用、内部 smoke test 通过。外部评审和公开 benchmark 是后续阶段。

## 1. 选择窄领域

先选择一个判断问题，不要选择一个职业。

使用这句话：

```text
这个 KDNA 帮助 Agent 判断 ______，从而 ______。
```

如果两个空不能具体填出来，这个领域就太宽。

## 2. 先写边界

每个领域 README 必须包含：

```md
## Scope

This KDNA helps agents...

## Out of Scope

This KDNA is not...
```

这能防止官方领域变成模糊内容桶。

## 3. 先做 Core + Patterns

起步只写：

- `KDNA_Core.json`
- `KDNA_Patterns.json`
- `kdna.json`
- `README.md`

最小内容：

- 2-4 条公理
- 2-4 个本体概念
- 1 个诊断框架
- 2-4 个立场
- 2-5 个禁用词
- 2-4 个常见误解
- 3-5 个 yes/no 自查项

Core + Patterns 没有改变 Agent 判断之前，不要急着补可选文件。

## 4. 有信号再扩展

只有出现明确需要时才添加可选文件：

| 文件 | 添加时机 |
|---|---|
| `KDNA_Scenarios.json` | Agent 需要按场景切换策略 |
| `KDNA_Cases.json` | 领域需要具体案例展示结构 |
| `KDNA_Reasoning.json` | 领域需要显式 why/therefore 推理链 |
| `KDNA_Evolution.json` | 领域需要成长阶段或能力层级 |

可选文件不能用来凑完整。

## 5. 生成 Registry 元数据

registry 条目必须指向独立仓库：

```text
https://github.com/aikdna/kdna-<domain>
```

不能指向 `KDNA/examples/*`。

提交前运行：

```bash
node scripts/validate-registry.js
node scripts/validate-registry.js --remote
```

## 6. 结构校验

在 KDNA 协议仓库中运行：

```bash
node validators/kdna-lint.js ../kdna-<domain>
node validators/kdna-validate.js ../kdna-<domain>
```

两者都必须通过。

## 7. 内部 Smoke Test

第一批公开领域必须在这里至少有一个内部 smoke case：

```text
tests/public-domain-smoke.json
```

运行：

```bash
node scripts/smoke-public-domains.js
```

Smoke test 不证明质量。它只捕捉接线错误：registry 错、术语缺失、明显选域失败。

## 8. 以 Experimental 发布

当前阶段使用：

```json
{
  "status": "experimental",
  "quality_badge": "experimental",
  "test_count": 0
}
```

在证据门槛真实满足之前，不要声称 `validated`、`expert-reviewed` 或 `production-ready`。

## 9. 常见失败模式

出现以下情况就要退回修改：

- Scope 是一个职业，而不是一个判断问题
- 公理是口号
- 边界只写 "not X"，没有说明常和什么混淆
- 误解是稻草人
- 可选文件只是重复 Core + Patterns
- README 缺少 Scope 和 Out of Scope
- Registry 指向协议仓库
- lint 过了但 schema validate 失败

## 10. 发布清单

```text
[ ] README 有 Scope 和 Out of Scope
[ ] kdna.json file_count 与实际 KDNA 文件数一致
[ ] kdna-lint 通过
[ ] kdna-validate 通过
[ ] registry validator 通过
[ ] registry remote validator 通过
[ ] smoke test 通过
[ ] 除非证据门槛满足，否则 status 保持 experimental
```
