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
