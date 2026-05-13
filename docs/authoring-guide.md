# KDNA Authoring Guide

## 1. Start Narrow

Do not try to encode an entire profession at once.

Bad: `leadership`  
Better: `frontline_team_feedback`

## 2. Write the Domain Sentence

Template:

```text
This domain helps an AI agent judge ______ so that ______.
```

## 3. Extract Axioms

Axioms should be few, strong, and hard to compress. A good axiom is not a slogan. It should change how the agent responds.

## 4. Define Boundaries

Every important concept needs a boundary. Without boundaries, concepts become decorative words.

## 5. Capture Misunderstandings

Misunderstandings are usually more useful than definitions.

For each misunderstanding, write:

- wrong interpretation
- correct interpretation
- key distinction
- why the distinction matters

## 6. Prefer Signals Over Abstract Labels

A trigger signal should be observable.

Bad: `When the user is defensive.`

Better: `When the user repeatedly justifies themselves, quotes the other person as unreasonable, or asks for a sentence that proves they are right.`

## 7. Add so_what

Every reasoning chain must end with practical consequence. Without `so_what`, reasoning becomes commentary.

## 8. Test Behaviorally

Compare two agent responses: without KDNA and with KDNA loaded. If the difference is only vocabulary, revise the KDNA.
