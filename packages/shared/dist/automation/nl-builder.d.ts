/**
 * Natural Language Automation Builder
 *
 * Translates natural language policy descriptions into structured AutomationRule JSON
 * with compliance control mapping preview. This is the core of the "describe a policy,
 * get compliance-mapped automation" demo flow.
 *
 * Uses Groq (qwen3-32b) to interpret intent and map to the AtlasIT automation schema.
 * Falls back through the AI provider chain if Groq is unavailable.
 *
 * Example input:  "When someone leaves the Engineering team, revoke their GitHub and AWS access"
 * Example output: AutomationRule with trigger=user_left_group, actions=[revoke_app_access x2],
 *                 plus compliance preview showing SOC2 CC6.1, CC6.3, ISO27001 A.9.2.6 coverage
 */
import type { ActionType, CreateRuleInput } from "./types";
export interface NLBuildRequest {
    prompt: string;
    /** Optional: tenant's connected apps for context */
    connectedApps?: string[];
    /** Optional: tenant's directory groups for context */
    directoryGroups?: string[];
}
export interface NLBuildResult {
    rule: CreateRuleInput;
    compliancePreview: CompliancePreview[];
    confidence: number;
    reasoning: string;
    /** Original prompt echoed back */
    prompt: string;
}
export interface CompliancePreview {
    framework: string;
    controlId: string;
    controlName: string;
    evidenceType: string;
    /** Which action in the rule triggers this control */
    fromAction: ActionType;
}
/**
 * Translate a natural language policy description into a structured automation rule
 * with compliance control mapping preview.
 */
export declare function buildAutomationFromNL(env: Record<string, unknown>, req: NLBuildRequest): Promise<NLBuildResult>;
//# sourceMappingURL=nl-builder.d.ts.map