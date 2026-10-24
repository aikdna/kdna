# KDNA 创作指南 — 写你的第一份 author-input.json

本指南针对**当前已发布 CLI**（`@aikdna/kdna-cli@0.43.2`）的 `create` 命令输入格式，
记录 CLI 实际执行的准入规则——包括 JSON schema 中看不到的、经实证验证的多条。
完整可运行最小模板见 [`examples/author-input-minimal.json`](./examples/author-input-minimal.json)
（2 条判断，约 10 KB）。

旧 loading 线走查（CLI 0.36.1）见[试试 KDNA](./try-kdna.md)；30 分钟 Studio 线指南见
[30 分钟创作指南](./30-minute-authoring-guide.md)。

## 快速开始

```bash
mkdir my-first-asset && cd my-first-asset
npm init -y
npm install --save-exact --ignore-scripts --omit=optional --no-audit --no-fund --registry=https://registry.npmjs.org @aikdna/kdna-cli@0.43.2
# 复制最小模板、编辑后：
npx --no-install kdna create author-input.json --output my-asset.kdna --allow-create
npx --no-install kdna inspect my-asset.kdna
npx --no-install kdna validate my-asset.kdna
npx --no-install kdna read my-asset.kdna --mode catalog --budget 1000000 --allow-read
```

**安装旗标**——哪些安全必需、哪些可选：

| 旗标 | 必需？ | 作用 |
| --- | --- | --- |
| `--save-exact` | 建议 | 在 `package.json` 钉精确版本（无 `^` 漂移） |
| `--ignore-scripts` | **建议**（安全） | 跳过包生命周期脚本；本包不需要任何脚本 |
| `--omit=optional` | **绑定 Host 图时必需** | 阻止 `cbor-extract` 被拉入；未绑定的包被 Host 拒绝（见 [start-here](./start-here.md) 注记） |
| `--no-audit` / `--no-fund` | 可选 | 抑制注册表建议/资助请求；无功能影响 |

## 顶层三键

```json
{ "manifest": { ... }, "payload": { ... }, "members": [] }
```

| 键 | 内容 |
| --- | --- |
| `manifest` | **17 字段**——资产身份、版本、创建者、历史 |
| `payload` | **25 键**——判断及所有被引用对象 |
| `members` | base64 附件；纯文本资产用空数组 `[]` |

## 规则 1：版本对齐（四处必须一致）

准入层校验以下**四个字段完全相同**：

```
manifest.version                 ─┐
manifest.judgment_version         ├─ 必须是同一字符串（如 "1.0.0"）
payload.asset.asset_version      ─┤
payload.asset.judgment_version   ─┘
```

只改一侧会被拒（泛化 `READ_CORE_INVALID`）。使用完整 semver（`"2.0.0"` 而非
`"2.0"`）。用 `source-open`/`source-pack` 修订已有资产时，四处一起递增。

## 规则 2：Method term → 组件角色序列模板

每条判断有 `method` 块。`method.method.term` **决定组件角色的精确有序序列**。
缺失、多余、乱序或错配均被拒。经实证的模板：

| `term` | 必需的组件 `role` 序列（按序） |
| --- | --- |
| `interpretation` | `解读对象`、`解释关系` |
| `inference` | `判断前提`、`推导关系` |
| `tradeoff` | `候选方案`、`比较因素`、`取舍原则` |
| `criteria_comparison` | `判断标准`、`对照办法`、`归结办法` |
| `feeling` | `个人感受` |

每个组件还须带 `material_refs`（空数组 `[]` 可以——但**键必须在**，省略被拒）。

## 规则 3：其余经实证的准入规则

以下规则经 CLI 0.43.2 / Core 0.37.9 实证，**并非全部**在 JSON schema 中可见
（schema 允许的东西准入层可能拒绝）：

1. **`payload.asset` 无 `asset_uid`**——只有 `asset_id`、`asset_version`、
   `judgment_version`（`asset_uid` 仅在 `manifest` 中）。
2. **`payload.declarations`** 恰用键 `highest_question` 与 `boundaries`——不能自由命名。
3. **`payload.attributions`** 须用闭合形状
   `{"state":"provided","value":[{"role":"creator","actor_ids":[...],"statement":"..."}]}`。
4. **`payload.kernel.purpose`** 用 `{"kind":"authored","statement":"..."}`
   （不是 `{"kind":"summary"}`）。
5. **`payload.materials[].source_refs`** 的条目是**纯标识符字符串**
   （`["source:my-source"]`），不是 `{kind,id}` 对象。
6. **`answer_kind`** 必须在枚举内：`determination`、`classification`、`evaluation`、
   `status`、`diagnosis`、`estimate`、`prediction`、`applicability`、`ranking`、
   `selection`、`adjustment`、`interpretation`、`stance`、`preference`、`guidance`、
   `composite`、`other`。
7. **`examples` 可选**（官方 CLI 示例 `examples: []`），但若提供则每条须含完整
   结构：`title`、`context`、`adopted_judgments`、`application`、`results`、`source_refs`。
8. **Session 输入**：`kdna read --session` 的每行 stdin 必须是完整 ReadRequest
   **含完整 9 键 `tuple`**（从 `kdna inspect` 输出的 `tuple` 字段复制）。缺 tuple
   被拒（`READ_INPUT_INVALID`）。

## Boundary 结构

判断级 `boundaries`：

```json
"boundaries": {
  "state": "provided",
  "value": [{
    "id": "boundary:my-judgment",
    "effect": "limit",
    "statement": "适用于……；不适用于……",
    "declared_by": "actor:my-actor",
    "applies_to": { "kind": "judgments", "judgment_refs": ["judgment:my-judgment"] },
    "exception_refs": []
  }]
}
```

Boundary 声明判断成立的范围。没有 boundary 的判断在 Agent 引用时更弱——
boundary 随每次 `exact_selection` 读取的闭包一起返回。

## 修订与转换

- **修订已有资产**：先用 `kdna inspect existing.kdna` 取当前摘要——`digests.A.observed`
  字段即 `--expected-a` 值。然后：
  ```bash
  npx --no-install kdna source-open existing.kdna --expected-a sha256:<inspect取的A> --allow-source > open-output.json
  # 编辑 open-output.json 的 "edits" 对象后：
  npx --no-install kdna source-pack existing.kdna --edits edits.json --expected-a sha256:<同一A> --output revised.kdna --allow-source
  ```
  原件永不被修改。在 `edits` 中四处版本一起递增。
- **0.5 → 0.6 转换**：同一模式——先 `inspect` 取 `--expected-a`。

## `create` 不做的事

技术有效性与作者确认、采用或行动授权分别成立。`saved` 状态意味着字节已写入
并被准入——不证明内容质量，也不授予任何权限。
