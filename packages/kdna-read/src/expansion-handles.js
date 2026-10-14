'use strict';
// Session-scoped resolution of an expansion handle by its id.
//
// Every delivered answer that issues handles carries them in
// `envelope.content.expansion_handles`. A client that kept that answer can name
// a handle by id instead of echoing the whole object back; this module is the
// lookup, with explicit refusals for the cases a stale or foreign id creates.
// Resolution grants nothing: the handle it hands back still goes through the
// reader's own admission on use, which re-validates origin, snapshot, host
// session epoch and expiry against the live context. Nothing here touches the
// network, the host registry or the asset.
const {clone, freeze} = require('./util.js');

function unavailable(code, message, action) {
  return freeze({status: 'unavailable', code, message, guidance: {action}});
}
function isText(value) {
  return typeof value === 'string' && value.length > 0;
}
// The handles one delivered result issued, keyed by id. A later delivery for
// the same session can add to the map; an id is never overwritten with a
// different handle because handle ids are unique per issuer.
function collectExpansionHandles(target, into) {
  const map = into instanceof Map ? into : new Map();
  const handles = target?.envelope?.content?.expansion_handles;
  if (Array.isArray(handles)) {
    for (const handle of handles) {
      if (handle && isText(handle.handle_id) && !map.has(handle.handle_id)) map.set(handle.handle_id, handle);
    }
  }
  return map;
}
// options.current_ms / options.snapshot_id / options.asset_id are the client's
// own live context; a check fires only when the caller states it.
function resolveExpansionHandle(handles, handleId, options = {}) {
  if (!isText(handleId) || !handles || typeof handles.get !== 'function')
    return unavailable('READ_HANDLE_UNKNOWN', 'the id does not name an expansion handle this session was issued',
      'request a fresh read and use one of the handle ids that answer returned');
  const handle = handles.get(handleId);
  if (!handle)
    return unavailable('READ_HANDLE_UNKNOWN', 'the id does not name an expansion handle this session was issued',
      'request a fresh read and use one of the handle ids that answer returned');
  // The R2 pipeline issues handles with flat asset ids; the retained route
  // nests them under `asset`. Both name the same thing.
  const assetId = handle.asset?.asset_id ?? handle.asset_id;
  const assetVersion = handle.asset?.asset_version ?? handle.asset_version;
  if (isText(options.asset_id) && (assetId !== options.asset_id || assetVersion !== options.asset_version))
    return unavailable('READ_HANDLE_ASSET_MISMATCH', 'the handle was issued for a different asset or version',
      'resolve the handle against the asset it was issued for, or request a fresh read of this asset');
  if (isText(options.snapshot_id) && handle.snapshot_id !== options.snapshot_id)
    return unavailable('READ_HANDLE_STALE', 'the handle was issued for a different snapshot of this asset',
      'request a fresh read; handles only expand the snapshot that issued them');
  if (typeof options.current_ms === 'number' && options.current_ms >= handle.expires_at)
    return unavailable('READ_HANDLE_EXPIRED', 'the handle is past its expiry',
      'request a fresh read; expansion handles expire with the session window that issued them');
  return freeze({status: 'ready', handle: freeze(clone(handle))});
}

module.exports = { collectExpansionHandles, resolveExpansionHandle };
