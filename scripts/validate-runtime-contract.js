#!/usr/bin/env node

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { compileSchema } = require('./validate-app-schemas');

const ROOT = path.resolve(__dirname, '..');
const EXAMPLE_DIR = path.join(ROOT, 'examples', 'app-runtime-contract');
const PREFIXES = ['generic-client', 'generic-authoring', 'generic-workbench'];
const SCHEMAS = {
  trace: 'schema/judgment-trace.schema.json',
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
  const validators = {
    trace: compileSchema(SCHEMAS.trace),
    report: compileSchema(SCHEMAS.report),
    feedback: compileSchema(SCHEMAS.feedback),
  };

  function fail(filePath, message) {
    const relativePath = path.relative(ROOT, filePath);
    failures.push(`${relativePath}: ${message}`);
    logger.error(`FAIL ${relativePath}: ${message}`);
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

  function validateRouteSemantics(tracePath, reportPath, feedbackPath, trace, report, feedback) {
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

    const loadedDomains = Array.isArray(report.loaded_domains) ? report.loaded_domains : [];
    if (route.action === 'load') {
      if (trace.overall_status === 'blocked') {
        fail(tracePath, 'a load route cannot link to a blocked JudgmentTrace');
      }
      if (trace.runtime_contract?.negotiation_state !== 'selected') {
        fail(tracePath, 'a load route requires selected Runtime negotiation');
      }
      if (route.selected_domain !== asset.asset_id) {
        fail(
          reportPath,
          `selected_domain ${route.selected_domain} does not match trace asset ${asset.asset_id}`,
        );
      }
      if (
        !loadedDomains.some(
          (domain) => domain.name === asset.asset_id && domain.version === asset.version,
        )
      ) {
        fail(
          reportPath,
          `loaded_domains does not include trace asset ${asset.asset_id}@${asset.version}`,
        );
      }
    }

    if (route.action === 'block') {
      if (trace.overall_status !== 'blocked') {
        fail(tracePath, 'a block route requires a blocked JudgmentTrace');
      }
      if (route.selected_domain != null) {
        fail(reportPath, 'a block route must not select a domain');
      }
      if (loadedDomains.length !== 0) {
        fail(reportPath, 'a block route must not report loaded domains');
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
        paths.trace,
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
