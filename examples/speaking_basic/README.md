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

## Usage

This is a legacy source example. To use it in the current Core v1 path, package
it as a `.kdna` file, validate it, plan loading, then load the compact profile:

```bash
kdna pack . ./speaking-basic.kdna
kdna validate ./speaking-basic.kdna
kdna plan-load ./speaking-basic.kdna
kdna load ./speaking-basic.kdna --profile=compact --as=prompt
```

## Status

**Legacy source example** — useful for reading the judgment shape. A packaged
`.kdna` file is the runtime artifact.

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
kdna validate ./speaking-basic.kdna
kdna plan-load ./speaking-basic.kdna
kdna load ./speaking-basic.kdna --profile=compact --as=prompt
```
