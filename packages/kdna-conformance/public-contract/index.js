'use strict';
const path=require('node:path');
const {spawnSync}=require('node:child_process');
function runPublicContractVectors({runtime,output,sourceRoot=path.resolve(__dirname,'../../..')}){
 if(!path.isAbsolute(runtime)||!path.isAbsolute(output)||!path.isAbsolute(sourceRoot))throw new TypeError('Explicit absolute runtime, output and source root required');
 const script=path.join(sourceRoot,'scripts/public-contract/run-vectors.mjs');
 const child=spawnSync(process.execPath,[script,runtime,output],{cwd:runtime,encoding:'utf8',env:{...process.env,NODE_PATH:''}});
 return {exit_code:child.status,signal:child.signal,stdout:child.stdout,stderr:child.stderr,report:output};
}
module.exports={runPublicContractVectors};
