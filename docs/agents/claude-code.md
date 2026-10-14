# KDNA with Claude Code

> This page documents the earlier loading workflow at its last supporting published versions:
> Runtime CLI **0.36.1** and Studio CLI **0.11.0**. The commands below need those exact versions.
> The current published stable line is Runtime CLI **0.40.1** (exact Core `0.37.4` / Read `0.12.1`)
> with Studio CLI **0.13.0**; the current implementation rejects these older inputs and does not
> support this loading or project/card workflow. Its `inspect` and `validate` commands have a
> different contract. For a current asset start with
> [Core/Read](../core-read-current-status.md) and [Studio](https://github.com/aikdna/kdna-studio-cli#readme),
> or `npm install -g @aikdna/kdna-cli@0.40.1` and follow the current entry guide.

Use an explicitly selected `.kdna` file. No global KDNA library or automatically
installed Skill is required.

```bash
npm install -g @aikdna/kdna-cli@0.36.1
kdna validate ./my-judgment.kdna
kdna plan-load ./my-judgment.kdna --json
kdna load ./my-judgment.kdna --profile=compact --as=prompt
```

Supply the final projection to Claude Code in the current task or through a
Host adapter. Keep the active asset identity, exact version or digest,
attachment scope, and selection reason visible outside the answer. The user
must be able to disable or replace it.

Current Skill and MCP source lives in
[kdna-skills](https://github.com/aikdna/kdna-skills#readme) and uses its own
public Core/Read graph. Native Host delivery and semantic adoption remain
unassessed. The manual Capsule example above retains its published CLI version;
it is not a legacy fallback in the current adapter. `kdna setup`, Skill-file
presence, discovery and silent loading do not prove that Claude Code used KDNA
correctly.

See [Loader behavior](../loader-behavior.md) for the Host contract.
