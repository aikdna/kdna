# KDNA with OpenCode

Use an explicitly selected `.kdna` file. No global KDNA library or automatically
installed Skill is required.

```bash
npm install -g @aikdna/kdna-cli
kdna validate ./my-judgment.kdna
kdna plan-load ./my-judgment.kdna --json
kdna load ./my-judgment.kdna --profile=compact --as=prompt
```

Supply the final projection to OpenCode in the current task or through a Host
adapter. Keep the active asset identity, exact version or digest, attachment
scope, and selection reason visible outside the answer. The user must be able
to disable or replace it.

The repository also contains a `kdna-loader` Skill, but that adapter is
currently **Unassessed**. Do not treat `kdna setup`, Skill-file presence, global
asset discovery, or silent loading as evidence that OpenCode used KDNA
correctly.

See [Loader behavior](../loader-behavior.md) for the Host contract.
