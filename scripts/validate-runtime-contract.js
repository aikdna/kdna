#!/usr/bin/env node

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  compileSchema,
  judgmentTraceSchemas,
  publishedDependencySchemas,
  validateJudgmentTraceAuthority,
} = require('./validate-app-schemas');

const ROOT = path.resolve(__dirname, '..');
const EXAMPLE_DIR = path.join(ROOT, 'examples', 'app-runtime-contract');
const PREFIXES = ['generic-client', 'generic-authoring', 'generic-workbench'];
const SCHEMAS = {
  trace: judgmentTraceSchemas.published,
  report: 'specs/judgment-report-schema.json',
  feedback: 'schema/feedback-event.schema.json',
};
const STATUS_TO_ACTION = {
  SKIP_NO_JUDGMENT_NEEDED: 'skip',
  SKIP_NO_LOCAL_DOMAIN: 'skip',
  SKIP_WEAK_FIT: 'skip',
  REJECT_NEGATIVE_MATCH: 'skip',
  ASK_AMBIGUOUS_DOMAIN: 'ask',
  LOAD_STRONG_FIT: 'load',
  BLOCK_TRUST_FAILED: 'block',
};

function validationErrors(validate) {
  return (validate.errors || []).map((error) => `${error.instancePath || '/'} ${error.message}`);
}

function validateRuntimeContract(options = {}) {
  const exampleDir = options.exampleDir || EXAMPLE_DIR;
  const logger = options.logger || console;
  const failures = [];

  function fail(filePath, message) {
    const relativePath = path.relative(ROOT, filePath);
    failures.push(`${relativePath}: ${message}`);
    logger.error(`FAIL ${relativePath}: ${message}`);
  }

  for (const authorityError of validateJudgmentTraceAuthority()) {
    failures.push(authorityError);
    logger.error(`FAIL ${authorityError}`);
  }

  let validators;
  try {
    validators = {
      trace: compileSchema(SCHEMAS.trace, { dependencySchemas: publishedDependencySchemas }),
      report: compileSchema(SCHEMAS.report),
      feedback: compileSchema(SCHEMAS.feedback),
    };
  } catch (compileError) {
    failures.push(`authoritative Runtime schemas: unable to compile: ${compileError.message}`);
    logger.error(`FAIL authoritative Runtime schemas: unable to compile: ${compileError.message}`);
    return failures;
  }

  function readJson(filePath) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      fail(filePath, `invalid JSON: ${error.message}`);
      return null;
    }
  }

  function validateDocument(kind, filePath, document) {
    const validate = validators[kind];
    if (validate(document)) return true;
    for (const error of validationErrors(validate)) fail(filePath, error);
    return false;
  }

  function validateRouteSemantics(reportPath, feedbackPath, trace, report, feedback) {
    const route = report.route_decision || {};
    const expectedAction = STATUS_TO_ACTION[route.status];
    if (!expectedAction) {
      fail(reportPath, `unknown route status: ${route.status}`);
    } else if (route.action !== expectedAction) {
      fail(reportPath, `route action ${route.action} does not match status ${route.status}`);
    }

    if (report.trace_id !== trace.trace_id) {
      fail(reportPath, `trace_id ${report.trace_id} does not match trace ${trace.trace_id}`);
    }
    if (feedback.trace_id !== trace.trace_id) {
      fail(feedbackPath, `trace_id ${feedback.trace_id} does not match trace ${trace.trace_id}`);
    }

    const asset = trace.asset_identity || {};
    if (feedback.domain_id !== asset.asset_id) {
      fail(
        feedbackPath,
        `domain_id ${feedback.domain_id} does not match trace asset ${asset.asset_id}`,
      );
    }
    if (feedback.domain_version !== asset.version) {
      fail(
        feedbackPath,
        `domain_version ${feedback.domain_version} does not match trace asset version ${asset.version}`,
      );
    }

    const loadedDomains = Array.isArray(report.loaded_domains) ? report.loaded_domains : [];
    if (route.action === 'load') {
      if (route.selected_domain !== asset.asset_id) {
        fail(
          reportPath,
          `selected_domain ${route.selected_domain} does not match trace asset ${asset.asset_id}`,
        );
      }
      if (loadedDomains.length !== 1) {
        fail(reportPath, `a single-asset load route requires exactly one loaded domain`);
      } else {
        const loaded = loadedDomains[0];
        const expectedObservedFields = {
          name: asset.asset_id,
          version: asset.version,
          judgment_version: asset.judgment_version,
          access: asset.access,
          status: trace.capsule_delivery_evidence?.host_boundary_comparison,
        };
        for (const [field, expected] of Object.entries(expectedObservedFields)) {
          if (loaded[field] !== expected) {
            fail(
              reportPath,
              `loaded_domains[0].${field} ${loaded[field]} does not match trace evidence ${expected}`,
            );
          }
        }
        for (const field of ['quality_badge', 'risk_level', 'source']) {
          if (loaded[field] != null) {
            fail(reportPath, `loaded_domains[0].${field} must remain null when not observed`);
          }
        }
      }
    } else {
      if (route.selected_domain !== null) {
        fail(reportPath, `${route.action} route must set selected_domain to null`);
      }
      if (loadedDomains.length !== 0) {
        fail(reportPath, `${route.action} route must not report loaded domains`);
      }
    }
  }

  for (const prefix of PREFIXES) {
    const failuresBeforePrefix = failures.length;
    const paths = {
      trace: path.join(exampleDir, `${prefix}-trace.json`),
      report: path.join(exampleDir, `${prefix}-report.json`),
      feedback: path.join(exampleDir, `${prefix}-feedback.json`),
    };
    const documents = {};
    let documentsValid = true;

    for (const kind of Object.keys(paths)) {
      if (!fs.existsSync(paths[kind])) {
        fail(paths[kind], `missing ${kind} example`);
        documentsValid = false;
        continue;
      }
      documents[kind] = readJson(paths[kind]);
      if (!documents[kind] || !validateDocument(kind, paths[kind], documents[kind])) {
        documentsValid = false;
      }
    }

    if (documentsValid) {
      validateRouteSemantics(
        paths.report,
        paths.feedback,
        documents.trace,
        documents.report,
        documents.feedback,
      );
    }
    if (failures.length === failuresBeforePrefix) {
      logger.log(`OK ${prefix} trace/report/feedback contract`);
    }
  }

  return failures;
}

function main() {
  const failures = validateRuntimeContract();
  if (failures.length > 0) {
    console.error(`\nRuntime contract validation failed: ${failures.length} issue(s)`);
    process.exitCode = 1;
    return;
  }
  console.log('\nRuntime contract validation passed');
}

if (require.main === module) main();

module.exports = {
  PREFIXES,
  SCHEMAS,
  STATUS_TO_ACTION,
  validateRuntimeContract,
};
