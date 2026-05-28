/**
 * KDNA Agent SDK - pre/post judgment guardrails for AI agents.
 *
 * The SDK does not replace model judgment. It loads KDNA domain judgment as
 * system prompt context, then validates model output against local constraints.
 */
import { formatContext, loadDomainFromFiles, } from "@aikdna/kdna-core";
import * as fs from "node:fs";
import * as path from "node:path";
export class KDNAAgent {
    context;
    domainsLoaded;
    history;
    constructor(domainDir) {
        this.history = [];
        this.domainsLoaded = this.loadDomains(domainDir);
        this.context = this.domainsLoaded.map((domain) => formatContext(domain)).join("\n\n---\n\n");
    }
    systemPrompt() {
        if (!this.context) {
            return "You are an expert analyst. No KDNA domain judgment loaded.";
        }
        return `You are an expert analyst with deep domain judgment.

Use the following KDNA judgment framework to analyze all inputs. Do not ignore it.

${this.context}

When analyzing any input:
1. First classify what kind of situation this is
2. Check for common misunderstandings defined in the domain
3. Apply the relevant framework
4. Run self-checks before finalizing your answer
5. State your classification explicitly
6. Flag any banned terms if they appear in the input or your reasoning

Be concise. Focus on judgment, not description.`;
    }
    preFilter(userInput) {
        const input = String(userInput || "");
        const text = input.toLowerCase();
        const result = {
            input: input.substring(0, 200),
            banned_terms_detected: [],
            signals_detected: [],
            domain_loaded: this.domainsLoaded.length > 0,
            should_block: false,
            block_reason: null,
        };
        for (const domain of this.domainsLoaded) {
            const domainData = domain;
            const bannedTerms = domainData.patterns?.terminology?.banned_terms || [];
            for (const bannedTerm of bannedTerms) {
                const term = (bannedTerm.term || "").toLowerCase();
                if (term && text.includes(term)) {
                    result.banned_terms_detected.push({
                        term: bannedTerm.term || "",
                        replace_with: bannedTerm.replace_with || "",
                        why: bannedTerm.why || "",
                    });
                }
            }
            const scenes = domainData.scenarios?.scenes || [];
            for (const scene of scenes) {
                const signal = (scene.trigger_signal || "").toLowerCase();
                if (signal && text.includes(signal)) {
                    result.signals_detected.push({
                        name: scene.name || "",
                        orientation: scene.orientation || "",
                    });
                }
            }
        }
        return result;
    }
    postValidate(llmResponse) {
        const response = String(llmResponse || "");
        const text = response.toLowerCase();
        const result = {
            passed: true,
            self_checks_failed: [],
            banned_terms_in_response: [],
            misunderstandings_triggered: [],
            domain_loaded: this.domainsLoaded.length > 0,
        };
        for (const domain of this.domainsLoaded) {
            const domainData = domain;
            const selfChecks = domainData.patterns?.self_check || [];
            for (const selfCheck of selfChecks) {
                const check = typeof selfCheck === "string" ? selfCheck : selfCheck.check || selfCheck.question || "";
                const trigger = typeof selfCheck === "string" ? "" : selfCheck.trigger || "";
                if (trigger && !text.includes(trigger.toLowerCase())) {
                    result.self_checks_failed.push(check);
                    result.passed = false;
                }
            }
            const bannedTerms = domainData.patterns?.terminology?.banned_terms || [];
            for (const bannedTerm of bannedTerms) {
                const term = (bannedTerm.term || "").toLowerCase();
                if (term && text.includes(term)) {
                    result.banned_terms_in_response.push({
                        term: bannedTerm.term || "",
                        replace_with: bannedTerm.replace_with || "",
                    });
                    result.passed = false;
                }
            }
            const misunderstandings = domainData.patterns?.misunderstandings || [];
            for (const misunderstanding of misunderstandings) {
                const wrong = (misunderstanding.wrong || "").toLowerCase();
                if (wrong && text.includes(wrong)) {
                    result.misunderstandings_triggered.push(misunderstanding.correction || misunderstanding.key_distinction || "");
                    result.passed = false;
                }
            }
        }
        return result;
    }
    async judge(userInput, llmCallFn) {
        const safeInput = String(userInput || "");
        const preCheck = this.preFilter(safeInput);
        const systemPrompt = this.systemPrompt();
        let llmResponse = "";
        try {
            llmResponse = await llmCallFn(systemPrompt, safeInput);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "unknown error";
            llmResponse = `[LLM call failed: ${message}]`;
        }
        const postCheck = this.postValidate(llmResponse);
        const result = {
            input: safeInput.substring(0, 200),
            llm_response: llmResponse,
            pre_filter: preCheck,
            post_validate: postCheck,
            passed: postCheck.passed,
        };
        this.history.push(result);
        return result;
    }
    loadDomains(domainDir) {
        if (!fs.existsSync(domainDir)) {
            return [];
        }
        const stat = fs.statSync(domainDir);
        if (!stat.isDirectory()) {
            return [];
        }
        if (this.isDomainDirectory(domainDir)) {
            const domain = this.loadDomainDirectory(domainDir);
            return domain ? [domain] : [];
        }
        return fs
            .readdirSync(domainDir)
            .map((entry) => path.join(domainDir, entry))
            .filter((entryPath) => fs.existsSync(entryPath) && fs.statSync(entryPath).isDirectory())
            .filter((entryPath) => this.isDomainDirectory(entryPath))
            .map((entryPath) => this.loadDomainDirectory(entryPath))
            .filter((domain) => domain !== null);
    }
    isDomainDirectory(entryPath) {
        return fs.existsSync(path.join(entryPath, "kdna.json")) || fs.existsSync(path.join(entryPath, "KDNA_Core.json"));
    }
    loadDomainDirectory(entryPath) {
        const files = {
            "KDNA_Core.json": this.readJson(path.join(entryPath, "KDNA_Core.json")),
            "KDNA_Patterns.json": this.readJson(path.join(entryPath, "KDNA_Patterns.json")),
        };
        for (const optionalFile of [
            "KDNA_Scenarios.json",
            "KDNA_Cases.json",
            "KDNA_Reasoning.json",
            "KDNA_Evolution.json",
            "kdna.json",
        ]) {
            const filePath = path.join(entryPath, optionalFile);
            if (fs.existsSync(filePath)) {
                files[optionalFile] = this.readJson(filePath);
            }
        }
        return loadDomainFromFiles(files, { mode: "all" });
    }
    readJson(filePath) {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
}
