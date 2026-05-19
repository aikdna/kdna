# KDNA Create Skill

Use this skill when a user wants to create, download, or import a KDNA domain package.

KDNA is a structured format for encoding domain cognition. This skill handles all paths for obtaining or creating KDNA files.

## Paths to Obtain KDNA

| Path | Use when |
|---|---|
| **Create from conversation** | User has expertise and wants to encode it as KDNA |
| **Download from registry** | User wants an existing domain from the official registry |
| **Import from URL** | User found a KDNA package on GitHub or elsewhere |
| **Create from template** | User wants a blank scaffold to fill manually |

## Workflow 1: Create from Conversation

When the user wants to encode their expertise into KDNA, guide them through domain extraction. **These steps are a guide, not a fixed script. Adapt order and depth to the user's responses.** Skip steps the user covers naturally. Probe deeper on steps they struggle with.

### Step 1: Define the Domain

Ask the user:
- What domain is this for? Name it in `snake_case` (e.g., `cybersecurity`, `real_estate`).
- What is the one-sentence purpose? "This domain helps an AI agent judge ___ so that ___."
- What does this domain NOT cover? Define the boundary.

### Step 2: Extract Axioms (2-4)

For each axiom, ask:
- What is the irreducible core truth of this domain?
- What does a beginner always get wrong that an expert never does?
- If you could only teach one principle, what would it be?

Each axiom needs: `id`, `one_sentence`, `full_statement`, `why`.

### Step 3: Define Concepts (2-5)

For each concept, ask:
- What is the concept called?
- What does it really mean (essence)?
- What is it often confused with (boundary)?
- When should the agent notice this concept is relevant (trigger_signal)?

### Step 4: Define Frameworks (1-3)

For each framework, ask:
- What is the structured approach the expert uses?
- When should it be applied?
- What are the concrete steps?

### Step 5: Define Core Structure

Ask: "What is the journey from surface problem to deeper cause to resolution?"
- `from`: The surface symptom
- `to`: The deeper understanding or resolution
- `via`: The diagnostic path

### Step 6: Define Stances (1-3)

Ask: "What is the default position on controversial issues in this domain? What does this domain reject?"

### Step 7: Terminology and Banned Terms

Ask:
- What terms should the agent prefer?
- What terms are commonly used but misleading? What should replace them?

### Step 8: Misunderstandings (2-4)

Ask:
- What do novices consistently get wrong?
- What is the wrong interpretation?
- What is the correct interpretation?
- What is the key distinction?

### Step 9: Self-Checks (2-4)

Create yes/no questions the agent can use to verify its output respects the domain.

### Step 10: Write, Validate, and Package

1. Write `KDNA_Core.json` and `KDNA_Patterns.json`.
2. Check that every field in the [KDNA spec](https://github.com/knowledge-dna/KDNA/blob/main/SPEC.md) is populated.
3. Check that `id` fields are unique.
4. Check that every banned term has `why` and `replace_with`.
5. Check that every misunderstanding has `key_distinction`.
6. Write the files to the user's KDNA data directory (e.g., `~/.codex/Kdna/<domain>/`).
7. Generate the `kdna.json` manifest with: `kdna pack <domain-directory>`
8. Run full validation with: `kdna validate <domain-directory>`

### Key Principle

**Do not write all six files at once.** Start with Core + Patterns. Only add Scenarios, Cases, Reasoning, or Evolution when usage reveals what's missing.

## Workflow 2: Download from Official Registry

1. Fetch the registry: `https://raw.githubusercontent.com/knowledge-dna/KDNA/main/registry/domains.json`
2. Find the domain matching the user's request (by `id`, `name`, or `description`).
3. Get the `repo` URL from the registry entry.
4. Clone or download the repository files.
5. Copy the KDNA JSON files to `~/.kdna/<domain>/` (the unified KDNA root shared by all Agents). If your Agent expects a different path, create a symlink: `ln -s ~/.kdna ~/.claude/Kdna`.
6. Validate: ensure `KDNA_Core.json` and `KDNA_Patterns.json` exist and parse as valid JSON.
7. Optionally add the domain to the user's local `registry.json`.

Available domains in the official registry include: business-growth, communication, sales, management, product-decision.

## Workflow 3: Import from URL

When the user provides a URL to a KDNA package:

1. Determine the source type:
   - GitHub repo: clone with `git clone <url>`
   - Raw JSON files: download with curl
   - Zip/tarball: download and extract
2. Detect KDNA files in the source. A valid KDNA package must contain at least `KDNA_Core.json` and `KDNA_Patterns.json`.
3. Read the `meta.domain` field from `KDNA_Core.json` to determine the domain name.
4. Validate structural completeness: required fields present, IDs unique, banned terms have replacements, misunderstandings have distinctions.
5. Report any issues to the user before installing.
6. Copy to the KDNA data directory: `<agent-kdna-root>/<domain_name>/`
7. Ask if the user wants to add this domain to their local `registry.json`.

If the source does not contain valid KDNA files, tell the user what's missing and suggest using Workflow 1 to create the domain instead.

## Workflow 4: Create from Template

1. Copy the minimal template from `https://raw.githubusercontent.com/knowledge-dna/KDNA/main/templates/minimal-domain/`.
2. Ask the user for the domain name.
3. Rename the files and update the `meta.domain` and `meta.created` fields.
4. Give the user a checklist of sections to fill in (axioms, ontology, frameworks, etc.).
5. Remind the user: start small. 2-3 axioms, 2-3 concepts, 2-3 misunderstandings is enough.
6. After the user fills sections, validate and save.

## File Output Convention

All KDNA files use lowercase `snake_case` for the domain folder name:

```
~/.codex/Kdna/cybersecurity/
├── KDNA_Core.json
├── KDNA_Patterns.json
├── KDNA_Scenarios.json    (optional)
├── KDNA_Cases.json         (optional)
├── KDNA_Reasoning.json     (optional)
└── KDNA_Evolution.json     (optional)
```

## Validation Checklist

Before saving, verify:
- [ ] `meta` object present with `version`, `domain`, `created`, `purpose`, `load_condition`
- [ ] `KDNA_Core.json` has: `axioms`, `ontology`, `frameworks`, `core_structure`, `stances`
- [ ] `KDNA_Patterns.json` has: `terminology`, `misunderstandings`, `self_check`
- [ ] All IDs are unique within the domain
- [ ] Every axiom has `one_sentence`, `full_statement`, `why`
- [ ] Every banned term has `why` and `replace_with`
- [ ] Every misunderstanding has `wrong`, `correct`, `key_distinction`, `why`
- [ ] Self-check items are yes/no answerable
- [ ] All JSON files parse without errors

For full automated validation, use: `kdna validate <domain_path>` or `npx kdna-lint <domain_path>`

## Reference

- [KDNA Specification](https://github.com/knowledge-dna/KDNA/blob/main/SPEC.md)
- [.kdna File Format Spec](https://github.com/knowledge-dna/KDNA/blob/main/specs/kdna-file-format.md)
- [.kdnapack Package Format Spec](https://github.com/knowledge-dna/KDNA/blob/main/specs/kdna-package-format.md)
- [Minimal Template](https://github.com/knowledge-dna/KDNA/tree/main/templates/minimal-domain)
- [Official Registry](https://github.com/knowledge-dna/KDNA/blob/main/registry/domains.json)
- [Getting Started Guide](https://github.com/knowledge-dna/KDNA/blob/main/docs/getting-started.md)
