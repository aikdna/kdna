# KDNA Commercial License 1.0 (KCL-1.0)

Copyright (c) 2026 AIKDNA

## 1. Definitions

- **KDNA Asset**: A structured domain judgment package (`.kdna` file, `.kdnapack` package, or runtime-projected domain) containing axioms, frameworks, boundaries, risk models, self-checks, and related judgment artifacts.
- **Licensor**: The creator or rights holder of the KDNA Asset.
- **Licensee**: The individual or organization that obtains a license to use the KDNA Asset.
- **Agent**: An AI system, language model, or software agent that loads and applies KDNA Assets to inform its judgment, output, or behavior.
- **Agent Use**: Loading a KDNA Asset into an Agent to influence its judgment or output for the Licensee's own tasks.
- **Runtime Projection**: Accessing KDNA judgment through a remote API that projects domain rules into the Agent's context without exposing the full KDNA content.

## 2. License Grant

Subject to the Licensee's compliance with this license and any applicable purchase or subscription terms, the Licensor grants the Licensee a **non-exclusive, non-transferable, revocable** right to:

1. **Load** the KDNA Asset into an Agent for the Licensee's own internal use.
2. **Use** the Agent's KDNA-informed output in the Licensee's work, projects, and deliverables.
3. **Receive updates** to the KDNA Asset during the active license period.

## 3. Prohibitions

The Licensee MUST NOT:

1. **Redistribute** the KDNA Asset or any substantial portion thereof to any third party, whether modified or unmodified.
2. **Reverse engineer** the KDNA Asset to extract, summarize, or reconstruct its judgment structure, axioms, frameworks, boundaries, risk models, or decision logic for the purpose of creating a substitute or derivative judgment asset.
3. **Generate substitute KDNA** by prompting an AI model to extract, summarize, or reproduce the KDNA Asset's rules and patterns.
4. **Use for model training** — the KDNA Asset content and Agent outputs substantially informed by it must not be used to train, fine-tune, or improve any AI model, unless a separate Model Training License is obtained.
5. **Embed in commercial products** — the KDNA Asset must not be embedded in any SaaS, API, or product that exposes KDNA-informed judgment to third parties without an Enterprise License.
6. **Bypass Runtime protections** — for KDNA Assets using `runtime` access mode, the Licensee must not attempt to access the full content, reconstruct it from projections, or circumvent technical access controls.

## 4. License Types

| Type | Users | Agents | Period | Model |
|------|-------|--------|--------|-------|
| Personal | 1 individual | Up to 3 Agents | Perpetual or annual | One-time / subscription |
| Team | Up to 10 individuals | Unlimited (within team) | Annual | Per-seat subscription |
| Enterprise | Unlimited (organization) | Unlimited | Annual | Custom pricing |
| Runtime API | Per-call | Per projection | Usage-based | Per 1,000 calls |

## 5. Attribution

For KDNA Assets where the Licensor requires attribution, the Licensee must retain the attribution notice specified in the Asset's metadata. Attribution requirements, if any, are declared in the Asset's manifest (`kdna.json` or `.kdna` file).

## 6. Updates and Versioning

1. The Licensee is entitled to updates released during the active license period.
2. The Licensor may publish new major versions that require a separate license.
3. The Licensor will maintain a changelog documenting judgment changes between versions.
4. The Licensee may continue using the version(s) obtained during the license period after license expiration, unless the license terms specify otherwise.

## 7. Termination

The license may be terminated:
- By the Licensee: cease use and delete all copies of the KDNA Asset.
- By the Licensor: if the Licensee violates any term of this license.
- Automatically: at the end of a time-limited license period, unless renewal terms apply.

Upon termination, the Licensee must delete all copies of the KDNA Asset from all systems and Agents. The obligation to cease Agent Use applies immediately; the Licensee may retain outputs previously generated under a valid license.

## 8. No Warranty

THE KDNA ASSET IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. THE LICENSOR DOES NOT GUARANTEE THAT THE KDNA ASSET WILL PRODUCE CORRECT, APPROPRIATE, OR SAFE AGENT BEHAVIOR.

## 9. Limitation of Liability

IN NO EVENT SHALL THE LICENSOR BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY ARISING FROM THE USE OR INABILITY TO USE THE KDNA ASSET, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. THE LICENSEE ASSUMES ALL RESPONSIBILITY FOR THE OUTPUTS AND ACTIONS OF AGENTS INFORMED BY THE KDNA ASSET.

## 10. Governing Law

This license is governed by the laws of the jurisdiction specified in the purchase agreement, or if none is specified, by the laws applicable to the Licensor's principal place of business.

---

**Canonical URL**: https://aikdna.com/licenses/KCL-1.0
**Version**: 1.0
**Status**: Canonical
