export interface ConnectorResult<T = unknown> {
  ok: boolean;
  status: number;
  message: string;
  data?: T;
  evidence: {
    appId: string;
    action: string;
    endpoint: string;
    request: Record<string, unknown>;
    response: unknown;
    timestamp: string;
  };
}

export interface ConnectorParamsBase {
  externalId?: string;
  userId?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  department?: string;
  title?: string;
  manager?: string;
  active?: boolean;
  attributes?: Record<string, unknown>;
}

export interface CreateUserParams extends ConnectorParamsBase {}

export interface UpdateUserParams extends ConnectorParamsBase {
  userId?: string;
}

export interface SuspendUserParams {
  userId: string;
  reason?: string;
}

export interface DeleteUserParams {
  userId: string;
  hardDelete?: boolean;
}

export interface GroupParams {
  userId: string;
  groupId: string;
  role?: string;
}

export interface Connector {
  id: string;
  createUser(params: CreateUserParams): Promise<ConnectorResult>;
  updateUser(params: UpdateUserParams): Promise<ConnectorResult>;
  suspendUser(params: SuspendUserParams): Promise<ConnectorResult>;
  deleteUser(params: DeleteUserParams): Promise<ConnectorResult>;
  addToGroup(params: GroupParams): Promise<ConnectorResult>;
  removeFromGroup(params: GroupParams): Promise<ConnectorResult>;
  testConnection(): Promise<{ ok: boolean; message: string }>;
}
