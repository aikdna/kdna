'use strict';
const {controls,hosts}=require('./brands.js');
function createTrustedReadControlProvider(observe){if(typeof observe!=='function')throw new TypeError('Control callback required');const provider=Object.freeze({});controls.set(provider,observe);return provider;}
function createTrustedHostReadProvider(callbacks){if(!callbacks||typeof callbacks.observe!=='function'||(callbacks.deliver!==undefined&&typeof callbacks.deliver!=='function'))throw new TypeError('Host callbacks required');const provider=Object.freeze({});hosts.set(provider,{observe:callbacks.observe,deliver:callbacks.deliver,handles:new Map(),revocations:new Set(),lastEpoch:null});return provider;}
module.exports={createTrustedReadControlProvider,createTrustedHostReadProvider};
