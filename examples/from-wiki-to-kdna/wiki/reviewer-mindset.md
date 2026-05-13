# Reviewer Mindset

## The Right Attitude

### Be a collaborator, not a gatekeeper

Code review is a collaborative practice, not a checkpoint. The goal is to improve the code and the team, not to prove the reviewer is smarter or more careful.

### Speed matters

A review that sits for two days and then comes back with detailed feedback has already harmed the team. Quick, directional feedback is better than slow, thorough feedback. Aim to review within one working day.

### Praise what is good

Reviews that only identify problems create a negative feedback loop. Explicitly acknowledge good design decisions, clean code, and well-written tests. This teaches the team what "good" looks like.

## Common Reviewer Pitfalls

### The perfection trap

Insisting that every line be rewritten to the reviewer's personal preference. This slows velocity and demoralizes authors. The standard is "good enough to ship safely," not "exactly how I would write it."

### The ego review

Using the review to demonstrate expertise rather than improve the change. Characterized by long explanations of tangential topics, one-upmanship, and correcting non-issues.

### The rubber stamp

Approving changes without reading them carefully. Just as harmful as the perfection trap. Creates a false sense of safety.

### The style crusade

Treating personal formatting preferences as quality standards. If a style rule is important, encode it in a linter. Don't make humans enforce it.

## The Review Cycle

1. Author submits change with context (what problem, what approach, what tradeoffs)
2. Reviewer reads for intent first, code second
3. Reviewer classifies feedback as blocking / non-blocking / nitpick / question
4. Author addresses blocking feedback and responds to questions
5. Reviewer verifies changes and approves or requests another round

## When to Escalate

If the review conversation becomes circular, personal, or unproductive after two rounds, move to a synchronous conversation (call, meeting, pair programming). Do not continue the async review indefinitely.
