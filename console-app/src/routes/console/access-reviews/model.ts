export type CampaignStatus = "draft" | "active" | "completed" | "expired";

export interface AccessReviewCampaign {
  id: string;
  name: string;
  scope: string;
  status: CampaignStatus;
  dueDate?: string | null;
  createdAt?: string | null;
  completedAt?: string | null;
  totalItems?: number | null;
  approvedItems?: number | null;
  revokedItems?: number | null;
  pendingItems?: number | null;
}

export function derivePendingItems(campaign: AccessReviewCampaign): number {
  if (typeof campaign.pendingItems === "number") return Math.max(0, campaign.pendingItems);

  const total = Math.max(0, campaign.totalItems ?? 0);
  const approved = Math.max(0, campaign.approvedItems ?? 0);
  const revoked = Math.max(0, campaign.revokedItems ?? 0);

  return Math.max(0, total - approved - revoked);
}

export function computeCampaignProgress(campaign: AccessReviewCampaign): number {
  const total = Math.max(0, campaign.totalItems ?? 0);
  if (total === 0) return 0;

  const reviewed = Math.max(0, campaign.approvedItems ?? 0) + Math.max(0, campaign.revokedItems ?? 0);
  const ratio = reviewed / total;

  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}

export function statusLabel(status: CampaignStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "active":
      return "Active";
    case "completed":
      return "Completed";
    case "expired":
      return "Expired";
    default:
      return status;
  }
}

export function statusVariant(status: CampaignStatus): "secondary" | "warning" | "success" | "destructive" {
  switch (status) {
    case "draft":
      return "secondary";
    case "active":
      return "warning";
    case "completed":
      return "success";
    case "expired":
      return "destructive";
    default:
      return "secondary";
  }
}
