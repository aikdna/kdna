/**
 * Custom Agent with KDNA — TypeScript version.
 *
 * Shows how to integrate KDNA into any TypeScript agent:
 * 1. Load domain cognition
 * 2. Inject into system prompt
 * 3. Run judgment on user input
 */
import { loadDomain, formatContext, classifyInput } from "@aikdna/kdna";
export class KDNAAgent {
    domain;
    context;
    history;
    constructor(domainDir) {
        this.domain = loadDomain(domainDir, { mode: "all" });
        this.context = this.domain ? formatContext(this.domain) : "";
        this.history = [];
    }
    systemPrompt() {
        return `You are an expert analyst with deep domain judgment.

Use the following domain cognition framework to analyze all inputs. Do not ignore it.

${this.context}

When analyzing any input:
1. First classify what kind of situation this is
2. Check for common misunderstandings
3. Apply the relevant framework
4. Run self-checks before finalizing your answer
5. State your classification explicitly

Be concise. Focus on judgment, not description.`;
    }
    analyze(userInput) {
        const signals = classifyInput(userInput);
        const result = this.simulateJudgment(userInput, signals);
        this.history.push({
            input: userInput,
            signals,
            result,
        });
        return result;
    }
    simulateJudgment(userInput, signals) {
        const textLower = userInput.toLowerCase();
        const unresolvedIndicators = [
            "discussed", "we should", "someone should", "let's revisit",
            "we need more", "tbd", "no owner", "no deadline",
        ];
        const hasUnresolved = unresolvedIndicators.some((ind) => textLower.includes(ind));
        const executableIndicators = [
            "owner:", "deadline:", "by ", "will do", "responsible for",
        ];
        const hasExecutable = executableIndicators.some((ind) => textLower.includes(ind));
        const conditionalIndicators = [
            "pending", "contingent on", "subject to", "if approved",
        ];
        const hasConditional = conditionalIndicators.some((ind) => textLower.includes(ind));
        let state;
        if (hasConditional && hasExecutable) {
            state = "CONDITIONAL";
        }
        else if (hasExecutable && !hasUnresolved) {
            state = "EXECUTABLE_DECISION";
        }
        else if (hasUnresolved && !hasExecutable) {
            state = "UNRESOLVED";
        }
        else {
            state = "UNRESOLVED";
        }
        const missing = [];
        if (!textLower.includes("owner") && !textLower.includes("responsible")) {
            missing.push("owner");
        }
        if (["soon", "later", "revisit", "tbd"].some((w) => textLower.includes(w))) {
            missing.push("timing");
        }
        if (textLower.includes("discussed") && !textLower.includes("decided")) {
            missing.push("explicit choice");
        }
        const misunderstandings = [];
        if (textLower.includes("agreed") || textLower.includes("on the same page")) {
            misunderstandings.push("Social agreement mistaken for commitment (MS-001)");
        }
        if (textLower.includes("action items") && missing.length > 0) {
            misunderstandings.push("Action items without owners/deadlines (MS-002)");
        }
        return {
            classification: state,
            missing_elements: missing,
            misunderstandings_detected: misunderstandings,
            signals_detected: signals,
            recommended_action: this.recommendAction(state, missing),
            domain_loaded: this.domain !== null,
        };
    }
    recommendAction(state, missing) {
        if (state === "UNRESOLVED") {
            if (missing.length > 0) {
                return `Before execution: assign ${missing.join(", ")}.`;
            }
            return "Clarify what decision needs to be made and who decides.";
        }
        if (state === "CONDITIONAL") {
            return "Track conditions. Set reminder for condition verification.";
        }
        if (state === "EXECUTABLE_DECISION") {
            return "Proceed with execution. Monitor for blockers.";
        }
        return "Review and classify.";
    }
}
