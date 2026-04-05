import { writable, get } from "svelte/store";

export type ScoreSource = "evidence" | "self-assessed" | "self-assessed-fallback" | "no-data";

export interface FrameworkScore {
  framework: string;
  score: number;
  grade: string;
  source?: ScoreSource;
}

export interface ComplianceStoreData {
  overallScore: number;
  grade: string;
  frameworks: FrameworkScore[];
  globalSource: string;
  lastUpdated: string | null;
}

export const complianceScore = writable<ComplianceStoreData | null>(null);
export const complianceLoading = writable(false);

let fetched = false;

function computeGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function clearComplianceCache() {
  fetched = false;
  complianceScore.set(null);
}

export async function fetchComplianceScore(): Promise<ComplianceStoreData | null> {
  if (fetched) {
    return get(complianceScore);
  }
  complianceLoading.set(true);
  try {
    const res = await fetch("/api/tenant-compliance/scores");
    if (!res.ok) {
      complianceScore.set(null);
      return null;
    }
    const data: any = await res.json();
    const scores: FrameworkScore[] = (data.scores || []).map((s: any) => ({
      framework: s.framework,
      score: Math.round(s.score ?? 0),
      grade: s.grade || computeGrade(s.score ?? 0),
      source: s.source as ScoreSource | undefined,
    }));

    if (scores.length === 0) {
      complianceScore.set(null);
      return null;
    }

    const avg = Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length);
    const result: ComplianceStoreData = {
      overallScore: avg,
      grade: computeGrade(avg),
      frameworks: scores,
      globalSource: data.source || "empty",
      lastUpdated: new Date().toISOString(),
    };
    complianceScore.set(result);
    fetched = true;
    return result;
  } catch {
    complianceScore.set(null);
    return null;
  } finally {
    complianceLoading.set(false);
  }
}

export async function refreshComplianceScore(): Promise<ComplianceStoreData | null> {
  fetched = false;
  return fetchComplianceScore();
}
