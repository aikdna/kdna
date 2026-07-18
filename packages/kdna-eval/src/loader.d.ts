import type {
  KdnaDomainData,
  LoaderOptions,
  LoadDomainsResult,
  LoadPersonaOptions,
  Persona,
} from "./types.js";

export type {
  KdnaDomainData,
  LoaderOptions,
  LoadDomainsResult,
  LoadPersonaOptions,
  Persona,
} from "./types.js";

export declare const KDNA_DIR: string;
export declare function listDomains(kdnaDir?: string | null): Promise<string[]>;
export declare function loadFlatDomainFromFile(
  fileName: string,
  kdnaDir?: string | null,
  defaults?: Record<string, KdnaDomainData>,
): Promise<KdnaDomainData>;
export declare const loadDomainFromFile: typeof loadFlatDomainFromFile;
export declare function loadFlatDomainFromData(
  data: string | KdnaDomainData,
  fileName?: string,
): KdnaDomainData;
export declare const loadDomainFromData: typeof loadFlatDomainFromData;
export declare function loadFlatDomains(
  domainNames: readonly string[],
  options?: LoaderOptions,
): Promise<LoadDomainsResult>;
export declare const loadDomains: typeof loadFlatDomains;
export declare function listPersonas(
  kdnaDir?: string | null,
  defaults?: Record<string, Persona>,
): Promise<string[]>;
export declare function loadPersona(
  personaId: string,
  options?: LoadPersonaOptions,
): Promise<Persona>;
export declare function validateDomain(data: unknown, fileName?: string): KdnaDomainData;
export declare function validatePersona(data: unknown): Persona;
