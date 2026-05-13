# KDNA vs Skills

KDNA and Skills are complementary.

A Skill tells an agent how to perform a task: create a slide deck, analyze a spreadsheet, call an API, generate a PDF, edit an image, or summarize a contract.

KDNA tells an agent how to think inside a domain: how a communication coach defines conflict repair, how a negotiation expert distinguishes leverage from pressure, or how a leadership advisor recognizes responsibility diffusion.

## Relationship

A Skill may load KDNA before acting.

Example:

```text
User asks for a conflict repair message.

Skill:
1. Load communication KDNA Core + Patterns.
2. Load Scenarios because the user described a situation.
3. Use the KDNA to choose posture and avoid traps.
4. Draft the message.
```

The Skill performs the workflow. KDNA supplies the judgment.
