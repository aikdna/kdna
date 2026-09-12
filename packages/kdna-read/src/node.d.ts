// Generated from specs/public-semantic-source.json; do not edit.
import type { ReadCallResult, TrustedReadControlProvider, TrustedHostReadProvider } from '@aikdna/kdna-core';
export declare function readNode(input: string | Uint8Array, candidate: unknown, controlProvider: TrustedReadControlProvider, host: TrustedHostReadProvider): Promise<ReadCallResult>;
