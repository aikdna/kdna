"""Bounded ZIP and CBOR parsers. Nothing is extracted to the filesystem."""
import math
import struct
import zlib
from ._values import reject, entry_name, scalar

LIMITS = {'container': 26214400, 'entries': 128, 'entry': 5242880, 'total': 12582912, 'ratio': 100}


def parse_container(data):
    if len(data) < 22 or len(data) > LIMITS['container']:
        reject()
    def u(at, width):
        if at < 0 or at + width > len(data):
            reject()
        return int.from_bytes(data[at:at + width], 'little')
    end = next((i for i in range(len(data) - 22, max(-1, len(data) - 65558), -1)
                if u(i, 4) == 0x06054b50 and i + 22 + u(i + 20, 2) == len(data)), -1)
    if end < 0 or u(end + 4, 2) or u(end + 6, 2) or u(end + 8, 2) != u(end + 10, 2):
        reject()
    count, central_size, central_start = u(end + 10, 2), u(end + 12, 4), u(end + 16, 4)
    if not 0 < count <= LIMITS['entries'] or central_start + central_size != end:
        reject()
    entries, ranges = {}, []
    offset, total = central_start, 0
    for i in range(count):
        if offset + 46 > len(data) or u(offset, 4) != 0x02014b50:
            reject()
        flags, method, crc = u(offset + 8, 2), u(offset + 10, 2), u(offset + 16, 4)
        compressed, size = u(offset + 20, 4), u(offset + 24, 4)
        length, extra, comment = u(offset + 28, 2), u(offset + 30, 2), u(offset + 32, 2)
        mode, local = u(offset + 38, 4) >> 16, u(offset + 42, 4)
        if offset + 46 + length + extra + comment > len(data):
            reject()
        name_bytes = data[offset + 46:offset + 46 + length]
        name = name_bytes.decode('utf-8')
        if not entry_name(name) or name in entries or flags & ~0x800 or u(offset + 34, 2):
            reject()
        if mode & 0o170000 not in (0, 0o100000):
            reject()
        if name not in ('mimetype', 'kdna.json', 'payload.kdnab', 'checksums.json', 'signature.kdsig') and not name.startswith('attachments/'):
            reject()
        total += size
        if size > LIMITS['entry'] or (compressed == 0 and size != 0) or (compressed and size > compressed * LIMITS['ratio']) or total > LIMITS['total']:
            reject()
        if u(local, 4) != 0x04034b50 or u(local + 6, 2) != flags or u(local + 8, 2) != method or u(local + 14, 4) != crc or u(local + 18, 4) != compressed or u(local + 22, 4) != size or u(local + 26, 2) != length:
            reject()
        start = local + 30 + length + u(local + 28, 2)
        if start + compressed > central_start or data[local + 30:local + 30 + length] != name_bytes or any(local < b and start + compressed > a for a, b in ranges):
            reject()
        ranges.append((local, start + compressed))
        encoded = data[start:start + compressed]
        if method == 0:
            decoded = encoded
        elif method == 8:
            inflater = zlib.decompressobj(-15)
            decoded = inflater.decompress(encoded, LIMITS['entry'] + 1)
            if len(decoded) > LIMITS['entry'] or not inflater.eof:
                reject()
        else:
            reject('READ_CORE_CAPABILITY_UNAVAILABLE')
        if len(decoded) != size or zlib.crc32(decoded) != crc:
            reject()
        if i == 0 and (name != 'mimetype' or local != 0 or method != 0):
            reject()
        entries[name] = decoded
        offset += 46 + length + extra + comment
    physical_end = 0
    for start, stop in sorted(ranges):
        if start != physical_end:
            reject()
        physical_end = stop
    if physical_end != central_start or offset != end or entries.get('mimetype') != b'application/vnd.kdna.asset' or 'kdna.json' not in entries or 'payload.kdnab' not in entries:
        reject()
    return entries


def decode_payload(data):
    offset, count = 0, 0
    def take(length):
        nonlocal offset
        if length < 0 or offset + length > len(data):
            reject()
        start = offset
        offset += length
        return data[start:offset]
    def arg(info):
        if info < 24:
            return info
        if info not in (24, 25, 26, 27):
            reject()
        n = int.from_bytes(take(1 << (info - 24)), 'big')
        return n
    def value(depth):
        nonlocal count
        count += 1
        if depth > 64 or count > 100000:
            reject()
        initial = take(1)[0]
        major, info = initial >> 5, initial & 31
        if major in (0, 1):
            n = arg(info)
            result = n if major == 0 else -1 - n
            if int(float(result)) != result:
                reject()
            return float(result)
        if major in (2, 3):
            length = arg(info)
            if length > 1048576 or major == 2:
                reject()
            text = take(length).decode('utf-8')
            if not scalar(text):
                reject()
            return text
        if major in (4, 5):
            length = arg(info)
            if length > 10000:
                reject()
            if major == 4:
                return [value(depth + 1) for _ in range(length)]
            result = {}
            for _ in range(length):
                key = value(depth + 1)
                if type(key) is not str or key in result:
                    reject()
                result[key] = value(depth + 1)
            return result
        if major == 7:
            if info in (20, 21, 22):
                return {20: False, 21: True, 22: None}[info]
            if info not in (25, 26, 27):
                reject()
            n = struct.unpack({25: '>e', 26: '>f', 27: '>d'}[info], take({25: 2, 26: 4, 27: 8}[info]))[0]
            if not math.isfinite(n):
                reject()
            return n
        reject()
    result = value(0)
    if offset != len(data):
        reject()
    return result
