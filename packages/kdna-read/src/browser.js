'use strict';
const {admitBrowser}=require('@aikdna/kdna-core/browser');
const {inspectSnapshot,isProtectedSnapshot}=require('@aikdna/kdna-core/read-boundary');
const {runRead}=require('./pipeline.js');
function admitInput(input){
  // The existing browser API also accepts a same-Core snapshot. Reusing that
  // private identity keeps issued expansion handles bound to their admission.
  if(isProtectedSnapshot(input))return {status:'rejected',reason:'READ_CORE_CAPABILITY_UNAVAILABLE',states:{core:'not_evaluated',interpretation:'not_evaluated'}};
  return inspectSnapshot(input)?{status:'accepted',snapshot:input}:admitBrowser(input);
}
async function readBrowser(input,candidate,controlProvider,host){return runRead(admitInput,input,candidate,controlProvider,host);}
module.exports={readBrowser};
