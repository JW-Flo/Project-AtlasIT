// Stub for cloudflare:workers used in unit/integration tests outside the Workers runtime.
export class DurableObject {
  ctx: unknown;
  env: unknown;
  constructor(ctx: unknown, env: unknown) {
    this.ctx = ctx;
    this.env = env;
  }
}

export class WorkflowEntrypoint<_Env = unknown, _Params = unknown> {
  ctx!: unknown;
  env!: _Env;
}
