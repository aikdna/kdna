'use strict';
// Internal browser byte ownership primitive; admission and permissions stay separate.
const bytePrototype = Uint8Array.prototype;
const typedPrototype = Object.getPrototypeOf(bytePrototype);
const getter = key => Object.getOwnPropertyDescriptor(typedPrototype, key).get;
const tag = getter(Symbol.toStringTag);
const lengthOf = getter('length');
const byteLengthOf = getter('byteLength');
const offsetOf = getter('byteOffset');
const bufferOf = getter('buffer');
const arrayBufferLength = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength').get;
const resizable = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'resizable')?.get;
const setBytes = bytePrototype.set;
const MAX_CONTAINER_BYTES = 25 * 1024 * 1024;
function invalid() {
  const error = new Error('READ_INPUT_INVALID');
  error.code = 'READ_INPUT_INVALID';
  throw error;
}
function need(condition) { if (!condition) invalid(); }
function ownBytes(value) {
  // The borrowed getter uses internal slots. It cannot enter a Proxy or a shadow getter.
  let tagValue;
  try { tagValue = tag.call(value); } catch { invalid(); }
  need(tagValue === 'Uint8Array');
  // Reflection is safe only after the internal-slot check has rejected every Proxy.
  need(Object.getPrototypeOf(value) === bytePrototype);
  const length = lengthOf.call(value);
  const byteLength = byteLengthOf.call(value);
  const offset = offsetOf.call(value);
  const buffer = bufferOf.call(value);
  need(Number.isSafeInteger(length) && length === byteLength && length <= MAX_CONTAINER_BYTES);
  // The ArrayBuffer intrinsic rejects SharedArrayBuffer without reading its properties.
  try { arrayBufferLength.call(buffer); } catch { invalid(); }
  need(!resizable || !resizable.call(buffer));
  // Zero-length detached views need this check as well as the length getters.
  try { new Uint8Array(buffer, offset, 0); } catch { invalid(); }
  need(Object.getOwnPropertySymbols(value).length === 0);
  // Enumerating keys does not read values or accessors. Non-enumerable decorations are ignored.
  const names = Object.keys(value);
  need(names.length === length);
  for (let i = 0; i < names.length; i++) need(names[i] === String(i));
  const owned = new Uint8Array(length);
  setBytes.call(owned, value);
  return owned;
}
module.exports = { ownBytes };
