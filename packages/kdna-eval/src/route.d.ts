import type {
  DomainResolution,
  ResolveDomainsOptions,
  RoutePolicy,
} from "./types.js";

export type {
  DomainResolution,
  ResolvedDomain,
  ResolveDomainsOptions,
  RouteDomainOverride,
  RoutePolicy,
} from "./types.js";

export declare function getRoutePolicy(
  operation: string,
  policies?: Record<string, RoutePolicy> | null,
): RoutePolicy;
export declare function resolveDomains(
  operation: string,
  options?: ResolveDomainsOptions,
): DomainResolution;
