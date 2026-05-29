# KDNA Internationalization & Localization Specification

KDNA domains encode judgment. Localization changes the language of expression, not the logic of judgment.

## Core Principle

**Localization MUST NOT change the logical meaning of axioms, boundaries, risks, or self-checks.**

A Chinese reader of a KDNA domain should receive the same judgment structure as an English reader. The words change; the axioms, IDs, boundaries, and failure risks do not.

## Language Tags

Use [BCP 47](https://tools.ietf.org/html/bcp47) language tags:

| Tag | Language |
|-----|----------|
| `en` | English |
| `zh-CN` | Chinese (Simplified) |
| `zh-TW` | Chinese (Traditional) |
| `ja` | Japanese |
| `ko` | Korean |
| `fr` | French |
| `de` | German |

Never use bare `zh` — simplified and traditional Chinese differ in community context and content expression.

## I18N Levels

| Level | Name | Requirements |
|:-----:|------|-------------|
| **L0** | Monolingual | Canonical language only |
| **L1** | Card + README | Localized KDNA_CARD.json + README in locale directory |
| **L2** | Key Fields | L1 + localized one_sentence, full_statement, key_distinction for core axioms and misunderstandings |
| **L3** | Full Overlay | L2 + localized overlays for all 6 KDNA files |
| **L4** | Locale Evals | L3 + locale-specific eval cases and examples |

**Official domains MUST be at least L1 in en + zh-CN.**

## Directory Structure

```
my-domain/
  KDNA_Core.json              ← canonical (en)
  KDNA_Patterns.json          ← canonical (en)
  KDNA_Scenarios.json         ← canonical (en)
  KDNA_Cases.json             ← canonical (en)
  KDNA_Reasoning.json         ← canonical (en)
  KDNA_Evolution.json         ← canonical (en)
  kdna.json                   ← declares default_language + languages
  KDNA_CARD.json              ← canonical KDNA Card (en)
  README.md                   ← canonical README (en)
  locales/
    zh-CN/
      KDNA_CARD.json          ← localized card
      README.md               ← localized README
      KDNA_Core.overlay.json  ← L2+: text field translations
      KDNA_Patterns.overlay.json
      evals.json              ← L4: locale-specific evals
```

## kdna.json Language Declaration

```json
{
  "name": "@aikdna/writing",
  "version": "0.7.2",
  "default_language": "en",
  "languages": ["en", "zh-CN"],
  "i18n_level": "L2"
}
```

## Overlay Format (L2+)

Overlays translate text fields only. They reference canonical IDs and NEVER change structure.

```json
{
  "locale": "zh-CN",
  "base": "en",
  "spec_version": "1.0-rc",
  "translations": {
    "axiom_problem_not_prose.one_sentence": "大多数写作问题不是语言问题，而是结构和观点层面的问题。",
    "axiom_problem_not_prose.full_statement": "当审查内容时，Agent 必须首先诊断问题是结构性的（缺少论点、引子薄弱、证据不足）还是表层的（措辞、语法、流畅度）。用语言润色处理结构性问题是最常见的写作诊断失败。",
    "axiom_problem_not_prose.why": "如果没有这条判断，Agent 只会做表层编辑建议，无法解决根本问题。",
    "axiom_problem_not_prose.applies_when.0": "用户要求审查内容",
    "axiom_problem_not_prose.applies_when.1": "用户要求改进写作",
    "axiom_problem_not_prose.does_not_apply_when.0": "用户仅要求语法检查",
    "axiom_problem_not_prose.failure_risk": "可能导致 Agent 对纯语言润色需求过度诊断结构问题。"
  }
}
```

## Localized KDNA Card (L1+)

```json
{
  "locale": "zh-CN",
  "base": "en",
  "name": "@aikdna/writing",
  "display_name": "写作判断",
  "summary": "诊断内容是否有真实观点、认知钩子和证据密度，而不是只做文字润色。",
  "intended_use": ["审查草稿质量", "诊断写作问题类型", "改进内容结构"],
  "out_of_scope": ["纯语法检查", "翻译任务", "格式化任务"],
  "known_limitations": ["未在大型组织或军事语境中测试", "假定基本组织稳定性"],
  "risk_warnings": ["可能将单纯语言问题过度诊断为结构问题"]
}
```

## Registry Declaration

```json
{
  "name": "@aikdna/writing",
  "default_language": "en",
  "languages": ["en", "zh-CN"],
  "i18n_level": "L2",
  "localized": {
    "en": {
      "display_name": "Writing Judgment",
      "description": "Diagnose whether content has a real argument, cognitive hook, and evidence density."
    },
    "zh-CN": {
      "display_name": "写作判断",
      "description": "诊断内容是否有真实观点、认知钩子和证据密度，而不是只做文字润色。"
    }
  }
}
```

## Validation Rules

A conforming validator MUST check:

1. Declared `languages` in kdna.json match actual `locales/` directories
2. Locale overlay IDs reference existing canonical IDs
3. Overlays do not add, remove, or reorder structural fields
4. Overlays only contain text-type fields (one_sentence, full_statement, why, key_distinction, etc.)
5. Localized KDNA_CARD.json has all required fields
6. `i18n_level` matches actual locale content coverage

## CLI Support

```bash
kdna inspect @aikdna/writing --locale zh-CN
kdna card @aikdna/writing --locale zh-CN
kdna verify @aikdna/writing --i18n
kdna list --locale zh-CN
```

## Studio Core Integration

The `i18n` module provides:

```js
const { i18n } = require('@aikdna/kdna-studio-core');
i18n.createLocaleOverlay(project, 'zh-CN');       // → overlay object
i18n.validateLocaleOverlay(project, overlay);      // → { valid, issues }
i18n.applyLocaleOverlay(domain, overlay);          // → localized domain
i18n.computeI18nCoverage(project);                 // → coverage score per locale
```

Quality gate rule: official domains must achieve ≥ L1 in en + zh-CN.
