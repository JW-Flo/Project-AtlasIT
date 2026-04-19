import { daysAgo, hoursAgo, uuid } from "./helpers.js";

export function getAccessReviewsResponse() {
  const today = new Date();
  const q1DueDate = new Date(today.getFullYear(), 2, 31); // March 31
  const q4DueDate = new Date(today.getFullYear() - 1, 11, 31); // Dec 31 last year

  return {
    data: {
      items: [
        {
          id: uuid(),
          name: "Q1 2026 Access Review",
          scope: "all_users",
          dueDate: q1DueDate.toISOString(),
          status: "active",
          totalItems: 48,
          decidedItems: 29,
        },
        {
          id: uuid(),
          name: "Q4 2025 Access Review",
          scope: "privileged_access",
          dueDate: q4DueDate.toISOString(),
          status: "completed",
          totalItems: 45,
          decidedItems: 45,
        },
      ],
    },
  };
}

export function getAccessRequestsResponse() {
  return {
    data: {
      items: [
        {
          id: uuid(),
          requester: "jordan.lee@acmecorp.io",
          resource: "AWS Production Account",
          justification: "Need to debug production issue with customer-facing API",
          status: "pending",
          createdAt: hoursAgo(3),
        },
        {
          id: uuid(),
          requester: "taylor.chen@acmecorp.io",
          resource: "GitHub Admin Access",
          justification: "Repository migration project requires elevated permissions",
          status: "approved",
          createdAt: daysAgo(1),
        },
        {
          id: uuid(),
          requester: "morgan.patel@acmecorp.io",
          resource: "Production Database Read Access",
          justification: "Analytics query development and testing",
          status: "approved",
          createdAt: daysAgo(3),
        },
        {
          id: uuid(),
          requester: "quinn.martinez@acmecorp.io",
          resource: "Salesforce Admin Console",
          justification: "Need to configure new sales workflow automation",
          status: "denied",
          createdAt: daysAgo(5),
        },
        {
          id: uuid(),
          requester: "casey.williams@acmecorp.io",
          resource: "Security Audit Logs",
          justification: "Quarterly security audit and compliance review",
          status: "approved",
          createdAt: daysAgo(7),
        },
      ],
    },
  };
}
