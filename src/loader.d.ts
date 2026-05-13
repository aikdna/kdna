import type {
  KDNACore,
  KDNAPatterns,
  KDNAScenarios,
  KDNACases,
  KDNAReasoning,
  KDNAEvolution,
} from './types';

export interface LoadedDomain {
  core: KDNACore;
  patterns: KDNAPatterns;
  scenarios?: KDNAScenarios;
  cases?: KDNACases;
  reasoning?: KDNAReasoning;
  evolution?: KDNAEvolution;
}

export interface LoadOptions {
  input?: string;
  mode?: 'all' | 'minimum' | 'auto';
}

export function loadCorePatterns(
  domainDir: string,
): { core: KDNACore; patterns: KDNAPatterns } | null;
export function classifyInput(text: string): string[];
export function loadDomain(domainDir: string, options?: LoadOptions): LoadedDomain | null;
export function formatContext(domain: LoadedDomain): string;
