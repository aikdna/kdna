# Cluster: example_cluster

A KDNA cluster project view groups multiple related domains before packaging.
The public runtime asset is the exported `.kdna` container, not this folder.

## Structure

Each sub-domain is a folder inside the cluster root. Every sub-domain follows
the expanded project-view structure:

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

Copy `templates/minimal-domain/` into the cluster root and rename the folder
for the new sub-domain. Export and validate a packaged `.kdna` before using it
as runtime input.
