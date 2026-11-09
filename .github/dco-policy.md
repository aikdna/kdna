# KDNA DCO Policy

Every commit merged to main must carry a `Signed-off-by` trailer whose
normalized identity (name + email) exactly matches the commit `Author`.

For squash merges the PR body must end with:

```
Signed-off-by: <Name> <Email>
```

where `<Email>` is the GitHub noreply address (e.g. `283974009+aikdna@users.noreply.github.com`).

## Automated dependency updates

Dependabot commits are authored by `dependabot[bot]` and do not carry a
`Signed-off-by` trailer. They must not be merged directly.

A maintainer who accepts an automated update must reproduce the change in a
maintainer-authored commit signed with `git commit -s` (or a rebased equivalent)
and merge that commit instead. The original Dependabot pull request is closed as
superseded.

There is no blanket bot exemption. The DCO check fails closed until a
human-signed replacement commit exists, so that every merged change carries an
identity that can be held accountable.
