# Cluster: example_cluster

A KDNA cluster packs multiple related domains into a single loadable unit.

## Structure

Each sub-domain is a folder inside the cluster root. Every sub-domain follows the standard 6-file KDNA structure:

```
example_cluster/
  KDNA_Cluster.json          # Cluster manifest
  sub_domain_one/
    KDNA_Core.json
    KDNA_Patterns.json
    KDNA_Scenarios.json
    KDNA_Cases.json
    KDNA_Reasoning.json
    KDNA_Evolution.json
    README.md
  sub_domain_two/
    ... (same structure)
```

## Creating a cluster

Use: `kdna cluster init <name>`

This copies `templates/cluster/` and `templates/minimal-domain/` into a new directory with one example sub-domain, ready to customize.

## Adding sub-domains

Run `kdna init <cluster>/<sub_domain>` inside the cluster root (or copy `templates/minimal-domain/`).
