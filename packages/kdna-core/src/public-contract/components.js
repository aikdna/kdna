'use strict';
const {freeze,copyJson}=require('./strict-input.js');
const {getComponentSemanticsContract:getRegistry}=require('./component-semantics.js');
function getComponentSemanticsContract(){const registry=getRegistry(),d=registry.definition;return freeze(copyJson({contract_id:d.id,contract_version:d.version,definition_digest:registry.definition_digest,profiles:d.profiles,carriers:d.carriers,limits:d.limits}));}
module.exports={getComponentSemanticsContract};
