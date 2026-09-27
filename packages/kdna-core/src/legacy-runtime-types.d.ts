/**
 * Complete type closure for the retained remote-runtime subpath.
 * These declarations describe its legacy Runtime Capsule 0.1.0 contract.
 * They do not export the old source-tree APIs from the current package root.
 */
export type KDNADigestComparisonState = 'matched' | 'mismatched' | 'not_compared' | 'unavailable';

export type KDNADigestComparisonSource =
  | 'caller'
  | 'registry'
  | 'install_receipt'
  | 'lockfile'
  | 'kdna.json.content_digest'
  | 'kdna.json.authoring.content_digest'
  | 'checksums.json.entry_set_digest';

export interface KDNADigestComparison {
  state: KDNADigestComparisonState;
  against: 'external_expected' | 'manifest_declaration' | 'checksum_declaration' | null;
  expected: string | null;
  source: KDNADigestComparisonSource | null;
}

export interface KDNADigestValue {
  value: string | null;
  basis: string;
  comparison: KDNADigestComparison;
}

export interface KDNADigestEvidence {
  profile: 'kdna.digest-evidence';
  profile_version: '0.1.0';
  asset: KDNADigestValue;
  content: KDNADigestValue;
  runtime_entry_set: KDNADigestValue;
}

export interface KDNASignatureEvidenceAbsent {
  state: 'absent';
}

export interface KDNASignatureEvidenceVerified {
  state: 'verified';
  profile: 'kdsig.ed25519';
  profile_version: '0.1.0';
  key_fingerprint: string;
  content_digest: string;
}

export type KDNASignatureEvidence =
  | KDNASignatureEvidenceAbsent
  | KDNASignatureEvidenceVerified;

export interface KDNARuntimeCapsule {
  type: 'kdna.runtime-capsule';
  contract_version: '0.1.0';
  asset: {
    asset_id: string;
    asset_uid: string;
    version: string;
    judgment_version: string;
  };
  digests: KDNADigestEvidence;
  signature: KDNASignatureEvidence;
  access: 'public' | 'licensed' | 'remote';
  profile: 'index' | 'compact' | 'scenario' | 'full';
  context: Record<string, any>;
  trace: {
    payload_encoding: 'cbor';
    loaded_by: 'kdna-core';
    loaded_at: string;
    input_kind: 'packaged_file' | 'packaged_bytes';
    runtime_eligible: true;
    schema_valid: true;
    signature_state: 'absent' | 'verified';
    profile: 'index' | 'compact' | 'scenario' | 'full';
    projection_report?: {
      status: 'complete' | 'partial';
      omitted: Array<{ path: string; count: number }>;
      omitted_total: number;
    };
  };
}

