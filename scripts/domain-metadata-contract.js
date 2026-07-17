#!/usr/bin/env node

'use strict';

/**
 * Historical entry point retained to fail closed for callers of the retired
 * registry metadata contract. The former script required intrinsic
 * quality_badge and risk_level fields, mandatory Human Lock-era authorship,
 * and signature-based promotion. Those rules are not KDNA Core authority.
 *
 * Current Runtime manifest authority:
 *   node scripts/validate-protocol-fixtures.js
 *
 * External catalogs and evaluators must define their own issuer-scoped schema
 * and must not write quality, risk, trust, recommendation, certification, or
 * production-readiness conclusions into the Core Runtime manifest.
 */

console.error(
  'domain-metadata-contract is retired; use scripts/validate-protocol-fixtures.js for Core Runtime manifest conformance',
);
process.exitCode = 2;
