import { hoursAgo, daysAgo, uuid } from "./helpers.js";

export function getNotificationsResponse() {
  return {
    data: {
      items: [
        {
          id: uuid(),
          type: "incident",
          title: "New critical security incident detected",
          message: "A critical CVE has been detected in a production dependency",
          read: false,
          createdAt: hoursAgo(4),
        },
        {
          id: uuid(),
          type: "access_request",
          title: "Access request pending approval",
          message: "Jordan Lee has requested access to AWS Production Account",
          read: false,
          createdAt: hoursAgo(3),
        },
        {
          id: uuid(),
          type: "compliance",
          title: "Compliance score improved",
          message: "Your SOC2 compliance score has increased to 82%",
          read: false,
          createdAt: daysAgo(1),
        },
        {
          id: uuid(),
          type: "automation",
          title: "Automation rule execution failed",
          message: "Auto-Revoke on Offboarding rule encountered an error",
          read: false,
          createdAt: daysAgo(2),
        },
        {
          id: uuid(),
          type: "access_review",
          title: "Access review due soon",
          message: "Q1 2026 Access Review campaign is 60% complete with 10 days remaining",
          read: true,
          createdAt: daysAgo(3),
        },
        {
          id: uuid(),
          type: "integration",
          title: "Integration health warning",
          message: "PagerDuty integration health check detected connectivity issues",
          read: true,
          createdAt: daysAgo(5),
        },
      ],
      unreadCount: 4,
    },
  };
}
