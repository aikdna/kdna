# KDNA Core Definition

**KDNA Core is a content-neutral open judgment-asset file format and runtime loading contract.**

KDNA Core defines how judgment assets are:

- **created** — by authors, using tools
- **saved** — as portable files
- **packaged** — into a standardized container (`.kdna`)
- **encrypted** — selectively, by entry
- **decrypted** — by tools that hold the necessary keys
- **signed** — by authors and publishers
- **identified** — by asset_id and asset_uid
- **versioned** — across releases and lineage
- **traced** — at runtime, via status reports
- **loaded** — by AI runtimes and viewers
- **used** — by tools that need to read, render, or compare

KDNA Core does **not** define:

- what humans should judge
- what content is correct, valuable, or high-quality
- which authors are trustworthy
- which assets should be recommended
- which platforms should distribute them
- what runtime policy should apply (block, allow, warn)

---

KDNA Core 是一种内容中立的开放判断资产文件格式和运行时加载契约。

它定义判断资产如何被创建、保存、封装、加密、解密、签名、识别、版本化、追踪、加载和被工具使用。

它不定义人类应该拥有什么判断，也不提供官方分发、官方排名、官方推荐、官方交易、官方信任裁判或价值审查。

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
| What judgment to encode | The **author** |
| Which assets to use | The **caller** (agent / application) |
| Whether to trust a signature | The **caller** |
| Where to find assets | An **external** platform (out of scope) |
| Whether to recommend an asset | An **external** platform (out of scope) |

KDNA Core is the **verifiable primitive** that makes all of the above possible. It is not the policy layer.
