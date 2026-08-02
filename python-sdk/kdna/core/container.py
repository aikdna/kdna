"""KDNA container parsing — ZIP envelope + CBOR payload.

This module reads the distribution container format exactly as the JS Core
does: a ZIP archive whose first entry is a STORED ``mimetype`` equal to
``application/vnd.kdna.asset``, followed by ``kdna.json`` (manifest),
``payload.kdnab`` (CBOR), and optional ``checksums.json``.

It never decrypts entries and never interprets judgment semantics; it only
normalizes the container into a layout that higher layers validate.
"""

from __future__ import annotations

import io
import json
import struct
import zlib
from dataclasses import dataclass
from typing import Any, Dict, Optional

MIMETYPE = "application/vnd.kdna.asset"
REQUIRED_DIR_ENTRIES = ["mimetype", "kdna.json", "payload.kdnab"]
ZIP_LOCAL_SIG = 0x04034B50
ZIP_CENTRAL_SIG = 0x02014B50
ZIP_EOCD_SIG = 0x06054B50

try:
    import cbor2

    def decode_cbor(data: bytes) -> Any:
        return cbor2.loads(data)

    def encode_cbor(value: Any) -> bytes:
        return cbor2.dumps(value)
except ImportError:  # pragma: no cover - dependency is required
    raise ImportError(
        "KDNA Python Core requires cbor2. Install with: pip install cbor2"
    )


class KDNAFormatError(ValueError):
    """Raised when a container violates the KDNA container format."""


@dataclass(frozen=True)
class ZipEntry:
    name: str
    method: int
    data: bytes


def _parse_zip(data: bytes) -> Dict[str, ZipEntry]:
    """Parse a ZIP archive via its central directory (like the JS reader).

    Locates the EOCD within the trailing 64 KiB comment window, walks the
    central directory entries, then reads each entry's data from its local
    file header offset. Returns {name: ZipEntry} in central-directory order.
    """
    if len(data) < 22:
        raise KDNAFormatError("not a ZIP/.kdna container (too short)")
    eocd_off = -1
    min_start = max(0, len(data) - 65557)
    for index in range(len(data) - 22, min_start - 1, -1):
        if struct.unpack_from("<I", data, index)[0] == ZIP_EOCD_SIG:
            eocd_off = index
            break
    if eocd_off < 0:
        raise KDNAFormatError("not a ZIP/.kdna container (no EOCD)")

    total_entries = struct.unpack_from("<H", data, eocd_off + 10)[0]
    cd_offset = struct.unpack_from("<I", data, eocd_off + 16)[0]

    entries: Dict[str, ZipEntry] = {}
    pointer = cd_offset
    for _ in range(total_entries):
        if pointer + 46 > len(data):
            raise KDNAFormatError("central directory exceeds archive")
        signature = struct.unpack_from("<I", data, pointer)[0]
        if signature != ZIP_CENTRAL_SIG:
            raise KDNAFormatError(f"bad central-directory entry at offset {pointer}")
        method = struct.unpack_from("<H", data, pointer + 10)[0]
        compressed_size = struct.unpack_from("<I", data, pointer + 20)[0]
        uncompressed_size = struct.unpack_from("<I", data, pointer + 24)[0]
        name_len = struct.unpack_from("<H", data, pointer + 28)[0]
        extra_len = struct.unpack_from("<H", data, pointer + 30)[0]
        comment_len = struct.unpack_from("<H", data, pointer + 32)[0]
        local_offset = struct.unpack_from("<I", data, pointer + 42)[0]
        name = data[pointer + 46 : pointer + 46 + name_len].decode("utf-8", "replace")

        if local_offset + 30 > len(data):
            raise KDNAFormatError(f"bad local-file-header for entry {name}")
        if struct.unpack_from("<I", data, local_offset)[0] != ZIP_LOCAL_SIG:
            raise KDNAFormatError(f"bad local-file-header for entry {name}")
        local_name_len = struct.unpack_from("<H", data, local_offset + 26)[0]
        local_extra_len = struct.unpack_from("<H", data, local_offset + 28)[0]
        payload_start = local_offset + 30 + local_name_len + local_extra_len
        payload_end = payload_start + compressed_size
        if payload_end > len(data):
            raise KDNAFormatError(f"entry {name}: payload exceeds archive")
        raw = data[payload_start:payload_end]
        if method == 0:
            content = raw
        elif method == 8:
            try:
                content = zlib.decompress(raw, -15)
            except zlib.error as error:
                raise KDNAFormatError(f"entry {name}: invalid deflate: {error}")
        else:
            raise KDNAFormatError(
                f"entry {name}: unsupported compression method {method}"
            )
        if len(content) != uncompressed_size:
            raise KDNAFormatError(
                f"entry {name}: uncompressed size mismatch "
                f"({len(content)} != {uncompressed_size})"
            )
        if name not in entries:
            entries[name] = ZipEntry(name=name, method=method, data=content)
        pointer += 46 + name_len + extra_len + comment_len

    if not entries:
        raise KDNAFormatError("no ZIP entries found")
    return entries


def _json_entry(entries: Dict[str, ZipEntry], name: str) -> Any:
    if name not in entries:
        raise KDNAFormatError(f"missing required entry {name}")
    try:
        return json.loads(entries[name].data.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise KDNAFormatError(f"{name}: invalid JSON: {error}")


@dataclass(frozen=True)
class Layout:
    kind: str
    entries: Dict[str, ZipEntry]
    manifest: Dict[str, Any]
    payload: Any
    mimetype: str


def read_layout(data: bytes) -> Layout:
    entries = _parse_zip(data)
    if "mimetype" not in entries:
        raise KDNAFormatError("missing required entry mimetype")
    if entries["mimetype"].method != 0:
        raise KDNAFormatError("mimetype must be uncompressed")
    mime = entries["mimetype"].data.decode("utf-8", "replace")
    if mime != MIMETYPE:
        raise KDNAFormatError(f"mimetype is not {MIMETYPE}")
    first_name = next(iter(entries))
    if first_name != "mimetype":
        raise KDNAFormatError("first entry is not mimetype")
    for required in REQUIRED_DIR_ENTRIES:
        if required not in entries:
            raise KDNAFormatError(f"missing required entry {required}")
    manifest = _json_entry(entries, "kdna.json")
    payload = decode_cbor(entries["payload.kdnab"].data)
    return Layout(
        kind="packaged",
        entries=entries,
        manifest=manifest,
        payload=payload,
        mimetype=mime,
    )


def read_layout_file(path: str) -> Layout:
    with open(path, "rb") as handle:
        return read_layout(handle.read())
