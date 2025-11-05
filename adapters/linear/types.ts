export interface AdapterContext {
  env?: Record<string, string>;
  bindings?: Record<string, unknown>;
}

export interface AdapterRouter {
  handle(request: Request): Promise<Response>;
}

export interface AdapterHandler {
  fetch(request: Request): Promise<Response>;
}

export interface LinearWebhookPayload {
  action: string;
  type: string;
  data: Record<string, unknown>;
  createdAt: string;
  organizationId?: string;
  webhookId?: string;
}

export interface LinearIssue {
  id: string;
  title: string;
  description?: string;
  state?: {
    id: string;
    name: string;
    type: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  labels?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  priority?: number;
  estimate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LinearSyncConfig {
  apiKey?: string;
  webhookSecret?: string;
  syncDirection?: "linear-to-atlas" | "atlas-to-linear" | "bidirectional";
  autoSync?: boolean;
}
