'use strict';
const {freeze,copyJson}=require('./strict-input.js');
const {getComponentSemanticsContract:getRegistry}=require('./component-semantics.js');
const {r2_semantics}=require('./generated-contract.json');
function getComponentSemanticsContract(){const registry=getRegistry(),d=registry.definition;return freeze(copyJson({contract_id:d.id,contract_version:d.version,definition_digest:registry.definition_digest,profiles:d.profiles,carriers:d.carriers,limits:d.limits}));}
function getNativeMethodRequirements(){const registry=getRegistry();return freeze(copyJson({definition_digest:registry.definition_digest,requirements:registry.definition.native_method_requirements}));}
// Read-only authoring aid: the current per-term method-role vocabulary exactly
// as the semantic registry checks it. It answers "what does term X require"
// without duplicating any admission decision.
function getMethodRoleTable(){return freeze(copyJson({contract_id:r2_semantics.id,roles:r2_semantics.method_roles}));}
module.exports={getComponentSemanticsContract,getNativeMethodRequirements,getMethodRoleTable};
