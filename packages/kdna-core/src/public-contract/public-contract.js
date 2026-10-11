'use strict';
// Read-only view over the public contract this installation ships. No contract
// data lives in this file: every readout is derived from the generated contract
// at call time, so a consumer checks against the contract it actually installed.
const generated = require('./generated-contract.json');
const KINDS = Object.freeze(['manifest', 'payload', 'judgment', 'methodComponent', 'catalogItem']);
const TYPE_FOR_KIND = Object.freeze({
  manifest: 'Manifest',
  payload: 'Payload',
  judgment: 'Judgment',
  methodComponent: 'MethodComponent',
  catalogItem: 'CatalogItem',
});
function keysFor(view, kind, which) {
  const name = TYPE_FOR_KIND[kind];
  if (!name) throw new Error('KDNA_CONTRACT_VIEW_UNKNOWN_KIND');
  const type = view && view.types ? view.types[name] : undefined;
  if (!type) throw new Error('KDNA_CONTRACT_VIEW_TYPE_MISSING');
  const required = Array.isArray(type.required) ? [...type.required] : [];
  if (which === 'required') return required;
  return Object.keys(type.properties ?? {}).filter((key) => !required.includes(key));
}
function buildContractView(view) {
  if (!view || typeof view !== 'object') throw new Error('KDNA_CONTRACT_VIEW_INPUT_INVALID');
  return Object.freeze({
    kinds: KINDS,
    contractCoordinate: () => structuredClone(view.versionTuple ?? {}),
    requiredKeys: (kind) => keysFor(view, kind, 'required'),
    optionalKeys: (kind) => keysFor(view, kind, 'optional'),
  });
}
module.exports = Object.freeze({ buildContractView, ...buildContractView(generated) });
