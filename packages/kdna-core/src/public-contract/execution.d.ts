// Generated from specs/public-semantic-source.json; do not edit.
import type { CanonicalReadSnapshot, PublicConsumptionPlan, PublicRuntimeCapsule, PublicAgentHostRequest, PublicAgentHostReceipt, PublicJudgmentTrace, PublicExecutionBudget, PublicExecutionIntent, PublicExecutionFailure, Selection, Digest, Identifier } from './types';
export type { PublicConsumptionPlan, PublicRuntimeCapsule, PublicAgentHostRequest, PublicAgentHostReceipt, PublicJudgmentTrace } from './types';
declare const planAdmission: unique symbol, capsuleAdmission: unique symbol, requestAdmission: unique symbol;
export interface AdmittedConsumptionPlan { readonly [planAdmission]: true }
export interface AdmittedRuntimeCapsule { readonly [capsuleAdmission]: true }
export interface AdmittedAgentHostRequest { readonly [requestAdmission]: true }
export type ExecutionRejection = { readonly status: 'rejected'; readonly code: PublicExecutionFailure; readonly body: null; readonly body_bytes: 0 };
export type ExecutionValidation<T> = { readonly status: 'valid'; readonly value: T; readonly proof: 'claims_not_authenticated' } | ExecutionRejection;
export type ExecutionWireType = 'PublicRuntimeCapsule' | 'PublicConsumptionPlan' | 'PublicAgentHostRequest' | 'PublicAgentHostReceipt' | 'PublicJudgmentTrace';
export function parseExecutionJson(input: string | Uint8Array): ExecutionValidation<unknown>;
export function validateExecutionStructure(type: ExecutionWireType, input: unknown): ExecutionValidation<unknown>;
export function executionDigest(input: unknown): { readonly status: 'valid'; readonly digest: Digest; readonly proof: 'claims_not_authenticated' } | ExecutionRejection;
export function createConsumptionPlan(snapshot: CanonicalReadSnapshot, options: { readonly plan_id: Identifier; readonly intent: PublicExecutionIntent; readonly selection: Selection; readonly budget: PublicExecutionBudget }): { readonly status: 'admitted'; readonly plan: AdmittedConsumptionPlan } | ExecutionRejection;
export function admitConsumptionPlan(input: unknown, snapshot: CanonicalReadSnapshot): { readonly status: 'admitted'; readonly plan: AdmittedConsumptionPlan } | ExecutionRejection;
export function inspectAdmittedPlan(plan: unknown): PublicConsumptionPlan | null;
export function createRuntimeCapsule(snapshot: CanonicalReadSnapshot, plan: AdmittedConsumptionPlan): { readonly status: 'admitted'; readonly capsule: AdmittedRuntimeCapsule } | ExecutionRejection;
export function admitRuntimeCapsule(input: unknown, snapshot: CanonicalReadSnapshot, plan: AdmittedConsumptionPlan): { readonly status: 'admitted'; readonly capsule: AdmittedRuntimeCapsule } | ExecutionRejection;
export function inspectRuntimeCapsule(capsule: unknown): PublicRuntimeCapsule | null;
export function createAgentHostRequest(plan: AdmittedConsumptionPlan, capsule: AdmittedRuntimeCapsule, options: { readonly request_id: Identifier; readonly run_id: Identifier; readonly host_id: Identifier; readonly host_epoch: Identifier }): { readonly status: 'admitted'; readonly request: AdmittedAgentHostRequest } | ExecutionRejection;
export function admitAgentHostRequest(input: unknown, plan: AdmittedConsumptionPlan, capsule: AdmittedRuntimeCapsule): { readonly status: 'admitted'; readonly request: AdmittedAgentHostRequest } | ExecutionRejection;
export function inspectAgentHostRequest(request: unknown): PublicAgentHostRequest | null;
export function validateAgentHostReceipt(input: unknown, request: AdmittedAgentHostRequest): ExecutionValidation<PublicAgentHostReceipt>;
export function validateJudgmentTrace(input: unknown, request: AdmittedAgentHostRequest, receipt: PublicAgentHostReceipt): ExecutionValidation<PublicJudgmentTrace>;
export type ExecutionResponseBody = { readonly receipt: PublicAgentHostReceipt; readonly trace: PublicJudgmentTrace; readonly output: string | null };
export function validateExecutionResponse(input: unknown, request: AdmittedAgentHostRequest): ({ readonly status: 'valid'; readonly value: ExecutionResponseBody; readonly proof: 'claims_not_authenticated'; readonly body_bytes: number }) | ExecutionRejection;
export type ExecutionRequestObservation = { readonly request: PublicAgentHostRequest; readonly request_digest: Digest };
export type ExecutionAuthorizationObservation = { readonly decision: 'allow' | 'deny'; readonly authorization_id: Identifier; readonly request_digest: Digest; readonly host_id: Identifier; readonly host_epoch: Identifier; readonly issued_at: number; readonly expires_at: number };
export type ExecutionDeliveryObservation = { readonly delivery_id: Identifier; readonly request_digest: Digest; readonly producer_digest: Digest; readonly delivery_digest: Digest };
export type ExecutionOutcomeObservation = { readonly observation_id: Identifier; readonly status: 'completed'; readonly output: string } | { readonly observation_id: Identifier; readonly status: 'failed'; readonly output: null };
export type ExecutionHostResult = { readonly status: 'completed' | 'denied' | 'failed'; readonly body: ExecutionResponseBody; readonly body_bytes: number; readonly output_delivery: 'not_confirmed' } | ExecutionRejection;
export function createExecutionHost(configuration: { readonly host_id: Identifier; readonly host_epoch: Identifier; readonly clock: () => number; readonly authorize: (observation: ExecutionRequestObservation & { readonly phase: 'execution' | 'output' }) => ExecutionAuthorizationObservation; readonly observeDelivery: (observation: ExecutionRequestObservation) => ExecutionDeliveryObservation; readonly observeOutcome: (observation: { readonly request: PublicAgentHostRequest; readonly plan: PublicConsumptionPlan; readonly capsule: PublicRuntimeCapsule }) => ExecutionOutcomeObservation }): { readonly status: 'ready'; readonly host: { readonly consume: (request: AdmittedAgentHostRequest) => ExecutionHostResult } } | ExecutionRejection;
