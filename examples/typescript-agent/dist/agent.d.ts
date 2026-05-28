/**
 * KDNA Agent SDK - pre/post judgment guardrails for AI agents.
 *
 * The SDK does not replace model judgment. It loads KDNA domain judgment as
 * system prompt context, then validates model output against local constraints.
 */
export interface PreFilterResult {
    input: string;
    banned_terms_detected: Array<{
        term: string;
        replace_with: string;
        why: string;
    }>;
    signals_detected: Array<{
        name: string;
        orientation: string;
    }>;
    domain_loaded: boolean;
    should_block: boolean;
    block_reason: string | null;
}
export interface PostValidateResult {
    passed: boolean;
    self_checks_failed: string[];
    banned_terms_in_response: Array<{
        term: string;
        replace_with: string;
    }>;
    misunderstandings_triggered: string[];
    domain_loaded: boolean;
}
export interface JudgmentResult {
    input: string;
    llm_response: string;
    pre_filter: PreFilterResult;
    post_validate: PostValidateResult;
    passed: boolean;
}
export interface HistoryEntry extends JudgmentResult {
}
export declare class KDNAAgent {
    private context;
    private domainsLoaded;
    history: JudgmentResult[];
    constructor(domainDir: string);
    systemPrompt(): string;
    preFilter(userInput: string): PreFilterResult;
    postValidate(llmResponse: string): PostValidateResult;
    judge(userInput: string, llmCallFn: (systemPrompt: string, userInput: string) => Promise<string>): Promise<JudgmentResult>;
    private loadDomains;
    private isDomainDirectory;
    private loadDomainDirectory;
    private readJson;
}
