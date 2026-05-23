# Speaking Basic KDNA

A minimal KDNA domain for speaking and presentation judgment. Helps AI agents apply expert presentation principles: audience focus, single-message structure, and delivery discipline.

## Core Insight

**The audience's takeaway is the only measure of success.** If the speaker feels good but the audience remembers nothing, the talk failed.

## What This Domain Covers

- **Axioms (3):** audience-first, one talk one message, structure before slides
- **Key Concepts:** audience_takeaway, cognitive_opening, signal_to_noise
- **Frameworks:** Hook-Line-Sinker, Slide Test
- **Banned Terms:** "I'll try to keep this short", "as you can see", "basically/essentially/just", "sorry/I'm not an expert but"
- **Misunderstandings:** slides vs argument, nervousness vs preparation, coverage vs retention
- **Self-Checks (4):** one-sentence message, 60-second hook, signal-to-noise, single takeaway recall

## Install

```bash
npm i -g @aikdna/kdna
kdna install speaking-basic
```

## Usage

Load `speaking_basic/KDNA_Core.json` + `speaking_basic/KDNA_Patterns.json` before preparing any talk, presentation, or pitch.

## Status

**Stable** — Core + Patterns validated. Suitable for general presentation judgment.

## License

CC BY 4.0

## Four Questions

### 1. What does this domain judge?

Whether a talk, presentation, or speech is audience-focused, single-messaged, and structurally sound — or speaker-focused, scattered, and disorganized.

### 2. Where does it apply?

- Preparing conference talks or keynotes
- Team presentations and status updates
- Pitch decks and investor presentations
- Training sessions and workshops

### 3. Where does it NOT apply?

- Written reports or documents
- Impromptu social conversation
- Podcast or interview formats
- Creative performance (theater, comedy)

### 4. How do I use it?

```bash
kdna install github:aikdna/kdna-speaking_basic
kdna validate .
```
