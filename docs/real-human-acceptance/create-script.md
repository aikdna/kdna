# Real-Human Acceptance — Creation Script

Purpose: turn a human's real judgment material into a `.kdna` asset that passes
the five gates. This is the **creation** side of the real-human acceptance
suite. The Owner speaks or fills in the template below; the script shapes the
result into a valid asset.

Read the boundary declaration (`README.md` in this directory) before using:
assets produced here are **real-human material** and must stay isolated from
any SIMULATION output.

## 0. What you need

- A real judgment you actually use: a recurring decision where you have a
  private standard that a generic assistant would get wrong.
- A plain text editor (or just your voice if you fill the template by hand).
- The KDNA toolchain installed (`kdna validate`, `kdna pack`, `kdna inspect`).

## 1. Pre-generated question sequence (answer each out loud or in writing)

Answer these in order. Do not skip; each answer feeds one part of the asset.

1. **The situation.** What is the recurring situation where you must decide?
   (One sentence. Example: "whether to escalate a conflict at work or absorb it".)
2. **The highest question.** What single question are you really answering in
   that situation?
3. **Your default rule.** When you act, what is your default rule of thumb?
4. **The exception list.** In what cases does your rule NOT apply? (List as
   many as you can. This is your boundary set.)
5. **The failure risk.** When your rule is applied wrongly, what is the most
   likely harm? (One sentence.)
6. **The tell.** What signal tells you the rule is being misapplied in real
   time?

## 2. Draft template

Fill this in with your answers from section 1.

```text
highest_question: <answer 2>
axioms:
  - one_sentence: <answer 3>
    applies_when: [<situation keywords from answer 1>]
    does_not_apply_when: [<answer 4 items>]
    failure_risk: <answer 5>
boundaries:
  - type: scope
    text: <answer 4, first boundary>
self_checks:
  - <answer 6>
```

## 3. Produce the asset

The creation path is asset-first: build a source directory holding the
manifest (`kdna.json`) and judgment payload, validate it, then pack it into a
`.kdna` container.

1. Create a source directory named after your domain.
2. Write `kdna.json` (the manifest) with your domain, title, version, and
   `payload` pointing at your judgment file.
3. Write the judgment payload (from section 2) into the payload file.
4. Validate the source directory, then pack it:

```sh
kdna validate asset-source/          # must report overall_valid: true
kdna pack asset-source/ -o your-asset.kdna
```

You can also confirm the packaged asset with `kdna inspect your-asset.kdna`.

## 4. The five gates

A produced asset is only accepted when all five gates pass:

1. **Container** — valid ZIP with `mimetype` stored first, plus `kdna.json`,
   `payload.kdnab`, `checksums.json`.
2. **Manifest schema** — `kdna.json` conforms to the manifest schema.
3. **Payload schema** — the judgment payload conforms to the payload schema.
4. **Checksum/digest** — `checksums.json` digests match the container bytes.
5. **Load contract** — the asset plans to load now and loads into a runtime
   capsule.

`kdna validate` reports gate 1–4; gate 5 is verified by a load call (see the
consume script).

## 5. Done

You have a real-human `.kdna` produced from your actual judgment. Proceed to
the consume script for the load-and-see path.
