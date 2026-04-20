import { daysAgo, hoursAgo, uuid } from "./helpers.js";

export function getAccessReviewItemsResponse() {
  return {
    campaign: { id: "demo-campaign", name: "Q1 2026 Access Review", status: "active" },
    items: [
      {
        id: uuid(),
        userEmail: "jordan.lee@acmecorp.io",
        resource: "AWS Production",
        currentAccess: "Admin",
        decision: null,
        decidedBy: null,
        notes: null,
      },
      {
        id: uuid(),
        userEmail: "taylor.chen@acmecorp.io",
        resource: "GitHub",
        currentAccess: "Write",
        decision: "approved",
        decidedBy: "admin@acmecorp.io",
        notes: null,
      },
      {
        id: uuid(),
        userEmail: "morgan.patel@acmecorp.io",
        resource: "Salesforce",
        currentAccess: "Read",
        decision: null,
        decidedBy: null,
        notes: null,
      },
      {
        id: uuid(),
        userEmail: "quinn.martinez@acmecorp.io",
        resource: "Slack",
        currentAccess: "Member",
        decision: "approved",
        decidedBy: "admin@acmecorp.io",
        notes: null,
      },
      {
        id: uuid(),
        userEmail: "casey.williams@acmecorp.io",
        resource: "Datadog",
        currentAccess: "Admin",
        decision: "revoked",
        decidedBy: "admin@acmecorp.io",
        notes: "No longer on security team",
      },
      {
        id: uuid(),
        userEmail: "alex.nguyen@acmecorp.io",
        resource: "AWS Staging",
        currentAccess: "Read",
        decision: null,
        decidedBy: null,
        notes: null,
      },
    ],
  };
}

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
