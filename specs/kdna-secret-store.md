# KDNA SecretStore Contract

Status: Draft  
Normative: Yes for native product apps

## 1. Scope

SecretStore defines how KDNA runtimes store and retrieve long-lived secrets used
to unlock licensed assets. It does not define entitlement business policy or
payment flows.

## 2. Core Rule

Native product apps MUST NOT store `license_key`, raw CEK, raw KEK, private
device keys, or equivalent long-lived decrypt secrets in plaintext activation
JSON.

CLI and developer tools MAY use local JSON fixtures only for explicit
compatibility tests and local development.

## 3. Interface

Conforming runtimes SHOULD expose a storage-neutral interface:

```swift
protocol KDNASecretStore {
    func getSecret(ref: SecretRef) throws -> Data
    func putSecret(_ secret: Data, ref: SecretRef) throws
    func deleteSecret(ref: SecretRef) throws
}
```

Equivalent JS and CLI interfaces SHOULD use the same conceptual operations:

- `getSecret(ref)`
- `putSecret(secret, ref)`
- `deleteSecret(ref)`

## 4. Platform Requirements

macOS and iOS products SHOULD use Keychain or Secure Enclave-backed storage
where practical.

Enterprise runtimes MAY use managed vaults or MDM-backed secure storage.

CLI MAY use files under `~/.kdna/licenses` for non-secret metadata and local
test fixtures. Production CLI flows SHOULD avoid printing or exporting secrets.

## 5. Diagnostics

Diagnostics MAY include:

- asset ID;
- asset UID;
- issuer ID;
- redacted license ID;
- entitlement status;
- issue code.

Diagnostics MUST NOT include:

- license key;
- password;
- CEK;
- KEK;
- private device key;
- decrypted judgment content;
- raw protected payload entries.

## 6. Device Binding

Device binding SHOULD prefer a device keypair over a hardware fingerprint:

1. Generate a device keypair on first activation.
2. Store the private key in SecretStore.
3. Send only the public key to the entitlement server.
4. Prove possession by challenge-response during activation or sync.

`machine_fingerprint` MAY remain as a legacy CLI compatibility field.
