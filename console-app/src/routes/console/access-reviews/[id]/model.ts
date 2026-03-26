export type AccessDecision = "approved" | "revoked";

export interface AccessReviewItem {
  id: string;
  userId: string;
  userEmail?: string | null;
  appId: string;
  appName?: string | null;
  role?: string | null;
  reviewerEmail?: string | null;
  status: "pending" | "approved" | "revoked" | "skipped";
  notes?: string | null;
  decidedAt?: string | null;
  decidedBy?: string | null;
}

export function isPending(item: AccessReviewItem): boolean {
  return item.status === "pending";
}

export function applyDecision(
  items: AccessReviewItem[],
  itemId: string,
  decision: AccessDecision,
  notes?: string,
): AccessReviewItem[] {
  return items.map((item) => {
    if (item.id !== itemId) return item;

    return {
      ...item,
      status: decision,
      notes: notes?.trim() ? notes.trim() : item.notes,
      decidedAt: new Date().toISOString(),
    };
  });
}
