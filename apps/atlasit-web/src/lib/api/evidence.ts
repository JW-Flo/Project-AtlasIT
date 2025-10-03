import { EvidenceSearchResponse, EvidenceVerifyResponse } from "./types";
import { ComplianceAPI } from "./client";

// Thin wrappers providing semantic naming and potential future caching / fallback control.

export async function searchEvidence(
  params: {
    tenantId?: string;
    pack?: string;
    subject?: string;
    limit?: number;
    cursor?: string;
  } = {},
): Promise<EvidenceSearchResponse> {
  return ComplianceAPI.searchEvidence(params);
}

export async function verifyEvidence(
  hash: string,
): Promise<EvidenceVerifyResponse> {
  return ComplianceAPI.verifyEvidence(hash);
}

export type { EvidenceSearchResponse, EvidenceVerifyResponse };
