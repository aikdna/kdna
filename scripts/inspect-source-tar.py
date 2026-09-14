#!/usr/bin/env python3
"""Read bounded third-party tar members without extracting any filesystem path."""
import gzip
import hashlib
import io
import json
import pathlib
import sys
import tarfile


def inspect(data):
    if len(data) > 32 * 1024 * 1024:
        raise ValueError("packed source archive exceeds limit")
    with gzip.GzipFile(fileobj=io.BytesIO(data)) as compressed:
        unpacked = compressed.read(256 * 1024 * 1024 + 1)
    if len(unpacked) > 256 * 1024 * 1024:
        raise ValueError("unpacked source archive exceeds limit")
    files, seen, prefix, total = [], set(), None, 0
    with tarfile.open(fileobj=io.BytesIO(unpacked), mode="r:") as archive:
        for count, member in enumerate(archive, 1):
            if count > 20000:
                raise ValueError("source archive member count exceeds limit")
            name = member.name.rstrip("/")
            parts = name.split("/")
            if not name or any(p in ("", ".", "..") for p in parts) or "\\" in name or "\0" in name:
                raise ValueError("unsafe source archive path")
            if pathlib.PurePosixPath(name).is_absolute() or name in seen:
                raise ValueError("duplicate or absolute source archive path")
            seen.add(name)
            prefix = prefix or parts[0]
            if parts[0] != prefix:
                raise ValueError("multiple source archive roots")
            if member.isdir():
                continue
            if not member.isfile() or len(parts) < 2 or member.size > 64 * 1024 * 1024:
                raise ValueError("non-regular or oversized source archive member")
            total += member.size
            if total > 192 * 1024 * 1024:
                raise ValueError("source archive contents exceed limit")
            content = archive.extractfile(member).read(member.size + 1)
            if len(content) != member.size:
                raise ValueError("truncated source archive member")
            files.append({"path": "/".join(parts[1:]), "mode": member.mode,
                          "size": member.size, "sha256": hashlib.sha256(content).hexdigest()})
            if files[-1]["path"] == "package.json":
                package = json.loads(content)
    if not files or "package" not in locals():
        raise ValueError("source archive package manifest missing")
    return {"name": package["name"], "version": package["version"],
            "members": sorted(files, key=lambda row: row["path"])}


if __name__ == "__main__":
    try:
        print(json.dumps(inspect(sys.stdin.buffer.read(32 * 1024 * 1024 + 1)), separators=(",", ":")))
    except (ValueError, OSError, tarfile.TarError, KeyError) as error:
        sys.exit(f"source archive inspection failed: {error}")
