#!/usr/bin/env python3
"""Build the separately scoped Python source candidate without registry access."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path, PurePosixPath
import tarfile
import tomllib
import zipfile

ROOT = Path(__file__).resolve().parent.parent


def safe_member(name):
    value = PurePosixPath(name)
    if value.is_absolute() or ".." in value.parts or "\\" in name:
        raise ValueError("Unsafe distribution member")
    return value


def build(output):
    project = tomllib.loads((ROOT / "pyproject.toml").read_text())["project"]
    binding = json.loads((ROOT / "kdna/public-contract-binding.json").read_text())
    if (project["name"], project["version"]) != ("aikdna", "0.8.0rc2"):
        raise ValueError("This source route is limited to aikdna 0.8.0rc2")
    if binding["implementation"] != {"name": project["name"], "version": project["version"]}:
        raise ValueError("Python source binding differs from package metadata")
    if project["dependencies"] != []:
        raise ValueError("The source candidate must remain standard-library only")
    output = Path(output).absolute()
    output.mkdir(parents=True, exist_ok=False)
    spec = importlib.util.spec_from_file_location("kdna_source_backend", ROOT / "build_support/backend.py")
    backend = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(backend)
    artifacts = []
    for filename in [backend.build_wheel(str(output)), backend.build_sdist(str(output))]:
        artifact = output / filename
        if filename.endswith(".whl"):
            with zipfile.ZipFile(artifact) as archive:
                names = archive.namelist()
                for member in archive.infolist():
                    safe_member(member.filename)
                    if member.is_dir() or (member.external_attr >> 16) & 0o170000 != 0o100000:
                        raise ValueError("Wheel contains a non-regular member")
                metadata = archive.read("aikdna-0.8.0rc2.dist-info/METADATA").decode()
        else:
            with tarfile.open(artifact, "r:gz") as archive:
                members = archive.getmembers()
                names = [member.name for member in members]
                for member in members:
                    safe_member(member.name)
                    if not member.isfile():
                        raise ValueError("Source archive contains a non-regular member")
                metadata = archive.extractfile("aikdna-0.8.0rc2/PKG-INFO").read().decode()
        if any("retired" in safe_member(name).parts or "__pycache__" in safe_member(name).parts for name in names):
            raise ValueError("Retired source or local cache entered the distribution")
        if len(names) != len(set(names)):
            raise ValueError("Duplicate distribution member")
        for line in ["Name: aikdna", "Version: 0.8.0rc2", "Requires-Python: >=3.11", "License-Expression: Apache-2.0"]:
            if line not in metadata.splitlines():
                raise ValueError("Distribution metadata differs from the source candidate")
        if any(line.startswith("Requires-Dist:") for line in metadata.split("\n\n", 1)[0].splitlines()):
            raise ValueError("Unexpected runtime dependency")
        artifacts.append({"file": filename, "bytes": artifact.stat().st_size,
                          "sha256": hashlib.sha256(artifact.read_bytes()).hexdigest(), "members": len(names)})
    report = {"format": "kdna.python-source-artifacts/1", "name": project["name"], "version": project["version"],
              "tuple": binding["tuple"], "artifacts": artifacts,
              "scope": "Historical-contract Python source candidate; no native/browser parity, signing, PyPI publication or human acceptance."}
    (output / "source-artifacts.json").write_text(json.dumps(report, indent=2) + "\n")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, help="New output directory; an existing path is refused")
    print(json.dumps(build(parser.parse_args().output), indent=2))
