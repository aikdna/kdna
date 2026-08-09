#!/usr/bin/env python3
"""Build a signed, checksummed kdna Python release.

Produces dist/kdna-<version>.tar.gz and dist/kdna-<version>-py3-none-any.whl,
writes a SHA-256 sidecar per artifact, signs each artifact with minisign using
the release signing key supplied via KDNA_PYPI_SIGNING_KEY (or the secret key
path from KDNA_PYPI_SIGNING_KEY_PATH), and verifies both checksum and signature.

Environment:
  KDNA_PYPI_SIGNING_KEY        contents of the minisign secret key (preferred)
  KDNA_PYPI_SIGNING_KEY_PATH   path to the minisign secret key (fallback)
  KDNA_PYPI_PUBLIC_KEY_PATH    path to the minisign public key for verify
  KDNA_PYTHON                  python interpreter to use for the build (default: python3)

The signing key must never be written to the repository or to a log.
"""

from __future__ import annotations

import hashlib
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"


def run(cmd: list[str], **kwargs):
    print("+", " ".join(cmd), flush=True)
    return subprocess.run(cmd, check=True, **kwargs)


def sha256_sidecar(artifact: Path) -> Path:
    digest = hashlib.sha256(artifact.read_bytes()).hexdigest()
    sidecar = artifact.with_suffix(artifact.suffix + ".sha256")
    sidecar.write_text(f"{digest}  {artifact.name}\n", encoding="utf-8")
    return sidecar


def sign_artifact(artifact: Path, secret_key: Path, pub_key: Path, sig_dir: Path) -> Path:
    signature = sig_dir / f"{artifact.name}.minisig"
    run(
        [
            "minisign",
            "-S",
            "-s",
            str(secret_key),
            "-p",
            str(pub_key),
            "-x",
            str(signature),
            "-m",
            str(artifact),
        ]
    )
    return signature


def verify(artifact: Path, pub_key: Path, sig_dir: Path) -> None:
    signature = sig_dir / f"{artifact.name}.minisig"
    run(
        [
            "minisign",
            "-V",
            "-p",
            str(pub_key),
            "-x",
            str(signature),
            "-m",
            str(artifact),
        ]
    )
    sidecar = artifact.with_suffix(artifact.suffix + ".sha256")
    if not sidecar.exists():
        raise SystemExit(f"missing SHA-256 sidecar: {sidecar}")
    expected = sidecar.read_text(encoding="utf-8").strip().split()[0]
    actual = hashlib.sha256(artifact.read_bytes()).hexdigest()
    if expected != actual:
        raise SystemExit(f"SHA-256 mismatch for {artifact.name}")
    print(f"verified: {artifact.name} (sha256 {actual})", flush=True)


def load_secret_key() -> Path:
    key_contents = os.environ.get("KDNA_PYPI_SIGNING_KEY")
    key_path = os.environ.get("KDNA_PYPI_SIGNING_KEY_PATH")
    if key_contents:
        tmp = tempfile.NamedTemporaryFile(prefix="kdna-signing-", delete=False)
        tmp.write(key_contents.encode("utf-8"))
        tmp.close()
        os.chmod(tmp.name, 0o600)
        return Path(tmp.name)
    if key_path:
        return Path(key_path)
    raise SystemExit("KDNA_PYPI_SIGNING_KEY or KDNA_PYPI_SIGNING_KEY_PATH is required")


def main() -> None:
    py = os.environ.get("KDNA_PYTHON", "python3")
    if shutil.which("minisign") is None:
        raise SystemExit("minisign is required on PATH")

    dist = DIST
    dist.mkdir(exist_ok=True)
    for old in dist.iterdir():
        if old.is_file():
            old.unlink()

    run([py, "-m", "build", "--sdist", "--wheel", "--outdir", str(dist)], cwd=ROOT)

    pub_key = Path(os.environ.get("KDNA_PYPI_PUBLIC_KEY_PATH", str(ROOT / "release-signing.pub")))
    if not pub_key.exists():
        raise SystemExit(f"public key not found: {pub_key}")

    sig_dir = dist / ".signatures"
    sig_dir.mkdir(exist_ok=True)

    secret_key = load_secret_key()
    try:
        artifacts = sorted(dist.glob("kdna-*.tar.gz")) + sorted(dist.glob("kdna-*.whl"))
        if not artifacts:
            raise SystemExit("no artifacts built")
        for artifact in artifacts:
            sha256_sidecar(artifact)
            sign_artifact(artifact, secret_key, pub_key, sig_dir)
        for artifact in artifacts:
            verify(artifact, pub_key, sig_dir)
        for artifact in artifacts:
            print(f"ARTIFACT {artifact.relative_to(dist)}")
    finally:
        if os.environ.get("KDNA_PYPI_SIGNING_KEY"):
            secret_key.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
