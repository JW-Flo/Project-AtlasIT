import { TenantConfig, AIConfigRequest } from "../types";
export declare class AIConfigService {
  private apiKey;
  constructor(apiKey: string);
  generateConfig(request: AIConfigRequest): Promise<TenantConfig>;
  private getIndustryBaseConfig;
  private generateDefaultWorkflows;
  private enhanceWithAI;
}
//# sourceMappingURL=ai-config.d.ts.map
