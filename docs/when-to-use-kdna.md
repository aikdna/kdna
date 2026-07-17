# When to Use KDNA

Not every judgment needs KDNA. The trigger is not “judgment versus procedure”
or “KDNA versus Skill.” Prompts, Skills, Policies, workflows, Memory, RAG, and
knowledge bases can all carry judgment.

## Use KDNA when the asset contract matters

Use KDNA when several of these are required:

- the judgment needs an identity independent from one Prompt, Skill, model, or
  application;
- exact version and byte integrity must be verified;
- loading requires authorization or task-scoped projection;
- the same asset must move across compatible runtimes;
- replacement, revocation, rollback, or consumption evidence matters;
- the judgment and the capability using it must evolve independently.

Examples include a brand judgment asset used by several writing tools, a
review standard authorized for one team but not another, or a diagnostic asset
that must be pinned and rolled back independently from the Agent Skill.

## Use the simpler carrier when it is enough

Keep judgment in a Prompt, Skill, document, Policy, Memory, or retrieval system
when its existing identity, tests, deployment, authorization, and update path
already meet the requirement.

Routine formatting may still involve judgment about safety or correctness; a
complex diagnosis may still be handled well by a tested Prompt. Task complexity
alone does not determine whether KDNA is needed.

## Boundary question

Ask:

> Does this judgment need to be managed and loaded as an independent asset, or
> is its current carrier already sufficient?

Use KDNA for the first case. Use the simpler existing mechanism for the second.
