# KDNA Python Core and Read — aikdna 0.8.0rc2

A Python implementation of the pinned public Core and Read contracts using only the standard library. Python 3.11 or later is declared; this material-reference repair is checked with CPython 3.12.13 on macOS arm64; prior release observations remain under their original scope. Other Python versions and platforms require separate verification. This is an unpublished local candidate; implementation checks do not establish independent acceptance or registry availability.

## Core admission

```python
from kdna import admit_file, inspect_snapshot, component_semantics_contract

result = admit_file("asset.kdna")
if result["status"] == "accepted":
    view = inspect_snapshot(result["snapshot"])
else:
    print(result["reason"], result["diagnostics"])

print(component_semantics_contract())
```

`admit_bytes(bytes)` captures bytes and performs the same bounded admission. `version_tuple()` returns the pinned tuple. Snapshots are opaque and process-local; `inspect_snapshot` returns a defensive copy. Keep the snapshot object alive while using it. Serialized objects cannot recreate snapshot authority.

The public contract tuple is Core 0.3.0, Canonical IR 0.2.0 and Read 0.2.0. Container and Payload remain 0.2.0; A/C/E/P digest profiles are unchanged. Exact reference package and semantic source pins are in `kdna/public-contract-binding.json`.

## Finite component interpretation

`component_semantics_contract()` returns a defensive copy of the fixed public definition, profile and carrier descriptor. Explicit taxonomy, candidate-set and discriminator-set content is interpreted under that definition. Method IR values contain `declaration`, `declaration_presence` and `component_interpretations`. Missing authored arrays remain distinct from declared empty arrays. Content without an opt-in declaration stays undeclared.

Known critical carriers are accepted only in their prescribed typed extension locations. Unknown critical extensions block interpretation. Contents of an opaque extension value are not recursively treated as extensions. Component failures expose the public diagnostic, nullable judgment/component references and no interpreted body, with Core valid and interpretation blocked; structural invalidity remains distinct.

Static adoption fields and recomputable digests establish consistency only. They do not restore a live creation context, authenticate an editor or authorize an action.

Material references remain optional for statement-bearing materials. A present `resource_ref` must resolve to an actual resource; its entry and digest are still validated. Referenced materials and sources enter the complete IR/Read closure without inserting absent fields.

## Read embedding

Import `admit_read_request`, `project`, `read_file`, `read_bytes`, `read_snapshot`, `create_trusted_control_provider` and `create_trusted_host_provider` from `kdna.read`. Read operations are async. Providers are explicit trusted embedding boundaries and must not be constructed from untrusted request data.

The control callback returns `admission_response_limit_bytes`. The Host observer receives `{request, snapshot}` and returns the public Host decision with snapshot/digest identity, scope, request/decision IDs, policy and bounded timing. Scope and current policy are observed again before disclosure. The optional delivery callback confirms transport only by returning exactly `True`. Expansion requires the original live snapshot and issuing Host provider; reopening a file creates a different snapshot. Projection alone does not grant reading permission.

## Build and verify

```sh
python -m unittest discover -s tests -p 'test_*.py' -v
python -m pip wheel --no-build-isolation --no-deps --wheel-dir dist .
python -m pip install --no-index --no-deps dist/aikdna-0.8.0rc2-py3-none-any.whl
```

The in-tree PEP 517 backend uses only the standard library. Wheels contain current `kdna` runtime source, generated JSON, metadata and licenses. Source distributions also include the backend and current tests. Retired sources and local caches are excluded. Tests cover real containers, Node reference observations, canonical numbers, component boundaries and Host/handle/budget/delivery scenarios; they do not authenticate real editors or production Host identities.

## Authority limits

Core admission establishes technical validity, not content quality, authorship, Creation acceptance, reading permission or action authorization. Encrypted, signed and checksum-bearing containers remain capability-unavailable where the reference Core rejects them. Plan admission and execution remain unavailable. There is no legacy loader, raw-payload fallback, automatic migration or action executor. Historical files under `retired/` are excluded from distribution; documentation outside this README remains historical.
