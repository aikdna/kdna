'use strict';
// Same-instance private bridge. JSON values cannot create records in these maps.
const requests = new WeakMap(), authorities = new WeakMap(), preparations = new WeakMap();
function consume(token) {
  const record=preparations.get(token);
  if (!record || record.phase!=='available') return null;
  record.phase='reserved';
  return record;
}
function close(token) {
  const record=preparations.get(token);
  if (!record) return;
  record.phase='closed';
  record.snapshot=null; record.view=null; record.request=null; record.plan=null; record.data=null;
  preparations.delete(token);
}
module.exports={requests,authorities,preparations,consume,close};
