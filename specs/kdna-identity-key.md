# KDNA Identity Key Specification v0.1

## 1. Purpose

KDNA Identity Keys provide cryptographic proof of ownership for KDNA licenses. Every buyer generates a key pair locally. The public key is registered with the KDNA Registry. The private key never leaves the buyer's device.

## 2. Key Format

- **Algorithm:** Ed25519
- **Encoding:** PEM (PKCS#8 for private, SPKI for public)
- **Storage:** `~/.kdna/identity/kdna.key` (chmod 600), `~/.kdna/identity/kdna.pub`

## 3. Buyer ID Derivation

```
buyer_id = SHA-256(public_key_pem)[0:16]
```

The buyer_id is a hex string derived from the public key. It is stable across sessions and uniquely identifies the buyer to the Registry without revealing the public key in URLs or logs.

## 4. Commands

### 4.1 Initialize Identity

```bash
kdna identity init
```

Creates key pair if it doesn't exist. Outputs buyer_id. Idempotent — safe to run multiple times.

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

Generates new key pair. All active licenses are re-encrypted with the new public key. Old private key is archived for 30 days.

### 4.5 Show Public Key

```bash
kdna identity show
```

Displays buyer_id and public key fingerprint.

## 5. License Binding

When a license is issued, the Content Key (CK) is encrypted with the buyer's public key:

```
ck_encrypted = ECDH-ES + AES-256-KW(public_key, CK)
```

Only the holder of the corresponding private key can decrypt CK.

## 6. Security

- Private key file MUST be chmod 600
- Private key MUST NEVER be transmitted to the Registry
- Registry stores only the public key
- If private key is lost, all licenses are permanently inaccessible — backup is essential
