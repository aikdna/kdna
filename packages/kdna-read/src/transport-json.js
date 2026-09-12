'use strict';
const {limits}=require('./transport-contract.json');
const {scalar,jcs}=require('./util.js');
const encoder=new TextEncoder();
// This scanner owns wire JSON syntax and bounds only, not asset or IR semantics.
function parseTransportJSON(text,canonical=false){
  let i=0,values=0;
  const invalid=()=>{throw Error('READ_TRANSPORT_JSON_INVALID');};
  const limit=()=>{throw Error('READ_TRANSPORT_LIMIT_EXCEEDED');};
  function space(){while(i<text.length&&' \t\n\r'.includes(text[i]))i++;}
  function string(){
    const start=i++;let escaped=false;
    while(i<text.length){const c=text[i++];if(c==='"'&&!escaped){let value;try{value=JSON.parse(text.slice(start,i));}catch{invalid();}if(!scalar(value))invalid();if(encoder.encode(value).length>limits.string_bytes)limit();return value;}if(c==='\\'&&!escaped)escaped=true;else escaped=false;}
    invalid();
  }
  function value(depth){
    if(depth>limits.json_depth||++values>limits.json_values)limit();space();const c=text[i];
    if(c==='"'){string();return;}
    if(c==='{'){i++;space();const seen=new Set();if(text[i]==='}'){i++;return;}for(;;){if(text[i]!=='"')invalid();const key=string();if(seen.has(key))invalid();seen.add(key);space();if(text[i++]!==':')invalid();value(depth+1);space();const sep=text[i++];if(sep==='}')return;if(sep!==',')invalid();space();}}
    if(c==='['){i++;space();let count=0;if(text[i]===']'){i++;return;}for(;;){if(++count>limits.array_length)limit();value(depth+1);space();const sep=text[i++];if(sep===']')return;if(sep!==',')invalid();}}
    for(const literal of ['true','false','null'])if(text.startsWith(literal,i)){i+=literal.length;return;}
    const m=/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(text.slice(i));if(!m||!Number.isFinite(Number(m[0])))invalid();i+=m[0].length;
  }
  value(0);space();if(i!==text.length)invalid();let data;try{data=JSON.parse(text);}catch{invalid();}if(canonical&&jcs(data)!==text)invalid();return data;
}
module.exports={parseTransportJSON};
