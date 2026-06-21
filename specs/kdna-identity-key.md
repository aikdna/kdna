# KDNA Identity Key Specification v0.1

> Historical pre-v1 identity-key draft. Current public beta `.kdna` files do
> not require identity keys, registry trust metadata, or signatures for format
> validity. Treat this file as an archived design note until a current trust
> RFC supersedes it.

## 1. Purpose

KDNA Identity Keys provide cryptographic proof of authorship for published
`.kdna` assets. They are used to sign asset metadata and establish registry
trust, not to decrypt buyer licenses.

Licensed user activation is defined in `kdna-entitlement-api.md`. Local
licensed loading uses a `license_key` plus machine fingerprint to derive an
in-memory decrypt hook for `kdna-licensed-entry-v1`.

## 2. Key Format

- **Algorithm:** Ed25519
- **Encoding:** PEM (PKCS#8 for private, SPKI for public)
- **Storage:** `~/.kdna/identity/kdna.key` (chmod 600), `~/.kdna/identity/kdna.pub`

## 3. Publisher Fingerprint Derivation

```
fingerprint = SHA-256(public_key_pem)[0:12]
```

The fingerprint is a short stable identifier for registry trust metadata and
human-readable CLI output. It is not a license identifier.

## 4. Commands

### 4.1 Initialize Identity

```bash
kdna identity init
```

Creates key pair if it does not exist. Outputs public key fingerprint.
Idempotent and safe to run multiple times.

### 4.2 Export for Backup

```bash
kdna identity export --output backup.age
```

Encrypts the private key with a passphrase using age encryption. The output file can be stored anywhere.

### 4.3 Import from Backup

```bash
kdna identity import backup.age
```

Decrypts backup with passphrase, restores private key.

### 4.4 Rotate Keys

```bash
kdna identity rotate
```

Generates a new publisher key pair. Existing published assets remain signed by
the old key and continue to verify through registry trust metadata until the
registry rotates or revokes that key.

### 4.5 Show Public Key

```bash
kdna identity show
```

Displays public key fingerprint.

## 5. License Boundary

Identity keys MUST NOT be treated as buyer license keys. The production licensed
flow is:

1. Install immutable `.kdna` asset under `~/.kdna/packages/`.
2. Activate license through the Entitlement API.
3. Store activation metadata outside the asset in `~/.kdna/licenses/`.
4. Derive the entry decrypt hook in memory from `license_key` and
   `machine_fingerprint`.
5. Decrypt protected entries in memory only.

## 6. Security

- Private key file MUST be chmod 600
- Private key MUST NEVER be transmitted to the Registry
- Registry stores public trust metadata only
- If private key is lost, existing published assets remain verifiable but the
  publisher cannot sign new releases with that identity
