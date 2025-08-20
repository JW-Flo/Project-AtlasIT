export interface Env {
  STATE: KVNamespace;
  DB: D1Database;
  AI_API_KEY: string;
}
export interface TenantConfig {
  industry: string;
  requirements: string[];
  integrations: Integration[];
  workflows: Workflow[];
  security: SecurityConfig;
}
export interface Integration {
  id: string;
  name: string;
  type: "saas" | "api" | "database" | "custom";
  config: Record<string, any>;
  enabled: boolean;
}
export interface Workflow {
  id: string;
  name: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  enabled: boolean;
}
export interface WorkflowTrigger {
  type: "webhook" | "schedule" | "event";
  config: Record<string, any>;
}
export interface WorkflowAction {
  type: "api_call" | "notification" | "data_transform" | "custom";
  config: Record<string, any>;
}
export interface SecurityConfig {
  authentication: {
    method: "jwt" | "oauth" | "saml";
    config: Record<string, any>;
  };
  authorization: {
    rbac: boolean;
    roles: Role[];
  };
  encryption: {
    atRest: boolean;
    inTransit: boolean;
  };
}
export interface Role {
  id: string;
  name: string;
  permissions: string[];
}
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
export interface AIConfigRequest {
  industry: string;
  requirements: string[];
}
export interface Template {
  id: string;
  name: string;
  description: string;
  config: TenantConfig;
  files: TemplateFile[];
}
export interface TemplateFile {
  path: string;
  content: string;
  type: "config" | "code" | "documentation";
}
//# sourceMappingURL=types.d.ts.map
