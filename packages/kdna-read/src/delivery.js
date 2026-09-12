'use strict';
const {transport,correlation,freeze}=require('./util.js');
function semanticCause(prepared){return prepared.admission_rejection?.code??prepared.envelope?.diagnostics.find(x=>x.severity==='error')?.code??prepared.control?.semantic_cause??prepared.transport_failure?.semantic_cause??null;}
async function deliverResult(prepared,requestId,deliver){
 if(!deliver||prepared.channel==='transport_failure')return freeze(prepared);
 try {if(await deliver(freeze(prepared))===true)return prepared;}catch { /* The transport result deliberately excludes the exception. */ }
 return freeze(transport(semanticCause(prepared),correlation(requestId)));
}
module.exports={semanticCause,deliverResult};
