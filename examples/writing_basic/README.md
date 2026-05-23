# Writing Basic KDNA

A minimal KDNA domain for writing judgment. Helps AI agents apply expert writing principles: clarity over complexity, reader-first thinking, and ruthless editing.

## Core Insight

**Clarity is the writer's only obligation.** Every sentence must move the reader's understanding forward. If a sentence does not add clarity, it adds noise.

## What This Domain Covers

- **Axioms (3):** clarity-first, reader model, structure as invisible argument
- **Key Concepts:** reader_model, cognitive_load, one_idea_rule
- **Frameworks:** Inversion Check, Pyramid Structure
- **Banned Terms:** "obviously", "clearly", "in order to", "it is important to note that", "very/really/quite"
- **Misunderstandings:** complexity vs precision, editing vs proofreading, length vs authority
- **Self-Checks (4):** first-reading clarity, paragraph focus, word economy, skeptical reader test

## Install

```bash
# via npm CLI
npm i -g @aikdna/kdna
kdna install writing-basic

# via kdna-skills installer
curl -fsSL https://raw.githubusercontent.com/knowledge-dna/kdna-skills/main/install.sh | bash
```

## Usage

Load `writing_basic/KDNA_Core.json` + `writing_basic/KDNA_Patterns.json` before any writing or editing task.

## Status

**Stable** — Core + Patterns validated. Suitable for general writing judgment.

## License

CC BY 4.0

## Four Questions

### 1. What does this domain judge?

Whether a piece of writing is clear, reader-focused, and structurally coherent — or complex, self-indulgent, and disorganized. Helps AI agents apply expert editing judgment.

### 2. Where does it apply?

- Business emails and memos
- Documentation and help articles
- Blog posts and essays
- Reports and proposals

### 3. Where does it NOT apply?

- Creative fiction or poetry
- Technical specifications where precision requires jargon
- Legal contracts where ambiguity is intentional
- Personal notes or journaling

### 4. How do I use it?

```bash
kdna install github:knowledge-dna/kdna-writing_basic
kdna validate .
```
