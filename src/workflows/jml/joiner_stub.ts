/**
 * Joiner Stub - Minimal JML workflow demonstrating evidence emission
 *
 * Mocks: okta.create_user, emit_user_provisioned, enforce_mfa
 * Evidence: ACCESS_MFA_ENFORCED control
 */

export interface JoinerParams {
  tenantId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  department?: string;
}

export interface JoinerResult {
  success: boolean;
  userId: string;
  actions: string[];
  evidenceHash?: string;
  error?: string;
}

export interface EvidenceEnvelope {
  id: string;
  tenantId: string;
  producer: string;
  control_id: string;
  subject: {
    userId: string;
    email: string;
  };
  actions: {
    action: string;
    timestamp: string;
    status: string;
    metadata?: Record<string, unknown>;
  }[];
  hash: string;
  timestamp: string;
  uri: string;
}

/**
 * Mock Okta adapter - creates user in mock directory
 */
async function mockOktaCreateUser(
  params: JoinerParams,
): Promise<{ oktaId: string }> {
  console.log("[MOCK] okta.createUser:", params.email);
  return { oktaId: `okta_${params.userId}_mock` };
}

/**
 * Mock event emitter - simulates user provisioned event
 */
async function mockEmitUserProvisioned(
  userId: string,
  email: string,
): Promise<void> {
  console.log("[MOCK] emit_user_provisioned:", email);
}

/**
 * Mock MFA enforcement - simulates MFA requirement
 */
async function mockEnforceMFA(
  oktaId: string,
): Promise<{ mfaRequired: boolean }> {
  console.log("[MOCK] enforce_mfa:", oktaId);
  return { mfaRequired: true };
}

/**
 * Generate SHA-256 hash of content (stub implementation)
 *
 * WARNING: This is NOT a real SHA-256 hash. This is a simple stub implementation
 * for demonstration purposes only. In production, use Node crypto or Web Crypto API
 * with real SHA-256 hashing for compliance and security.
 */
function sha256Hash(content: string): string {
  // Simple hash stub - NOT cryptographically secure
  // Use crypto.createHash('sha256') in production
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `sha256_stub_${Math.abs(hash).toString(16)}`;
}

/**
 * Generate evidence envelope
 */
export function generateEvidence(
  params: JoinerParams,
  actions: any[],
): EvidenceEnvelope {
  const id = `ev-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const timestamp = new Date().toISOString();

  const envelope: Omit<EvidenceEnvelope, "hash" | "uri"> = {
    id,
    tenantId: params.tenantId,
    producer: "codex",
    control_id: "ACCESS_MFA_ENFORCED",
    subject: {
      userId: params.userId,
      email: params.email,
    },
    actions: actions.map((a) => ({
      action: a.action,
      timestamp: a.timestamp,
      status: a.status,
      metadata: a.metadata,
    })),
    timestamp,
  };

  // Compute hash of canonical envelope (sorted keys)
  const canonicalJson = JSON.stringify(envelope, Object.keys(envelope).sort());
  const hash = sha256Hash(canonicalJson);

  return {
    ...envelope,
    hash,
    uri: `evidence/${hash}.json`,
  };
}

/**
 * Joiner workflow stub - demonstrates JML pattern with evidence emission
 */
export async function runJoinerStub(
  params: JoinerParams,
): Promise<JoinerResult> {
  const actions: any[] = [];

  try {
    // Step 1: Create user in Okta (mock)
    const createTimestamp = new Date().toISOString();
    const oktaResult = await mockOktaCreateUser(params);
    actions.push({
      action: "okta.create_user",
      timestamp: createTimestamp,
      status: "success",
      metadata: { oktaId: oktaResult.oktaId },
    });

    // Step 2: Emit user provisioned event (mock)
    const emitTimestamp = new Date().toISOString();
    await mockEmitUserProvisioned(params.userId, params.email);
    actions.push({
      action: "emit_user_provisioned",
      timestamp: emitTimestamp,
      status: "success",
    });

    // Step 3: Enforce MFA (mock)
    const mfaTimestamp = new Date().toISOString();
    const mfaResult = await mockEnforceMFA(oktaResult.oktaId);
    actions.push({
      action: "enforce_mfa",
      timestamp: mfaTimestamp,
      status: "success",
      metadata: { mfaRequired: mfaResult.mfaRequired },
    });

    // Generate evidence
    const evidence = generateEvidence(params, actions);

    return {
      success: true,
      userId: params.userId,
      actions: actions.map((a) => a.action),
      evidenceHash: evidence.hash,
    };
  } catch (error) {
    return {
      success: false,
      userId: params.userId,
      actions: actions.map((a) => a.action),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate evidence artifact as JSON string
 */
export function writeEvidenceJson(
  params: JoinerParams,
  actions: any[],
): string {
  const evidence = generateEvidence(params, actions);
  return JSON.stringify(evidence, null, 2);
}
