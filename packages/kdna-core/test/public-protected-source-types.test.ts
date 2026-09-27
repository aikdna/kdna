// B3 strict type expectations for the independent protected-source subpath.
import {
  getProtectedSourceContract,
  createTrustedProtectedSourceHost,
  withProtectedSourceNode,
  commitProtectedSourceTransport,
  previewProtectedSourceRevision,
  produceProtectedSourceRevision,
} from '@aikdna/kdna-core/protected-source-node';
import type {
  ProtectedSourceRuntimeDescriptor,
  ProtectedSourceHostCallbacks,
  TrustedProtectedSourceHost,
  ProtectedSourceObservation,
  ProtectedSourceRevisionContext,
  ProtectedSourcePreparedDelivery,
  ProtectedSourcePolicy,
  ProtectedSourceRevisionResult,
  ProtectedSourceHostObservation,
} from '@aikdna/kdna-core/protected-source-node';

const descriptor: ProtectedSourceRuntimeDescriptor = getProtectedSourceContract();
const version: string = descriptor.implementation.version;
const callables: ReadonlyArray<string> = descriptor.callables;

declare const callbacks: ProtectedSourceHostCallbacks;
const host: TrustedProtectedSourceHost = createTrustedProtectedSourceHost(callbacks);
declare const revisionContext: ProtectedSourceRevisionContext;
declare const prepared: ProtectedSourcePreparedDelivery;
declare const policy: ProtectedSourcePolicy;

const opened: Promise<ProtectedSourceObservation> = withProtectedSourceNode(
  new Uint8Array(),
  { admission: { credential: { kind: 'none' }, signaturePolicy: { requireSignature: false, expectedPublicKeyHex: null } }, expected_A: 'sha256:' + 'a'.repeat(64), timeout_ms: 250 },
  { kind: 'local', clock: () => 0 },
  host,
);
const previewed = previewProtectedSourceRevision(revisionContext, { payload: {} }, policy);
const produced: Promise<ProtectedSourceRevisionResult> = produceProtectedSourceRevision(
  revisionContext,
  {},
  policy,
  (request) => ({ passwords: [{ slot: request.kind, password: new Uint8Array() }] }),
);

void opened.then((value) => {
  if (value.status === 'source_delivered') {
    const identity: { readonly A: string } = value.source_identity;
    const body: null = value.body;
    void identity;
    void body;
    // @ts-expect-error the delivered arm carries no source, context or payload text
    value.source;
    // @ts-expect-error the delivered arm is body-free
    value.bytes;
  }
});
void previewed.then((value) => {
  if (value.status === 'preview_valid') {
    const digest: string = value.validation.edits_digest;
    void digest;
    // @ts-expect-error a preview is a semantic observation, never a snapshot
    value.validation.snapshot_id;
    // @ts-expect-error a preview carries no ciphertext
    value.bytes;
  }
});
void produced.then((value) => {
  if (value.status === 'revision_produced') {
    const bytes: Uint8Array = value.bytes;
    const delivery: 'not_published' | 'trusted_host' = value.evidence.output_delivery;
    void bytes;
    void delivery;
  } else {
    // @ts-expect-error a rejected revision carries no ciphertext
    value.bytes;
  }
});
void commitProtectedSourceTransport(prepared, {
  observeScope: () => ({ context_id: 'x', epoch: 'y', asset_digest: 'z', permission: 'allowed', scope: 'complete_source', current_ms: 1, expires_at_ms: 2, revoked: false }) satisfies ProtectedSourceHostObservation,
  commit: () => true,
});

// @ts-expect-error the module is independent: the old protection callables are not re-exported
getProtectedSourceContract().admitProtectedNode;
// @ts-expect-error a caller cannot hand in a source bundle as authority
previewProtectedSourceRevision(revisionContext, { bundle: {} }, policy);
// @ts-expect-error complete_source is the only accepted scope
const wrongScope: ProtectedSourceHostObservation = { context_id: 'x', epoch: 'y', asset_digest: 'z', permission: 'allowed', scope: 'projection', current_ms: 1, expires_at_ms: 2, revoked: false };

void version;
void callables;
void wrongScope;
