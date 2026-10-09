"""Bounded-admission regressions for malformed deflate members.

The external 2026-10-09 evaluation found that a corrupted deflate member
escaped `admit_bytes` as an uncaught `zlib.error` instead of a structured
rejection. These tests pin the repaired contract: every input returns a
rejection result, and the corrupted-deflate case maps to `READ_CORE_INVALID`,
which is what the JavaScript Core reports for the same bytes.
"""
import random
import struct
import sys
import unittest
import zlib
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from kdna import admit_bytes  # noqa: E402

FIXTURES = Path(__file__).resolve().parent / 'fixtures'


def _local_header(name, method, crc, compressed, size):
    return (struct.pack('<IHHHHHIIIHH', 0x04034B50, 20, 0, method, 0, 0, crc, compressed, size, len(name), 0)
            + name)


def _central_header(name, method, crc, compressed, size, offset):
    return (struct.pack('<IHHHHHHIIIHHHHHII', 0x02014B50, 20, 20, 0, method, 0, 0, crc, compressed, size,
                        len(name), 0, 0, 0, 0, 0o100644 << 16, offset)
            + name)


def container_with_member(name, method, member_bytes, declared_size):
    """Container in the member order the parser requires.

    Stored members declare their real length and CRC; the injected member
    declares the requested length so the structural checks pass and inflation
    is the step that decides.
    """
    mimetype = b'application/vnd.kdna.asset'
    members = [('mimetype', 0, mimetype, len(mimetype), zlib.crc32(mimetype)),
               (name, method, member_bytes, declared_size, 0),
               ('payload.kdnab', 0, b'{}', 2, zlib.crc32(b'{}'))]
    local, central, offset = [], [], 0
    for member, method_, body, size_, crc_ in members:
        encoded = member.encode()
        local.append(_local_header(encoded, method_, crc_, len(body), size_))
        local.append(body)
        central.append(_central_header(encoded, method_, crc_, len(body), size_, offset))
        offset += 30 + len(encoded) + len(body)
    directory = b''.join(central)
    end = struct.pack('<IHHHHIIH', 0x06054B50, 0, 0, len(members), len(members), len(directory), offset, 0)
    return b''.join(local) + directory + end


class MalformedDeflateTests(unittest.TestCase):
    def test_invalid_deflate_member_is_a_structured_rejection(self):
        # A stored block whose declared length does not match the stream makes
        # the raw inflater raise instead of returning bytes.
        bytes_ = container_with_member('kdna.json', 8, b'\x00\x00\x00\x00\xff\xff', 16)
        result = admit_bytes(bytes_)
        self.assertEqual(result['status'], 'rejected')
        self.assertEqual(result['reason'], 'READ_CORE_INVALID')

    def test_over_long_code_member_is_a_structured_rejection(self):
        # A second inflate error path (too many length or distance symbols).
        bytes_ = container_with_member('kdna.json', 8, b'\xed\xff\xff\xff', 16)
        result = admit_bytes(bytes_)
        self.assertEqual(result['status'], 'rejected')
        self.assertEqual(result['reason'], 'READ_CORE_INVALID')

    def test_zero_compressed_member_is_a_structured_rejection(self):
        # `compressed == 0` with a non-zero size is refused before inflation;
        # this keeps the structural branch covered next to the inflate branch.
        bytes_ = container_with_member('kdna.json', 0, b'', 16)
        result = admit_bytes(bytes_)
        self.assertEqual(result['status'], 'rejected')
        self.assertEqual(result['reason'], 'READ_CORE_INVALID')

    def test_truncated_deflate_member_is_a_structured_rejection(self):
        # Valid deflate prefix that never reaches the end-of-stream marker.
        bytes_ = container_with_member('kdna.json', 8, b'\x00', 16)
        result = admit_bytes(bytes_)
        self.assertEqual(result['status'], 'rejected')
        self.assertEqual(result['reason'], 'READ_CORE_INVALID')

    def test_mutated_fixtures_never_raise(self):
        fixtures = sorted(FIXTURES.glob('*.kdna'))
        self.assertGreater(len(fixtures), 0)
        rng = random.Random(20261009)
        checked = 0
        for path in fixtures:
            base = bytearray(path.read_bytes())
            if len(base) < 30:
                continue
            for _ in range(8):
                mutated = bytearray(base)
                for _ in range(rng.randint(1, 4)):
                    index = rng.randrange(len(mutated))
                    mutated[index] = rng.randrange(256)
                result = admit_bytes(bytes(mutated))
                self.assertIsInstance(result, dict)
                self.assertIn(result['status'], ('accepted', 'rejected'))
                checked += 1
        self.assertGreater(checked, 1000)


if __name__ == '__main__':
    unittest.main()
