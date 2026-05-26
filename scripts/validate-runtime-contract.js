#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXAMPLE_DIR = path.join(ROOT, 'examples', 'app-runtime-contract');
const STATUS_TO_ACTION = {
  SKIP_NO_JUDGMENT_NEEDED: 'skip',
  SKIP_NO_LOCAL_DOMAIN: 'skip',
  SKIP_WEAK_FIT: 'skip',
  REJECT_NEGATIVE_MATCH: 'skip',
  ASK_AMBIGUOUS_DOMAIN: 'ask',
  LOAD_STRONG_FIT: 'load',
  BLOCK_TRUST_FAILED: 'block',
};

let failures = 0;

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(filePath, `invalid JSON: ${error.message}`);
    return null;
  }
}

function fail(filePath, message) {
  failures += 1;
  console.error(`FAIL ${path.relative(ROOT, filePath)}: ${message}`);
}

function ok(message) {
  console.log(`OK ${message}`);
}

function requireString(filePath, object, key) {
  if (typeof object[key] !== 'string' || object[key].trim() === '') {
    fail(filePath, `missing non-empty string: ${key}`);
  }
}

function requireArray(filePath, object, key) {
  if (!Array.isArray(object[key])) {
    fail(filePath, `missing array: ${key}`);
  }
}

function validateRoute(filePath, route) {
  if (!route || typeof route !== 'object') {
    fail(filePath, 'missing route decision object');
    return;
  }

  requireString(filePath, route, 'status');
  requireString(filePath, route, 'action');

  const expectedAction = STATUS_TO_ACTION[route.status];
  if (!expectedAction) {
    fail(filePath, `unknown route status: ${route.status}`);
  } else if (route.action !== expectedAction) {
    fail(filePath, `route action ${route.action} does not match status ${route.status}`);
  }

  if (route.action === 'load' && typeof route.selected_domain !== 'string') {
    fail(filePath, 'load action requires selected_domain');
  }
}

function validateTrace(filePath, trace) {
  requireString(filePath, trace, 'trace_version');
  requireString(filePath, trace, 'trace_id');
  requireString(filePath, trace, 'timestamp');

  if (!trace.loaded_package || typeof trace.loaded_package !== 'object') {
    fail(filePath, 'missing loaded_package');
  } else {
    requireString(filePath, trace.loaded_package, 'domain');
    requireString(filePath, trace.loaded_package, 'version');
  }

  if (!trace.generated_judgment || typeof trace.generated_judgment !== 'object') {
    fail(filePath, 'missing generated_judgment');
  } else {
    requireString(filePath, trace.generated_judgment, 'classification');
  }

  validateRoute(filePath, trace.route_result);
}

function validateReport(filePath, report) {
  for (const key of ['report_version', 'report_id', 'created_at']) {
    requireString(filePath, report, key);
  }

  if (!report.task || typeof report.task !== 'object') {
    fail(filePath, 'missing task');
  } else {
    requireString(filePath, report.task, 'summary');
  }

  validateRoute(filePath, report.route_decision);

  requireArray(filePath, report, 'loaded_domains');
  requireArray(filePath, report, 'self_checks');
  requireArray(filePath, report, 'limits');

  if (!report.triggered_judgment || !Array.isArray(report.triggered_judgment.items)) {
    fail(filePath, 'missing triggered_judgment.items array');
  }

  if (!report.final_judgment || typeof report.final_judgment !== 'object') {
    fail(filePath, 'missing final_judgment');
  } else {
    requireString(filePath, report.final_judgment, 'verdict');
    requireString(filePath, report.final_judgment, 'summary');
  }
}

function validatePair(prefix, tracePath, reportPath) {
  const trace = readJson(tracePath);
  const report = readJson(reportPath);
  if (!trace || !report) return;

  validateTrace(tracePath, trace);
  validateReport(reportPath, report);

  if (report.trace_id !== trace.trace_id) {
    fail(reportPath, `trace_id ${report.trace_id} does not match trace ${trace.trace_id}`);
  }

  const traceDomain = trace.loaded_package && trace.loaded_package.domain;
  const reportDomains = Array.isArray(report.loaded_domains)
    ? report.loaded_domains.map((domain) => domain.name)
    : [];

  if (traceDomain && !reportDomains.includes(traceDomain)) {
    fail(reportPath, `loaded_domains does not include trace domain ${traceDomain}`);
  }

  const traceRoute = trace.route_result || {};
  const reportRoute = report.route_decision || {};
  if (traceRoute.status !== reportRoute.status || traceRoute.action !== reportRoute.action) {
    fail(reportPath, 'route_decision does not match trace route_result');
  }

  if (traceRoute.selected_domain !== reportRoute.selected_domain) {
    fail(reportPath, 'selected_domain does not match trace route_result');
  }

  ok(`${prefix} trace/report pair`);
}

function main() {
  for (const schema of [
    'specs/route-result.schema.json',
    'specs/judgment-trace-schema.json',
    'specs/judgment-report-schema.json',
  ]) {
    readJson(path.join(ROOT, schema));
  }

  for (const prefix of ['kdnachat', 'kdnastudio', 'kdnawork']) {
    const tracePath = path.join(EXAMPLE_DIR, `${prefix}-trace.json`);
    const reportPath = path.join(EXAMPLE_DIR, `${prefix}-report.json`);

    if (!fs.existsSync(tracePath)) fail(tracePath, 'missing trace example');
    if (!fs.existsSync(reportPath)) fail(reportPath, 'missing report example');
    if (fs.existsSync(tracePath) && fs.existsSync(reportPath)) {
      validatePair(prefix, tracePath, reportPath);
    }
  }

  if (failures > 0) {
    console.error(`\nRuntime contract validation failed: ${failures} issue(s)`);
    process.exit(1);
  }

  console.log('\nRuntime contract validation passed');
}

main();
