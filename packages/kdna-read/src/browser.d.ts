// Generated from specs/public-semantic-source.json; do not edit.
import type { ReadCallResult, CanonicalReadSnapshot, TrustedReadControlProvider, TrustedHostReadProvider } from '@aikdna/kdna-core';
export declare function readBrowser(input: ArrayBuffer | Uint8Array | CanonicalReadSnapshot, candidate: unknown, controlProvider: TrustedReadControlProvider, host: TrustedHostReadProvider): Promise<ReadCallResult>;
