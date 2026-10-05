"use strict";
const {parseJson,canonicalJson,compareUtf8}=require('./strict-input.js');
const encoder=new TextEncoder(),utf8=value=>encoder.encode(value);
const {digest}=require('./digests.js');
// Exact independent original kdsig content domain, including checksums.json.
function signatureContentPreimage(entries){
 const rows=[];
 for(const name of Object.keys(entries).sort(compareUtf8)){
  if(['.DS_Store','build-receipt.json','signature.kdsig'].includes(name)||name.startsWith('reports/'))continue;
  let member=entries[name];
  if(/\.json$/i.test(name)){
   const value=parseJson(member);
   if(name==='kdna.json'){
    for(const key of ['asset_digest','container_sha256','content_digest','_source'])delete value[key];
    if(value.authoring&&typeof value.authoring==='object')delete value.authoring.content_digest;
   }
   member=utf8(canonicalJson(value));
  }
  rows.push(name+':'+digest(member).slice(7));
 }
 return utf8(rows.join('\n'));
}
module.exports={signatureContentPreimage};
