"""Dependency-free PEP 517 backend for this pure-Python distribution.

Only the explicit source allowlist is distributable; retired source and local
test outputs cannot enter the wheel. No build-time executable hooks run.
"""
import base64
import csv
import gzip
import hashlib
import io
import pathlib
import tarfile
import tomllib
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
PROJECT = tomllib.loads((ROOT / 'pyproject.toml').read_text())['project']
NAME = PROJECT['name'].replace('-', '_')
VERSION = PROJECT['version']
DIST = f'{NAME}-{VERSION}.dist-info'


def get_requires_for_build_wheel(config_settings=None):
    return []


def get_requires_for_build_sdist(config_settings=None):
    return []


def _metadata():
    text = (f'Metadata-Version: 2.4\nName: {PROJECT["name"]}\nVersion: {VERSION}\n'
            f'Summary: {PROJECT["description"]}\nRequires-Python: {PROJECT["requires-python"]}\n'
            'License-Expression: Apache-2.0\nLicense-File: LICENSE\nLicense-File: NOTICE\n'
            'Description-Content-Type: text/markdown\n\n' + (ROOT / 'README.md').read_text())
    return {f'{DIST}/METADATA': text.encode(),
            f'{DIST}/WHEEL': b'Wheel-Version: 1.0\nGenerator: kdna-stdlib-pep517/1\nRoot-Is-Purelib: true\nTag: py3-none-any\n',
            f'{DIST}/licenses/LICENSE': (ROOT / 'LICENSE').read_bytes(),
            f'{DIST}/licenses/NOTICE': (ROOT / 'NOTICE').read_bytes()}


def _runtime_files():
    files = {}
    for path in sorted((ROOT / 'kdna').rglob('*')):
        if path.is_symlink():
            raise ValueError('Symlinks are not allowed in the distribution')
        if path.is_file() and path.suffix in ('.py', '.json'):
            files[path.relative_to(ROOT).as_posix()] = path.read_bytes()
    return files


def prepare_metadata_for_build_wheel(metadata_directory, config_settings=None):
    for relative, data in _metadata().items():
        path = pathlib.Path(metadata_directory) / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    return DIST


def build_wheel(wheel_directory, config_settings=None, metadata_directory=None):
    files = _runtime_files() | _metadata()
    rows = []
    for name, data in sorted(files.items()):
        digest = base64.urlsafe_b64encode(hashlib.sha256(data).digest()).decode().rstrip('=')
        rows.append((name, 'sha256=' + digest, str(len(data))))
    rows.append((f'{DIST}/RECORD', '', ''))
    output = io.StringIO(newline='')
    csv.writer(output, lineterminator='\n').writerows(rows)
    files[f'{DIST}/RECORD'] = output.getvalue().encode()
    name = f'{NAME}-{VERSION}-py3-none-any.whl'
    with zipfile.ZipFile(pathlib.Path(wheel_directory) / name, 'w') as archive:
        for relative, data in sorted(files.items()):
            info = zipfile.ZipInfo(relative, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data)
    return name


def build_sdist(sdist_directory, config_settings=None):
    prefix = f'{NAME}-{VERSION}'
    files = _runtime_files()
    for relative in ['pyproject.toml','README.md','LICENSE','NOTICE','build_support/backend.py','surface-disposition.json']:
        files[relative] = (ROOT / relative).read_bytes()
    for path in sorted((ROOT / 'tests').rglob('*')):
        if path.is_symlink():
            raise ValueError('Symlink in test source')
        if path.is_file() and '__pycache__' not in path.parts:
            files[path.relative_to(ROOT).as_posix()] = path.read_bytes()
    files['PKG-INFO'] = _metadata()[f'{DIST}/METADATA']
    name = prefix + '.tar.gz'
    with open(pathlib.Path(sdist_directory) / name, 'wb') as output:
        with gzip.GzipFile(filename='', fileobj=output, mode='wb', mtime=0) as compressed:
            with tarfile.open(fileobj=compressed, mode='w') as archive:
                for relative, data in sorted(files.items()):
                    info = tarfile.TarInfo(prefix + '/' + relative)
                    info.size = len(data)
                    info.mode = 0o644
                    archive.addfile(info, io.BytesIO(data))
    return name
