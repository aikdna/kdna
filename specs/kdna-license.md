# KDNA Asset License Boundary

Version: 0.3  
Status: **Current responsibility boundary; KCL terms remain publisher-selected**

This document separates the open-source software license from the legal license
of an individual KDNA asset. It is not legal advice, a marketplace contract, a
price schedule, or a promise that technical controls can enforce every legal
term.

## 1. Two Independent Licenses

The source code and documentation in this repository are licensed under
Apache-2.0 unless a file states otherwise.

Each `.kdna` asset has its own publisher-selected legal license. The asset
license controls copying, redistribution, modification, attribution,
commercial use, and any additional terms. A KDNA `access` value controls only
the technical authorization path; it does not replace or infer the legal
license.

Examples:

- a `public` asset may still require attribution or restrict redistribution;
- a `licensed` asset may use a custom commercial license;
- a `remote` asset remains subject to the publisher's terms and the embedding
  service contract.

## 2. Manifest Declaration

The current machine-readable authority is
[`manifest.schema.json`](../schema/manifest.schema.json). Its `license` field
accepts a string identifier or a small object containing `type` and optional
`url`.

```json
{
  "license": {
    "type": "CC-BY-4.0",
    "url": "https://creativecommons.org/licenses/by/4.0/"
  }
}
```

The manifest does not protocolize prices, seat counts, training permissions,
refunds, renewals, revenue sharing, legal enforcement, or marketplace
availability. A publisher communicates those terms through the actual license
and product agreement.

## 3. KDNA Commercial License

[`LICENSE-KCL-1.0.md`](./LICENSE-KCL-1.0.md) is an available custom license
text. It applies to an asset only when the publisher explicitly selects it and
delivers the applicable terms to the licensee. Its presence in this repository
does not make every KDNA commercial, does not create a sale, and does not
create an AIKDNA-hosted licensing service.

Publishers should obtain legal advice before relying on a custom license.
Technical implementations must not present KCL as legal advice or silently add
it to an asset.

## 4. Technical Authorization Is Separate

Core and compatible runtimes may enforce format, integrity, declared access,
supported crypto profiles, and supplied entitlement evidence. They cannot
prove that a user has complied with every legal term or that generated output
is non-infringing.

The current boundaries are:

- [`kdna-access-modes.md`](./kdna-access-modes.md) for `public`, `licensed`, and
  `remote`;
- [`kdna-authorization-contract.md`](./kdna-authorization-contract.md) for
  LoadPlan authorization;
- [`kdna-crypto-profiles.md`](./kdna-crypto-profiles.md) for protected-entry
  wire profiles;
- [`kdna-secret-store.md`](./kdna-secret-store.md) for secret handling.

Watermarking, chain-of-custody, billing, subscription management, multi-asset
license resolution, and automated revenue sharing are product-specific
capabilities unless a separately versioned public contract says otherwise.

## 5. Publication and Change

A publisher should:

1. identify the exact asset version and bytes;
2. select a license that the publisher has authority to grant;
3. include the correct manifest license identifier or URL;
4. distribute the full legal terms through an appropriate channel;
5. treat a material license or access change as a new asset release.

Changing a manifest later cannot revoke rights already granted under an
earlier distribution. Legal questions remain governed by the applicable terms
and jurisdiction, not by this protocol document.
