'use strict';
// Candidate section capture. Metadata first; complete bytes only after native authorization.
const fs = require('node:fs/promises');
const { inflateRawSync } = require('node:zlib');
const { LIMITS, crc32 } = require('./section-container.js');
const { entryName, reject } = require('./strict-input.js');
const { digest } = require('./digests.js');
const decoder = new TextDecoder('utf-8', {
    fatal: true
});
const same = (a, b) => Buffer.from(a).equals(Buffer.from(b));
function need(v) {
    if (!v)
        reject('READ_CORE_INVALID');
}
function statKey(s) {
    return [s.dev, s.ino, s.size, s.mtimeNs, s.ctimeNs].map(String).join(':');
}
async function openSourceRouteCapture(input) {
    const isFile = typeof input === 'string';
    let owned = null;
    if (!isFile) {
        if (!require('node:util').types.isUint8Array(input) || ![Uint8Array.prototype, Buffer.prototype].includes(Object.getPrototypeOf(input)))
            reject('READ_INPUT_INVALID');
        const typed = Object.getPrototypeOf(Uint8Array.prototype);
        const get = name => Reflect.apply(Object.getOwnPropertyDescriptor(typed, name).get, input, []);
        const length = get('byteLength');
        for (const key of Reflect.ownKeys(input)) {
            const descriptor = Object.getOwnPropertyDescriptor(input, key);
            if (typeof key !== 'string' || !/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length || !Object.hasOwn(descriptor, 'value')) reject('READ_INPUT_INVALID');
        }
        need(length <= LIMITS.container);
        owned = Buffer.from(new Uint8Array(get('buffer'), get('byteOffset'), length));
    }
    const memoryStat = {
        dev: 0n, ino: 0n, size: BigInt(owned?.length ?? 0), mtimeNs: 0n, ctimeNs: 0n, isFile: () => true
    };
    const fd = isFile ? await fs.open(input, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK) : {
        stat: async () => memoryStat, read: async (b, offset, count, position) => {
            owned.copy(b, offset, position, position + count);
            return {
                bytesRead: count
            };
        }, close: async () => {
            owned.fill(0);
        }
    }, io = [];
    try {
        const initial = await fd.stat({
            bigint: true
        }), length = Number(initial.size);
        need(initial.isFile() && Number.isSafeInteger(length) && length >= 22 && length <= LIMITS.container);
        async function range(offset, count, purpose) {
            need(Number.isSafeInteger(offset) && Number.isSafeInteger(count) && offset >= 0 && count >= 0 && offset + count <= length);
            const b = Buffer.alloc(count);
            let n = 0;
            while (n < count) {
                const r = await fd.read(b, n, count - n, offset + n);
                need(r.bytesRead > 0);
                n += r.bytesRead;
            }
            if (!isFile)
                return b;
            if (['section_structure_after_authorization', 'section_interpretation_after_authorization'].includes(purpose)) {
                let batch = io.at(-1);
                if (batch?.purpose !== purpose || !batch.ranges || batch.ranges.length === 4096) {
                    batch = {
                        purpose, ranges: []
                    };
                    io.push(batch);
                }
                batch.ranges.push({
                    offset_bytes: offset, length_bytes: count
                });
            }
            else
                io.push({
                    offset_bytes: offset, length_bytes: count, purpose
                });
            return b;
        }
        // Fixed final22 first avoids a speculative tail read through content in normal no-comment ZIPs.
        let end = length - 22, endBytes = await range(end, 22, 'zip_end'), footerObservation = endBytes;
        if (endBytes.readUInt32LE(0) !== 0x06054b50 || endBytes.readUInt16LE(20) !== 0)
            ({
                end, endBytes, footerObservation
            } = await require('./source-route-comment-locator.js').locateCommentFooter(length, range));
        const eocd = endBytes;
        need(!eocd.readUInt16LE(4) && !eocd.readUInt16LE(6) && eocd.readUInt16LE(8) === eocd.readUInt16LE(10));
        const count = eocd.readUInt16LE(10), cdSize = eocd.readUInt32LE(12), cdStart = eocd.readUInt32LE(16);
        need(count > 0 && count <= LIMITS.entries && cdStart + cdSize === end);
        const rows = [], names = new Set();
        let at = 0, total = 0;
        for (let i = 0; i < count; i++) {
            need(at + 46 <= cdSize);
            const record = await range(cdStart + at, 46, 'zip_directory_header');
            need(record.readUInt32LE(0) === 0x02014b50);
            const flags = record.readUInt16LE(8), method = record.readUInt16LE(10), crc = record.readUInt32LE(16), compressed = record.readUInt32LE(20), size = record.readUInt32LE(24), nl = record.readUInt16LE(28), xl = record.readUInt16LE(30), cl = record.readUInt16LE(32), mode = record.readUInt32LE(38) >>> 16, local = record.readUInt32LE(42);
            need(at + 46 + nl + xl + cl <= cdSize && nl > 0 && nl <= 4096);
            const nb = await range(cdStart + at + 46, nl, 'zip_directory_name'), name = decoder.decode(nb), type = mode & 0o170000;
            need(entryName(name) && !names.has(name) && !(flags & ~0x800) && !record.readUInt16LE(34) && (!type || type === 0o100000));
            names.add(name);
            need(['mimetype', 'kdna.json', 'payload.kdnab', 'checksums.json', 'signature.kdsig'].includes(name) || name.startsWith('attachments/') || /^sections\/pack-(0|[1-9][0-9]*)\.kdnab$/.test(name));
            need(!name.startsWith('sections/') || method === 0);
            need(size <= LIMITS.entry && !(compressed === 0 && size !== 0) && (!compressed || size / compressed <= LIMITS.ratio) && (total += size) <= LIMITS.total);
            need(local + 30 <= cdStart);
            const header = await range(local, 30, 'zip_local_header');
            need(header.readUInt32LE(0) === 0x04034b50 && header.readUInt16LE(6) === flags && header.readUInt16LE(8) === method && header.readUInt32LE(14) === crc && header.readUInt32LE(18) === compressed && header.readUInt32LE(22) === size && header.readUInt16LE(26) === nl);
            need(local + 30 + nl <= cdStart);
            const localName = await range(local + 30, nl, 'zip_local_name');
            need(same(nb, localName));
            const start = local + 30 + nl + header.readUInt16LE(28);
            need(start + compressed <= cdStart);
            if (i === 0)
                need(name === 'mimetype' && local === 0 && method === 0);
            rows.push({
                name, flags, method, crc, size, compressed, local, start, end: start + compressed
            });
            at += 46 + nl + xl + cl;
        }
        need(at === cdSize);
        let position = 0;
        for (const row of [...rows].sort((a, b) => a.local - b.local)) {
            need(row.local === position);
            position = row.end;
        }
        need(position === cdStart);
        const directory = await range(cdStart, cdSize, 'zip_directory');
        const manifestRow = rows.find(r => r.name === 'kdna.json'), mimeRow = rows.find(r => r.name === 'mimetype');
        need(manifestRow && mimeRow);
        async function member(row, purpose) {
            const raw = await range(row.start, row.compressed, purpose);
            let b;
            if (row.method === 0)
                b = raw;
            else if (row.method === 8)
                b = inflateRawSync(raw, {
                    maxOutputLength: LIMITS.entry
                });
            else
                reject('READ_CORE_CAPABILITY_UNAVAILABLE');
            need(b.length === row.size && crc32(b) === row.crc);
            return b;
        }
        const mime = await member(mimeRow, 'mimetype');
        need(decoder.decode(mime) === 'application/vnd.kdna.asset');
        const manifestBytes = await member(manifestRow, 'manifest');
        need(statKey(await fd.stat({
            bigint: true
        })) === statKey(initial));
        const identity = Object.freeze({
            capture_id: 'capture:' + globalThis.crypto.randomUUID(), input_byte_length: length, manifest_bytes_digest: digest(manifestBytes), zip_directory_bytes_digest: digest(directory), input_profile: 'public_sections06', identity_scope: 'observed_outer_metadata_before_source_materialization'
        });
        let consumed = false;
        const touchedMembers = new Set();
        async function wholeAfterAuthorization() {
            need(!consumed);
            consumed = true;
            need(statKey(await fd.stat({
                bigint: true
            })) === statKey(initial));
            const bytes = await range(0, length, 'whole_after_authorization');
            need(statKey(await fd.stat({
                bigint: true
            })) === statKey(initial));
            need(same(bytes.subarray(cdStart, cdStart + cdSize), directory) && same(bytes.subarray(end), footerObservation));
            const raw = bytes.subarray(manifestRow.start, manifestRow.end), m = manifestRow.method === 0 ? raw : inflateRawSync(raw, {
                maxOutputLength: LIMITS.entry
            });
            need(same(m, manifestBytes));
            return bytes;
        }
        async function assertUnchanged() {
            need(statKey(await fd.stat({
                bigint: true
            })) === statKey(initial));
        }
        return {
            assertUnchanged, identity, manifestBytes, rows: rows.map(r => Object.freeze({
                ...r
            })), io, wholeAfterAuthorization, close: () => fd.close()
        };
    }
    catch (e) {
        e.capture_io = structuredClone(io);
        await fd.close();
        throw e;
    }
}
module.exports = {
    openSourceRouteCapture
};
