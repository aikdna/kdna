# Real-Human Acceptance — Consumption Script

Purpose: the real-human consumption path — from getting a `.kdna` asset to
seeing the judgment take effect in a real task. Each step lists the expected
screens so the Owner can check "yes, that is what I saw".

This is the **consume** side of the real-human acceptance suite. It consumes
the asset produced by the create script (or any real-human asset). Read the
boundary declaration in `README.md` before use.

## 0. Setup

- The KDNA CLI is installed and on `PATH`.
- You have a real task you are about to do, in which the asset's judgment
  applies.
- You have the `.kdna` asset path ready.

## 1. Get the asset

Place the `.kdna` file where your consumer can reach it, or attach it to your
workspace.

- **Expected screens:** the file is visible in your file manager / workspace
  file list as a normal file. No server upload happens.

## 2. Inspect before loading

```sh
kdna inspect your-asset.kdna
```

- **Expected screens:** domain, title, version, and load profiles are listed.
  If it shows an error instead, stop — the asset is malformed (fail-closed).

## 3. Authorize the load

Ask the consumer to plan the load and then approve it.

```sh
kdna plan-load your-asset.kdna
kdna load your-asset.kdna
```

- **Expected screens:** `plan-load` returns a load plan (asset identity,
  profile, budget) that Core authorizes; `load` loads only when Core authorizes
  it. The plan names the exact asset; nothing is loaded before approval.

## 4. See the judgment take effect in a real task

Now open the real task and ask your assistant / the consumer to apply the
asset's judgment frame. Describe the situation from your step-1 answer.

- **Expected screens:** the assistant's output reflects your rule — it uses
  your highest question, respects your boundaries, and flags your failure risk
  when the rule does not apply. You recognise the reasoning as yours.

## 5. Fail-closed check (optional but recommended)

Try loading a corrupted copy of the asset (flip a byte).

- **Expected screens:** the load is rejected with a stable error code. It is
  never silently accepted as "valid".

## 6. Done

You saw the judgment take effect in a real task. Record the observed vs
expected in the acceptance verdict table.
