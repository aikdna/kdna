'use strict';
// Current R2 dependency fixture: ports bind existing contracts explicitly.
function bindDependencyPorts(asset) {
  for (const dependency of asset.payload.dependencies) {
    const producer=asset.payload.judgments.find(j=>j.id===dependency.producer.judgment_ref);
    const consumer=asset.payload.judgments.find(j=>j.id===dependency.consumer_judgment_ref);
    if(!consumer.inputs.some(p=>p.name===dependency.input_role)) consumer.inputs.push({name:dependency.input_role,meaning:'Declared dependency input.',contract_ref:{kind:'contract',id:producer.result_contract.id}});
    dependency.producer_port='result'; dependency.consumer_port=dependency.input_role;
    for (const [judgment,name,contract] of [[producer,'result',producer.result_contract.id],[consumer,dependency.input_role,producer.result_contract.id]]) {
      if(!judgment.ports.some(p=>p.name===name)) judgment.ports.push({name,meaning:'Explicit regression fixture dependency port.',...(judgment===producer?{direction:'output',result_field:null}:{direction:'input',input_role:dependency.input_role}),contract_ref:{kind:'contract',id:contract}});
    }
  }
  return asset;
}
module.exports={bindDependencyPorts};
