'use strict';
// Engineering wire assembly only. The semantic views retain their paper-only
// provenance; this helper is not Studio creation, an observed event or a user act.
const path=require('node:path');
const fs=require('node:fs');
const F=require('./bytes-fixtures.cjs');
const root=path.resolve(__dirname,'../../..');
function semantic(name){return JSON.parse(fs.readFileSync(path.join(root,'specs/r2/review-fixtures',name+'.json'),'utf8'));}
function asset(tuple,name='simple'){
  const view=semantic(name);
  if(view.review_only!==true||!view.M||!view.P)throw Error('Expected engineering semantic view');
  return {
    manifest:{...view.M,format_version:tuple.container,asset_type:'fixture',compatibility:{min_loader_version:'0.36.0',profile:tuple.payload_profile,profile_version:tuple.payload_version},payload:{path:'payload.kdnab',encoding:'cbor',encrypted:false},runtime:{mandatory_entries:[]}},
    payload:{...view.P,profile:tuple.payload_profile,profile_version:tuple.payload_version}
  };
}
module.exports={...F,semantic,asset};
