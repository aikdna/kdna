# App Runtime Contract Examples

These examples show how different KDNA products can produce different evidence while sharing the same runtime contract.

They are not product fixtures. They are contract fixtures:

- KDNAChat uses KDNA during a conversation.
- KDNA Studio creates and exports a governed domain asset.
- KDNAWork applies KDNA inside an agent work session.

Each pair contains:

- `*-trace.json`: machine-readable judgment trace
- `*-report.json`: human-readable report projection

Run:

```bash
npm run validate:runtime-contract
```

The validator checks the examples for the shared route, trace, report, and trace/report consistency fields that apps must preserve.
