# KDNA Fork Policy

KDNA is open source. Forking is a fundamental right in open source — and we welcome it for experimentation, learning, and internal use. This policy clarifies what constitutes a constructive fork versus a protocol fork that risks fragmenting the KDNA standard.

## Permitted Forks

The following fork activities are explicitly permitted and encouraged:

1. **Experimentation**: Fork to try new ideas, test alternative approaches, or prototype extensions
2. **Internal customization**: Fork to adapt KDNA tooling for your organization's internal needs
3. **Tool building**: Fork CLI, SDK, or validator code to build a new tool that works with KDNA domains
4. **Bug fixes and features**: Fork to contribute improvements back via pull request
5. **Academic research**: Fork to study, measure, or publish findings about KDNA

## Protocol Forks

We distinguish "protocol forks" — forks that replicate the KDNA standard under a different name — from constructive forks.

A **protocol fork** typically:
- Copies the KDNA file structure, schema, and validation rules
- Renames the project (e.g., YDNA, XDNA, AgentDNA)
- Claims to be an equivalent or improved standard
- May create a parallel registry, parallel domains, or parallel ecosystem
- May use KDNA's narrative framing ("domain judgment," "Human Lock," "judgment assets") as its own

Protocol forks are not prohibited, but they create fragmentation. When multiple similar "DNA" standards exist, users are confused, tool builders must choose sides, and the ecosystem weakens.

## Requirements for Public Forks

If you create a public fork of any KDNA repository, you must:

1. **Clearly identify as independent.** Your README must state:
   > This is an independent fork of KDNA. It is not affiliated with, endorsed by, or maintained by the KDNA project or AIKDNA organization. See [aikdna/kdna](https://github.com/aikdna/kdna) for the official project.

2. **Do not use KDNA Marks as primary identity.** Per [TRADEMARK.md](./TRADEMARK.md), you may reference KDNA compatibility but must not use KDNA branding as your project's primary identity.

3. **Do not claim official compatibility without following [COMPATIBILITY.md](./COMPATIBILITY.md).** Self-declared compatibility must reference the specific SPEC version and category.

4. **Do not redirect users from official KDNA resources.** Do not claim your fork is "the new KDNA," "the real KDNA," or "KDNA 2.0" without authorization.

## Domain Packages

Creating KDNA domain packages (writing-kdna, code-review-kdna, etc.) is NOT a fork. Domain packages are the primary form of ecosystem contribution we encourage. See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to publish domains.

## Rationale

KDNA's goal is to grow as a coherent open standard for domain judgment — not as a fragmented set of renamed protocols. Constructive forks strengthen the ecosystem. Protocol forks fragment it. This policy helps contributors understand which is which.

---

*This policy is maintained by the KDNA project. Changes follow the governance process in [GOVERNANCE.md](./docs/GOVERNANCE.md).*
