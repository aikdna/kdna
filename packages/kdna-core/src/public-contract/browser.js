'use strict';
const {admit,rejected}=require('./admit.js');
const {inflate}=require('./portable-inflate.js');
function admitBrowser(input) {
  try {
    return admit(input instanceof ArrayBuffer?new Uint8Array(input):input,inflate);
  } catch {
    return rejected('READ_CORE_INVALID');
  }
}
module.exports={admitBrowser};
