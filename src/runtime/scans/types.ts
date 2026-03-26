import type { RegisteredItem } from "../registry/types";
export type { ScanFeature } from "../features/types";

export type ScanSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "warning"
  | "info"
  | "excellent";

export interface CostEstimate {
  currency: string;
  amount: number;
  timeframe: string;
}

export interface TechnicalDetails {
  remediationSteps?: string[];
  [key: string]: unknown;
}

export interface EnhancedFinding {
  severity: ScanSeverity;
  category: string;
  title: string;
  description: string;
  recommendation?: string;
  businessImpact?: string;
  costEstimate?: CostEstimate;
  technicalDetails?: TechnicalDetails;
  [key: string]: unknown;
}

export interface EnhancedScanSummary {
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  securityScore: number;
}

export interface BusinessMetrics {
  trustScore: number;
  professionalismScore: number;
  userExperienceScore: number;
  brandProtectionScore: number;
}

export interface EnhancedScanResult {
  scanId: string;
  url: string;
  scanType: string;
  timestamp: string;
  duration: number;
  findings: EnhancedFinding[];
  summary: EnhancedScanSummary;
  businessMetrics: BusinessMetrics;
  metadata: {
    scannerVersion: string;
    scanDepth: number;
    externalApisUsed: string[];
    [key: string]: unknown;
  };
  diagnostics?: Record<string, unknown>;
}

export interface ScanContext {
  env?: Record<string, unknown>;
  superAdminMode?: boolean;
}

export interface ScanRunOutput {
  findings: EnhancedFinding[];
  diagnostics?: Record<string, unknown>;
  externalApisUsed?: string[];
  metadata?: Record<string, unknown>;
}

export interface ScanFeatureMeta {
  category: string;
  externalApis?: string[];
  composite?: boolean;
}
