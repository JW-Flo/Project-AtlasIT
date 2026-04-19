import { daysAgo, uuid } from "./helpers.js";

export function getDirectoryUsersResponse() {
  return {
    data: {
      items: [
        {
          id: uuid(),
          email: "alex@acmecorp.io",
          display_name: "Alex Morgan",
          department: "Engineering",
          title: "VP Engineering",
          status: "active",
          external_id: "okta-user-001",
          created_at: daysAgo(365),
        },
        {
          id: uuid(),
          email: "jordan.lee@acmecorp.io",
          display_name: "Jordan Lee",
          department: "Engineering",
          title: "Senior Software Engineer",
          status: "active",
          external_id: "okta-user-002",
          created_at: daysAgo(280),
        },
        {
          id: uuid(),
          email: "taylor.chen@acmecorp.io",
          display_name: "Taylor Chen",
          department: "Engineering",
          title: "DevOps Engineer",
          status: "active",
          external_id: "okta-user-003",
          created_at: daysAgo(245),
        },
        {
          id: uuid(),
          email: "morgan.patel@acmecorp.io",
          display_name: "Morgan Patel",
          department: "Engineering",
          title: "Software Engineer",
          status: "active",
          external_id: "okta-user-004",
          created_at: daysAgo(120),
        },
        {
          id: uuid(),
          email: "riley.johnson@acmecorp.io",
          display_name: "Riley Johnson",
          department: "Security",
          title: "CISO",
          status: "active",
          external_id: "okta-user-005",
          created_at: daysAgo(320),
        },
        {
          id: uuid(),
          email: "casey.williams@acmecorp.io",
          display_name: "Casey Williams",
          department: "Security",
          title: "Security Engineer",
          status: "active",
          external_id: "okta-user-006",
          created_at: daysAgo(180),
        },
        {
          id: uuid(),
          email: "sam.rodriguez@acmecorp.io",
          display_name: "Sam Rodriguez",
          department: "Sales",
          title: "VP Sales",
          status: "active",
          external_id: "okta-user-007",
          created_at: daysAgo(290),
        },
        {
          id: uuid(),
          email: "quinn.martinez@acmecorp.io",
          display_name: "Quinn Martinez",
          department: "Sales",
          title: "Account Executive",
          status: "active",
          external_id: "okta-user-008",
          created_at: daysAgo(150),
        },
        {
          id: uuid(),
          email: "avery.kim@acmecorp.io",
          display_name: "Avery Kim",
          department: "IT",
          title: "IT Manager",
          status: "active",
          external_id: "okta-user-009",
          created_at: daysAgo(200),
        },
        {
          id: uuid(),
          email: "drew.thompson@acmecorp.io",
          display_name: "Drew Thompson",
          department: "IT",
          title: "IT Support Specialist",
          status: "active",
          external_id: "okta-user-010",
          created_at: daysAgo(90),
        },
        {
          id: uuid(),
          email: "charlie.garcia@acmecorp.io",
          display_name: "Charlie Garcia",
          department: "HR",
          title: "HR Director",
          status: "active",
          external_id: "okta-user-011",
          created_at: daysAgo(310),
        },
        {
          id: uuid(),
          email: "pat.obrien@acmecorp.io",
          display_name: "Pat O'Brien",
          department: "Finance",
          title: "Finance Manager",
          status: "suspended",
          external_id: "okta-user-012",
          created_at: daysAgo(240),
        },
      ],
    },
  };
}

export function getDirectoryGroupsResponse() {
  return {
    data: {
      items: [
        {
          id: uuid(),
          name: "Engineering",
          description: "All engineering team members",
          external_id: "okta-group-001",
          member_count: 4,
        },
        {
          id: uuid(),
          name: "Security",
          description: "Security and compliance team",
          external_id: "okta-group-002",
          member_count: 2,
        },
        {
          id: uuid(),
          name: "Sales",
          description: "Sales and business development",
          external_id: "okta-group-003",
          member_count: 2,
        },
        {
          id: uuid(),
          name: "Admins",
          description: "System administrators",
          external_id: "okta-group-004",
          member_count: 3,
        },
      ],
    },
  };
}

export function getDirectorySyncStatusResponse() {
  return {
    data: {
      lastSync: daysAgo(0),
      status: "healthy",
      usersCount: 12,
      groupsCount: 4,
    },
  };
}
