'use strict';
// Read-layer memo: canonicalise frozen values at most once per object identity.
// Output must be byte-identical to strict-input.canonicalJson - see the equivalence step in the order.
const { canonicalJson: raw } = require('./strict-input.js');
const memo = new WeakMap();
function canonicalJson(input) {
  if (input !== null && typeof input === 'object' && Object.isFrozen(input)) {
    const hit = memo.get(input);
    if (hit !== undefined) return hit;
    const out = raw(input);
    memo.set(input, out);
    return out;
  }
  return raw(input);
}
module.exports = { canonicalJson };
