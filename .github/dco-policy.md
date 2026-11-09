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

### GitHub Actions updates

`.github/workflows/publish.yml` may only use audited action commits.
`packages/kdna/test/publish-hardening.test.js` therefore pins the checkout,
setup-node, setup-python and upload-artifact SHAs as constants, and the test
fails when Dependabot changes a `uses:` SHA without changing those constants.
That failure is intentional: it prevents an unaudited action commit from
reaching the publish workflow.

When accepting an Actions update, verify that each new SHA belongs to the
intended upstream release tag, then update the matching constant in the same
maintainer-signed replacement commit. Do not relax the assertion or replace it
with a floating tag.
