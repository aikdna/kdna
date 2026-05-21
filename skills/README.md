# skills/

> **Source of truth:** [kdna-skills](https://github.com/aikdna/kdna-skills) repository.
> The copy in this directory is an **offline fallback** for `kdna setup`
> when GitHub is unreachable. It is kept in sync via release CI.

## Why ship a fallback copy

`kdna setup` (and `ensureLoaderSkill` inside `kdna install`) tries to
fetch the latest SKILL.md from
`https://raw.githubusercontent.com/aikdna/kdna-skills/main/kdna-loader/SKILL.md`.

If the network is unavailable (corporate firewall, offline laptop, etc.)
the npm package's bundled copy is used. This ensures `npm install -g
@aikdna/kdna && kdna setup` works in **any** environment.

## Single source enforcement

To prevent drift (the v0.7.4 incident where the local copy lagged
behind kdna-skills and overwrote agent installs with stale content):

- The remote `kdna-skills` repo is checked **first**.
- The local bundled copy is only used as a fallback.
- `ensureLoaderSkill()` detects v2.1 marker and re-installs if outdated.

## Editing skills

Edit them in `kdna-skills`. Bundled copy here is auto-refreshed on
KDNA release; do NOT edit it directly.

