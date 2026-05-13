# Review Categories

## Severity Classification

### Blocking

Issues that must be fixed before the change can be merged.

Examples:
- Security vulnerability introduced
- Data loss risk
- Broken existing functionality
- Race condition
- Missing essential error handling
- Architecture violation that creates irreversible complexity

### Non-Blocking

Issues that should be addressed but do not prevent merging.

Examples:
- Alternative approach worth considering (but current approach is acceptable)
- Missing test for an edge case that is unlikely in practice
- Minor clarity improvement in naming
- Documentation that could be more detailed

### Nitpick

Trivial observations. The reviewer is flagging something they noticed but does not expect a change.

Examples:
- Variable name could be slightly more descriptive (but current name is fine)
- Comment phrasing could be tightened
- Minor formatting preference not covered by auto-formatter

### Question

A genuine request for clarification, not a disguised critique. The reviewer wants to understand before forming an opinion.

## Common Classification Mistakes

- Marking a style preference as blocking (it rarely is)
- Marking a real bug as a nitpick (it is blocking)
- Using "nitpick" to avoid having a difficult conversation about design
- Asking a "question" that is actually a demand for change

## Signal-to-Noise in Reviews

A review with 20 nitpicks and 1 blocking issue is worse than a review with 2 blocking issues clearly called out. The noise drowns the signal. Authors learn to scan past nitpicks and may miss the critical feedback.

Prioritize clarity over completeness. Leave fewer, better comments.
