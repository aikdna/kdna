# App Runtime Contract Examples

These examples show how different KDNA-compatible apps can produce different
evidence while sharing the same runtime contract.

They are not product fixtures. They are contract fixtures, showing:

- A client app that uses KDNA during a conversation
- An authoring tool that creates and exports a governed domain asset
- A workbench that applies KDNA inside an agent work session

Each pair contains:

- `*-trace.json`: machine-readable judgment trace
- `*-report.json`: human-readable report projection

Run:

```bash
npm run validate:runtime-contract
```

The validator checks the examples for the shared route, trace, report, and
trace/report consistency fields that apps must preserve.
