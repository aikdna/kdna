"""KDNA deterministic pack — mirrors JS Core pack exactly.

Output is byte-reproducible: fixed DOS epoch timestamps, fixed entry order
(mimetype first, STORED), and DEFLATE for the remaining entries. The ZIP
layout matches the JS builder byte-for-byte for the same zlib version.
"""

from __future__ import annotations

import json
import struct
import zlib
from pathlib import Path
from typing import Dict, List, Tuple

from .container import MIMETYPE, REQUIRED_DIR_ENTRIES

DOS_EPOCH_TIME = 0
DOS_EPOCH_DATE = 1
ALLOWED_TOP_LEVEL_ENTRIES = {
    "mimetype",
    "kdna.json",
    "payload.kdnab",
    "checksums.json",
    "authoring",
    "KDNA_Core.json",
    "KDNA_Patterns.json",
    "KDNA_Scenarios.json",
    "KDNA_Cases.json",
    "KDNA_Reasoning.json",
    "KDNA_Evolution.json",
    "release",
    "signature",
    "components",
}
FORBIDDEN_LEGACY_TOP_LEVEL = {"store", "server", "vendor", "packages"}


def _crc32(data: bytes) -> int:
    return zlib.crc32(data) & 0xFFFFFFFF


def _local_header(name: bytes, data: bytes, method: int) -> Tuple[bytes, bytes, int, int, int, int]:
    compressor = zlib.compressobj(6, zlib.DEFLATED, -15)
    compressed = compressor.compress(data) + compressor.flush() if method == 8 else data
    crc = _crc32(data)
    header = bytearray(30 + len(name))
    struct.pack_into("<IHHHHHIIIHH", header, 0,
                     0x04034B50, 20, 0, method, DOS_EPOCH_TIME, DOS_EPOCH_DATE,
                     crc, len(compressed), len(data), len(name), 0)
    header[30:] = name
    return bytes(header), compressed, crc, DOS_EPOCH_TIME, DOS_EPOCH_DATE, len(data)


def _central_header(
    method: int, crc: int, time: int, date: int,
    compressed: bytes, data_length: int, offset: int, name: bytes,
) -> bytes:
    header = bytearray(46 + len(name))
    struct.pack_into(
        "<IHHHHHHIIIHHHHHII", header, 0,
        0x02014B50, 20, 20, 0, method, time, date, crc,
        len(compressed), data_length, len(name), 0, 0, 0, 0, 0, offset,
    )
    header[46:] = name
    return bytes(header)


def list_source_dir(source_dir: Path) -> List[Tuple[str, Path]]:
    collected: List[Tuple[str, Path]] = []
    for path in sorted(source_dir.rglob("*")):
        if not path.is_file():
            continue
        relative = path.relative_to(source_dir).as_posix()
        collected.append((relative, path))
    return collected


def build_checksums(source_dir: Path) -> Dict[str, object]:
    from .validate import compute_runtime_entry_set_digest

    import hashlib

    manifest_bytes = (source_dir / "kdna.json").read_bytes()
    payload_bytes = (source_dir / "payload.kdnab").read_bytes()

    def bare_digest(value: bytes) -> str:
        return hashlib.sha256(value).hexdigest()

    def digest_entry(entry_path: Path) -> str:
        return f"sha256:{bare_digest(entry_path.read_bytes())}"

    return {
        "digest_profile": "kdna.digest-basis.runtime-entry-set",
        "digest_profile_version": "0.1.0",
        "covered_entries": ["kdna.json", "payload.kdnab"],
        "algorithm": "sha256",
        "manifest_digest": digest_entry(source_dir / "kdna.json"),
        "payload_digest": digest_entry(source_dir / "payload.kdnab"),
        "entry_set_digest": compute_runtime_entry_set_digest(manifest_bytes, payload_bytes),
        "entries": {
            "kdna.json": {"value": bare_digest(manifest_bytes), "algorithm": "sha256"},
            "payload.kdnab": {"value": bare_digest(payload_bytes), "algorithm": "sha256"},
        },
    }


def pack(source_dir: str, output_path: str) -> Dict[str, object]:
    source = Path(source_dir).resolve()
    if not source.is_dir():
        raise ValueError(f"not a directory: {source}")
    for required in REQUIRED_DIR_ENTRIES:
        if not (source / required).is_file():
            raise ValueError(f"cannot pack: missing required entry {required}")
    mime = (source / "mimetype").read_text("utf-8")
    if mime != MIMETYPE:
        raise ValueError(f'cannot pack: mimetype is "{mime}", expected "{MIMETYPE}"')

    collected = list_source_dir(source)
    for relative, _ in collected:
        top_level = relative.split("/")[0]
        if top_level not in ALLOWED_TOP_LEVEL_ENTRIES:
            if top_level in FORBIDDEN_LEGACY_TOP_LEVEL:
                raise ValueError(f"cannot pack forbidden top-level source entry: {top_level}")
            raise ValueError(f"cannot pack unsupported top-level entry: {top_level}")

    order = ["mimetype"] + [relative for relative, _ in collected if relative != "mimetype"]

    local_chunks: List[bytes] = []
    central_chunks: List[bytes] = []
    offset = 0
    for relative in order:
        if relative == "mimetype":
            data = MIMETYPE.encode("utf-8")
        else:
            path = next((path for name, path in collected if name == relative), None)
            if path is None:
                continue
            data = path.read_bytes()
        name_bytes = relative.encode("utf-8")
        method = 0 if relative == "mimetype" else 8
        local, compressed, crc, time, date, data_length = _local_header(name_bytes, data, method)
        local_chunks.append(local)
        local_chunks.append(compressed)
        central_chunks.append(
            _central_header(method, crc, time, date, compressed, data_length, offset, name_bytes)
        )
        offset += len(local) + len(compressed)

    central_offset = offset
    central_size = sum(len(chunk) for chunk in central_chunks)
    eocd = bytearray(22)
    struct.pack_into("<IHHHHIIH", eocd, 0,
                     0x06054B50, 0, 0, len(order), len(order), central_size, central_offset, 0)

    target = Path(output_path).resolve()
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(b"".join([*local_chunks, *central_chunks, bytes(eocd)]))
    return {"output_path": str(target), "entries": order}


def pack_source(source_dir: str) -> bytes:
    """Pack to memory and return the exact container bytes (deterministic)."""
    import tempfile

    with tempfile.NamedTemporaryFile(suffix=".kdna", delete=False) as handle:
        pack(source_dir, handle.name)
        path = handle.name
    data = Path(path).read_bytes()
    Path(path).unlink()
    return data
