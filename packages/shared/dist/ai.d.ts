import { Logger } from "./logger";
export interface AIMessage {
    role: "system" | "user" | "assistant";
    content: string;
}
export interface AIOptions {
    provider?: "cloudflare" | "together" | "openai";
    model?: string;
    maxTokens?: number;
    temperature?: number;
    deterministic?: boolean;
    fallbackProviders?: ("cloudflare" | "together" | "openai")[];
}
export interface AIProvider {
    generate(messages: AIMessage[], opts?: AIOptions): Promise<string>;
}
export declare class CloudflareAIProvider implements AIProvider {
    private readonly token;
    private readonly logger;
    constructor(token: string | undefined, logger?: Logger);
    generate(messages: AIMessage[], opts?: AIOptions): Promise<string>;
}
export declare class TogetherAIProvider implements AIProvider {
    private readonly apiKey;
    private readonly logger;
    constructor(apiKey: string, logger?: Logger);
    generate(messages: AIMessage[], opts?: AIOptions): Promise<string>;
}
export declare class OpenAIAIProvider implements AIProvider {
    private readonly apiKey;
    private readonly logger;
    constructor(apiKey: string, logger?: Logger);
    generate(messages: AIMessage[], opts?: AIOptions): Promise<string>;
}
export declare function createAIProvider(env: Record<string, any>, providerName?: string): AIProvider;
export declare function generateAI(messages: AIMessage[], env: Record<string, any>, _opts?: AIOptions): Promise<string>;
//# sourceMappingURL=ai.d.ts.map