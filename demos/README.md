# KDNA Demos

The previous answer-comparison demos were withdrawn. They mixed fabricated or
retired assets, Agent-specific Skill behavior, and subjective output changes,
so they were not valid current product evidence.

Use the maintained technical quick start instead:

```bash
kdna demo judgment ./judgment
kdna pack ./judgment ./judgment.kdna
kdna validate ./judgment.kdna
kdna plan-load ./judgment.kdna --json
kdna load ./judgment.kdna --profile=compact --as=json
```

Future Host demonstrations must use an exact frozen asset, explicit user
attachment, visible active state, and reproducible Host coordinates. Technical
delivery, adoption, external assessment, and real outcome must remain separate.
