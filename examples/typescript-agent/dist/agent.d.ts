/**
 * Custom Agent with KDNA — TypeScript version.
 *
 * Shows how to integrate KDNA into any TypeScript agent:
 * 1. Load domain cognition
 * 2. Inject into system prompt
 * 3. Run judgment on user input
 */
export interface JudgmentResult {
    classification: string;
    missing_elements: string[];
    misunderstandings_detected: string[];
    signals_detected: string[];
    recommended_action: string;
    domain_loaded: boolean;
}
export interface HistoryEntry {
    input: string;
    signals: string[];
    result: JudgmentResult;
}
export declare class KDNAAgent {
    private domain;
    private context;
    history: HistoryEntry[];
    constructor(domainDir: string);
    systemPrompt(): string;
    analyze(userInput: string): JudgmentResult;
    private simulateJudgment;
    private recommendAction;
}
