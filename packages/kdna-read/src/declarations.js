'use strict';
const {clone}=require('./util.js');
function projectDeclarations(declarations,missingFields=[],unrequestedNodes=[]){
 return {declarations:clone(declarations),missing:missingFields.map(field=>({state:'observed_missing',field})),omissions:unrequestedNodes.map(target=>({state:'explicitly_omitted',target,field:null,reason:'not_requested',expandable:false,handle_id:null}))};
}
module.exports={projectDeclarations};
