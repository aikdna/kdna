import type { KDNARuntimeCapsule } from './legacy-runtime-types';

/** A final packaged `.kdna` file path or its immutable packaged bytes. */
export type KDNARemoteRuntimeInput = string | Uint8Array;

/**
 * Load one legacy container 0.1 deployer-controlled `access: "remote"` asset for server-side
 * projection. The function always returns a full JSON Runtime Capsule and
 * accepts no caller policy options.
 */
export function loadRemoteRuntimeAsset(
  input: KDNARemoteRuntimeInput,
): KDNARuntimeCapsule;
