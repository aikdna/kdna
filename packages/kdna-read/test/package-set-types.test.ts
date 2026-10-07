// Strict Node16/NodeNext consumption of both new public subpaths.
//
// This file is a type-level acceptance, not a runtime test: it must compile with
// `--strict` and the negative cases must produce exactly the errors they expect.
// It is checked in the default test command with the root's pinned TypeScript.
import type {
  AdmittedPackageSet,
  AdmittedPackageSetView,
  PackageSetAdmissionResult,
  PackageSetDecision,
  PackageSetHandoffResult,
  PackageSetLocalFailure,
  PackageSetMemberSource,
  PackageSetNodeDescriptor,
  PackageSetOperation,
  PackageSetRecheckResult,
  PackageSetStructureResult,
  TrustedPackageSetMemberProvider,
} from '@aikdna/kdna-core/package-set-node';
import type {
  DeliveredPackageRead,
  PackageReadContract,
  PackageSetReadResult,
  TrustedPackageReadProvider,
} from '@aikdna/kdna-read/package-set-node';
import type { PackageSetHandoff } from '@aikdna/kdna-core';

declare const memberProvider: TrustedPackageSetMemberProvider;
declare const readProvider: TrustedPackageReadProvider;
declare const admission: AdmittedPackageSet;
declare const view: AdmittedPackageSetView;
declare const token: DeliveredPackageRead;
declare const handoff: PackageSetHandoff;
declare const control: unknown;
declare const plan: unknown;

// Operation and local-failure names are closed literal unions.
const operations: PackageSetOperation[] = ['isolated_read', 'semantic_merge', 'cross_asset_reference'];
const failures: PackageSetLocalFailure[] = [
  'invalid_limits',
  'member_limit_exceeded',
  'source_bytes_limit_exceeded',
  'invalid_member_source',
  'invalid_read_request',
  'provider_invalid',
  'provider_failed',
  'provider_observation_invalid',
  'cancelled',
  'core_unavailable',
  'delivery_unconfirmed',
  'handoff_invalid',
];

// @ts-expect-error an unwireable operation name is not assignable
const badOperation: PackageSetOperation = 'merge';
// @ts-expect-error a wire diagnostic is not a local failure
const badFailure: PackageSetLocalFailure = 'SET_MEMBER_UNAUTHORIZED';

// The descriptor publishes the exact limits and callable counts.
const descriptor: PackageSetNodeDescriptor = {
  contract: 'kdna.package-set-node/0.2.1',
  module_version: '0.2.0',
  core_version: '0.37.1-rc.browser.1',
  read_version: '0.11.2-rc.browser.1',
  limits: { maxMembers: 10000, maxTotalSourceBytes: 104857600 },
  local_failures: failures,
  core_callables: [
    'getPackageSetContract',
    'validatePackageSetStructure',
    'createTrustedPackageSetMemberProvider',
    'admitPackageSetNode',
    'recheckPackageSet',
    'inspectAdmittedPackageSet',
    'verifyPackageSetHandoff',
  ],
  read_callables: [
    'getPackageReadContract',
    'createTrustedPackageReadProvider',
    'readPackageSetNode',
    'sealPackageSetHandoff',
    'admitPackageSetHandoff',
  ],
  claims: 'claims_not_authenticated',
  definition_digest: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
};
// @ts-expect-error the declared member limit is a literal, not a free number
descriptor.limits = { maxMembers: 1, maxTotalSourceBytes: 1 };

// Member bytes are an intrinsic view, never a path or a JSON snapshot.
const source: PackageSetMemberSource = { member_id: 'member:one', bytes: new Uint8Array(4) };

// @ts-expect-error member bytes are not a filesystem path
const badSource: PackageSetMemberSource = { member_id: 'member:one', bytes: 'file.kdna' };

// The results are discriminated unions with a fixed proof string.
const structure: PackageSetStructureResult = { status: 'valid', value: {} as never, proof: 'claims_not_authenticated' };
const admissionResult: PackageSetAdmissionResult = { status: 'admitted', admission, decision: { status: 'allowed', selected_member: 'member:one', merged_ir: false, action_authorized: false }, local_failure: null };
const decision: PackageSetDecision = { status: 'rejected', diagnostic: 'READ_CORE_INVALID', merged_ir: false, action_authorized: false };
const recheck: PackageSetRecheckResult = { status: 'rejected', decision, local_failure: null };
const readResult: PackageSetReadResult = { decision, readResult: null, delivered: token, local_failure: null, sink_invoked: true, sink_confirmed: true, registered_handles: 1, registered_handle_ids: ['handle:one'], handle_registration: 'registered', host_closed: false, member_observations: 1, reader_observations: 2 };
// A withheld token and a registered handle are two different fields, never one 0.
const withheldWithHandles: PackageSetReadResult = { ...readResult, delivered: null, registered_handles: 1, registered_handle_ids: ['handle:one'], handle_registration: 'registered', host_closed: true };
// @ts-expect-error the handle ledger is a list of identities, not a count
const badLedger: PackageSetReadResult = { ...readResult, registered_handle_ids: 1 };
// @ts-expect-error the registration flag is a closed literal union
const badFlag: PackageSetReadResult = { ...readResult, handle_registration: 'maybe' };
const readContract: PackageReadContract = {} as PackageReadContract;
const handoffResult: PackageSetHandoffResult = { status: 'valid', value: handoff, proof: 'claims_not_authenticated' };

// @ts-expect-error a handoff cannot claim authentication
const authenticated: PackageSetHandoffResult = { status: 'valid', value: handoff, proof: 'authenticated' };

// The public functions exist with the documented shapes.
import * as core from '@aikdna/kdna-core/package-set-node';
import * as read from '@aikdna/kdna-read/package-set-node';
const coreContract: PackageSetNodeDescriptor = core.getPackageSetContract();
const rechecked: PackageSetRecheckResult = core.recheckPackageSet(admission, 'read');
const inspected: AdmittedPackageSetView | null = core.inspectAdmittedPackageSet(admission);
const requested: Promise<PackageSetAdmissionResult> = core.admitPackageSetNode({ set: {}, tuple: {}, members: [source], operation: 'isolated_read', limits: { maxMembers: 10000, maxTotalSourceBytes: 104857600 } }, memberProvider);
const readContractValue: PackageReadContract = read.getPackageReadContract();
const readOutcome: Promise<PackageSetReadResult> = read.readPackageSetNode({ set: {}, tuple: {}, members: [source], operation: 'isolated_read', limits: { maxMembers: 10000, maxTotalSourceBytes: 104857600 }, request: {} }, control, readProvider);
const sealed: PackageSetHandoffResult = read.sealPackageSetHandoff(token, plan);
const admittedHandoff: PackageSetHandoffResult = read.admitPackageSetHandoff(handoff, token, plan);

// @ts-expect-error a phase other than read|handoff is refused by the type
core.recheckPackageSet(admission, 'seal');

export const surface = { operations, descriptor, source, structure, admissionResult, decision, recheck, readResult, withheldWithHandles, readContract, handoffResult, coreContract, rechecked, inspected, requested, readContractValue, readOutcome, sealed, admittedHandoff, view };

// @ts-expect-error historical contract is not the current descriptor
const oldContract: PackageSetNodeDescriptor['contract'] = 'kdna.package-set-node/0.1.0';
// @ts-expect-error historical Core does not satisfy the R2 binding
const oldCore: PackageSetNodeDescriptor['core_version'] = '0.35.0-rc.source.1';
// @ts-expect-error historical Read does not satisfy the R2 binding
const oldRead: PackageSetNodeDescriptor['read_version'] = '0.10.0-rc.source.1';
