# skills/

> **The actual SKILL.md files live in [kdna-skills](https://github.com/knowledge-dna/kdna-skills).**

This directory exists to give the CLI's `ensureLoaderSkill` a recognizable
search path during development, but the **source of truth** for any
`SKILL.md` is the `kdna-skills` repository.

## Why single-source

Before v0.7.4 the CLI had two sources: (1) `KDNA/skills/*` shipped inside
the npm package and (2) `kdna-skills/main` fetched at install time. The two
drifted, and the local-source-preferred fallback overwrote already-updated
agent skill files with stale copies.

v0.7.4+ resolves this:

- `ensureLoaderSkill()` in `src/install.js` fetches from
  `https://raw.githubusercontent.com/knowledge-dna/kdna-skills/main/<skill>/SKILL.md`
  by default.
- The local search path is kept for offline development only and is empty
  in the published npm tarball.

## Editing skills

Edit them in the `kdna-skills` repo. After merge to `main`, users get the
update the next time they run `kdna install <anything>` — `ensureLoaderSkill`
detects the v2.1 marker and re-installs if outdated.
