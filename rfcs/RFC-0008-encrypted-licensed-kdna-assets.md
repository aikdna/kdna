# RFC-0008: Encrypted and Licensed KDNA Assets

Status: draft

## Summary

Licensed KDNA assets use the same `.kdna` container and media type as open
assets, but selected internal entries may be encrypted. The manifest remains
plaintext for discovery, registry verification, entitlement checks, and runtime
policy.

## Motivation

KDNA supports open, licensed, and runtime access modes. Licensed assets need a
single interoperable container profile so that Studio exporters, CLI verifiers,
registries, and runtimes agree on what is encrypted, what stays public, how
digests and signatures are computed, and how licenses unlock protected
judgment only in memory.

## Plaintext Entries

The following entries MUST remain plaintext:

- `mimetype`
- `kdna.json`
- `README.md`
- `LICENSE`
- `KDNA_CARD.json`
- public `reports/` entries required to justify quality claims
- `signature.json`, when present
- entitlement or encryption metadata entries

Plaintext metadata MUST NOT expose protected proprietary judgment content.

## Encrypted Entries

The following entries MAY be encrypted:

- `KDNA_Core.json`
- `KDNA_Patterns.json`
- optional `KDNA_*.json` judgment entries
- private eval raw outputs
- private implementation notes

Assets MAY mix plaintext and encrypted entries. Encrypted entries MUST be
declared in `kdna.json` under `encryption.encrypted_entries`.

## Encryption Profile

The baseline profile is `kdna-licensed-entry-v1`.

Required algorithms:

- Content encryption: `AES-256-GCM`.
- Key derivation or wrapping: `HKDF-SHA256` plus authenticated key wrapping, or
  a public-key wrapping profile named in `encryption.key_wrapping`.
- Per-entry nonce: unique 96-bit nonce for AES-GCM.
- Authentication tag: stored with each encrypted entry.

Implementations MAY add `XChaCha20-Poly1305` as a future profile, but MUST NOT
label it `kdna-licensed-entry-v1`.

## Key Model

1. Studio export generates a random content encryption key per asset.
2. The content key encrypts protected entries.
3. A license activation exchanges or unwraps an entitlement key that can unwrap
   the content key for an authorized user, machine, organization, or offline
   license.
4. License keys MUST NOT be the raw content encryption key.
5. Revocation targets license grants or wrapped keys, not the immutable asset
   bytes.

## Digest and Signature Rules

`asset_digest` is computed over the complete `.kdna` file bytes, including
ciphertext and encryption metadata.

`content_digest` is computed over the canonical internal content tree as stored
in the asset. For encrypted entries, the digest input is the ciphertext envelope
and metadata, not decrypted plaintext. A Studio exporter MAY also produce a
detached private plaintext review digest for expert review, but that digest is
not the registry install digest.

Signatures cover the canonical payload as stored in the asset. Registry and CLI
verification MUST be possible without decrypting protected entries.

## License Activation

Runtimes MUST:

- verify the `.kdna` asset digest before license activation;
- verify signature requirements before loading protected entries;
- validate license signature, subject, scope, expiry, and revocation state;
- unwrap keys only after entitlement validation;
- decrypt protected entries in memory only;
- avoid writing decrypted entries to persistent disk.

Offline licenses MAY include an expiry, machine binding, and signed revocation
snapshot. Offline grace periods MUST be explicit in the license metadata.

## Yank and Revocation

Registry yanks prevent new installs. Registry revocations MUST block matching
assets by `name`, `version`, or `asset_digest`. License revocation prevents
future decryption even if an asset remains installed.

## Evaluation and Review Evidence

Encrypted assets can claim `tested` or higher only when they publish enough
plaintext evidence for the claimed badge:

- public eval case descriptions or redacted cases;
- quality gate report;
- human-lock report;
- provenance report;
- reviewer signature or review report for expert levels.

Private raw outputs MAY remain encrypted, but the registry MUST have enough
public or authorized review evidence to validate the quality claim.

## Security Considerations

Container-level ZIP encryption is forbidden. Encryption occurs at the internal
entry level with authenticated encryption. Plaintext manifest metadata must be
minimal, truthful, and sufficient for policy decisions. Loaders must treat
decrypted content as sensitive runtime memory.

## Open Questions

- Whether `XChaCha20-Poly1305` should be promoted to a second required profile.
- Whether registry-hosted transparency logs should publish encrypted-entry
  envelope hashes separately from whole-file `asset_digest`.
