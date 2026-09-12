"""KDNA manifest/payload validation — mirrors JS Core gates.

The schemas are the authoritative JSON Schema documents from the protocol
repo. This module reuses them verbatim via jsonschema (2020-12 draft).
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

SCHEMA_DIR = Path(__file__).resolve().parent / "_schemas"


@lru_cache(maxsize=1)
def load_schemas() -> Optional[Dict[str, Any]]:
    try:
        import jsonschema  # noqa: F401
    except ImportError:
        return None
    schemas: Dict[str, Any] = {}
    if SCHEMA_DIR.is_dir():
        for schema_file in sorted(SCHEMA_DIR.glob("*.schema.json")):
            schemas[schema_file.stem] = json.loads(schema_file.read_text("utf-8"))
    return schemas or None


@lru_cache(maxsize=1)
def validators() -> Optional[Dict[str, Any]]:
    import jsonschema
    from referencing import Registry, Resource

    raw = load_schemas()
    if not raw:
        return None
    resources = {}
    for source, schema in raw.items():
        resource = Resource.from_contents(schema)
        resources[resource.id()] = resource
        resources[source] = resource
    registry = Registry()
    for uri, resource in resources.items():
        registry = registry.with_resource(uri, resource)
    validator = jsonschema.Draft202012Validator
    name_map = {
        "manifest.schema": "manifest",
        "payload-profile.schema": "payload-profile",
        "bundle-profile.schema": "bundle-profile",
        "checksums.schema": "checksums",
        "load-contract.schema": "load-contract",
    }
    return {
        key: validator(raw[source], registry=registry)
        for source, key in name_map.items() if source in raw
    }


def validate_schema(name: str, value: Any) -> List[str]:
    """Return a list of human-readable schema problems (empty when valid)."""
    pool = validators()
    if pool is None:
        return ["KDNA Core requires jsonschema for JSON-Schema validation"]
    validator = pool.get(name)
    if validator is None:
        return [f"schema {name} is not available"]
    problems = []
    for error in validator.iter_errors(value):
        problems.append(f"{name}: {error.json_path or '<root>'} {error.message}")
    return problems


def install_schemas(source_dir: str) -> None:
    """Install protocol schemas into the package (used by pack/conformance)."""
    src = Path(source_dir)
    SCHEMA_DIR.mkdir(parents=True, exist_ok=True)
    for schema_file in src.glob("*.schema.json"):
        (SCHEMA_DIR / schema_file.name).write_text(schema_file.read_text("utf-8"))
    load_schemas.cache_clear()
    validators.cache_clear()
