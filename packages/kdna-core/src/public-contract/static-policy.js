'use strict';
const {freeze,copyJson}=require('./strict-input.js');
const {static_policy:registry}=require('./generated-contract.json');
function getStaticPolicyContract(){const d=registry.definition;return freeze(copyJson({contract_id:d.id,contract_version:d.version,definition_digest:registry.definition_digest,carrier:d.carrier}));}
module.exports={getStaticPolicyContract};
