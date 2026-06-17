# KDNA Core Definition

**KDNA Core is the official KDNA judgment-asset format and runtime loading contract.**

`.kdna` assets are created, inspected, protected, loaded, and consumed through the official KDNA toolchain. Third-party products integrate KDNA through the official SDK, CLI, Loader, or API.

KDNA Core defines how judgment assets are:

- **created** — by authors, through the official KDNA toolchain
- **saved** — as portable files
- **packaged** — into a standardized container (`.kdna`)
- **encrypted** — selectively, by entry
- **decrypted** — by the official loader, when keys are available
- **signed** — by authors and publishers
- **identified** — by asset_id and asset_uid
- **versioned** — across releases and lineage
- **traced** — at runtime, via status reports
- **loaded** — by the official KDNA loader runtime
- **used** — by tools that integrate through the official SDK, CLI, Loader, or API

KDNA Core does **not** define:

- what humans should judge
- what content is correct, valuable, or high-quality
- which authors are trustworthy
- which assets should be recommended
- which platforms should distribute them
- what runtime policy should apply (block, allow, warn)

---

**KDNA Core 是 KDNA 官方判断资产格式与运行时加载契约。**

`.kdna` 资产通过 KDNA 官方工具链创建、检查、保护、加载和消费。第三方产品通过 KDNA 官方 SDK、CLI、Loader 或 API 接入 KDNA,而不独立实现。

它定义判断资产如何被创建、保存、封装、加密、解密、签名、识别、版本化、追踪、加载和被工具使用。

它不定义人类应该拥有什么判断,也不提供官方分发、官方排名、官方推荐、官方交易、官方信任裁判或价值审查。

---

## What this means in practice

| Concern | Who decides |
| --- | --- |
| File format | **KDNA Core** (this repo) |
| Manifest schema | **KDNA Core** |
| Payload profile schema | **KDNA Core** |
| Encryption envelope metadata | **KDNA Core** |
| Signature metadata | **KDNA Core** |
| Runtime load contract | **KDNA Core** |
| How to create / inspect / load / consume `.kdna` files | The **official KDNA toolchain** |
| What judgment to encode | The **author** |
| Which assets to use | The **caller** (agent / application) |
| Whether to trust a signature | The **caller** |
| How a third party integrates KDNA | The **official SDK / CLI / Loader / API** |
| Where to find assets | An **external** platform (out of scope) |
| Whether to recommend an asset | An **external** platform (out of scope) |

KDNA Core is the **verifiable primitive** that makes all of the above possible. It is not the policy layer. The format is documented publicly so files are verifiable; the official toolchain is canonical so the verification is meaningful.
