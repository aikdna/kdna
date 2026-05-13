# Code Review Fundamentals

## What is code review?

Code review is the systematic inspection of code changes by peers before they are merged. Its primary purpose is to catch defects, enforce standards, share knowledge, and build shared ownership of the codebase.

## Core Principles

### Safety over style

The highest-priority review concerns are correctness, security, and maintainability. Style issues matter, but they are secondary. A review that finds only formatting problems has not done its job.

### Review the intent, not just the code

Every code change is a solution to a problem. If the reviewer does not understand the problem being solved, they cannot assess whether the solution is appropriate. Always start by understanding the intent.

### Assume good faith

The author wrote the code for a reason. Approach the review with curiosity, not judgment. Ask "what led to this approach?" before suggesting alternatives.

### Distinguish blocking from non-blocking

Not all feedback should prevent merging. Be explicit about which issues are blocking (must fix before merge) and which are non-blocking (suggestions, questions, nitpicks).

## Review Scope

A code review should cover:

- **Correctness** — Does the code do what it claims to do?
- **Security** — Are there vulnerability risks?
- **Performance** — Are there obvious bottlenecks?
- **Maintainability** — Will future developers understand this?
- **Testing** — Are the right things tested?
- **Architecture** — Does this fit the system's design?

## Output

A good review produces:

1. A clear blocking/non-blocking classification for each comment
2. Specific, actionable feedback (not "this is bad")
3. Questions that clarify intent, not interrogations
4. A clear merge decision
