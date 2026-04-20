// console-app/src/lib/demo/data/directory.ts
import { daysAgo } from "./helpers";

const USERS = [
  {
    name: "Alex Morgan",
    email: "alex@acmecorp.io",
    dept: "Engineering",
    title: "CTO",
    status: "active",
  },
  {
    name: "Jordan Lee",
    email: "jordan@acmecorp.io",
    dept: "Engineering",
    title: "Staff Engineer",
    status: "active",
  },
  {
    name: "Sam Rivera",
    email: "sam@acmecorp.io",
    dept: "Engineering",
    title: "Senior Engineer",
    status: "active",
  },
  {
    name: "Casey Kim",
    email: "casey@acmecorp.io",
    dept: "Engineering",
    title: "DevOps Lead",
    status: "active",
  },
  {
    name: "Taylor Chen",
    email: "taylor@acmecorp.io",
    dept: "Sales",
    title: "VP Sales",
    status: "active",
  },
  {
    name: "Avery Patel",
    email: "avery@acmecorp.io",
    dept: "Sales",
    title: "Account Executive",
    status: "active",
  },
  {
    name: "Riley Johnson",
    email: "riley@acmecorp.io",
    dept: "Security",
    title: "Security Engineer",
    status: "active",
  },
  {
    name: "Morgan Davis",
    email: "morgan@acmecorp.io",
    dept: "Security",
    title: "GRC Analyst",
    status: "active",
  },
  {
    name: "Quinn Wilson",
    email: "quinn@acmecorp.io",
    dept: "IT",
    title: "IT Manager",
    status: "active",
  },
  {
    name: "Drew Martinez",
    email: "drew@acmecorp.io",
    dept: "IT",
    title: "Helpdesk",
    status: "active",
  },
  {
    name: "Jamie Scott",
    email: "jamie@acmecorp.io",
    dept: "HR",
    title: "People Ops",
    status: "active",
  },
  {
    name: "Pat O'Brien",
    email: "pat@acmecorp.io",
    dept: "Finance",
    title: "Controller",
    status: "suspended",
  },
];

export function getDirectoryUsersResponse() {
  return {
    data: {
      items: USERS.map((u, i) => ({
        id: `user-${i + 1}`,
        email: u.email,
        display_name: u.name,
        department: u.dept,
        title: u.title,
        status: u.status,
        external_id: `okta-${u.email.split("@")[0]}`,
        created_at: daysAgo(90 - i * 5),
      })),
    },
  };
}

export function getDirectoryGroupsResponse() {
  return {
    data: {
      items: [
        {
          id: "grp-1",
          name: "Engineering",
          description: "Product & platform engineering",
          external_id: "okta-eng",
          member_count: 4,
        },
        {
          id: "grp-2",
          name: "Sales",
          description: "Revenue team",
          external_id: "okta-sales",
          member_count: 2,
        },
        {
          id: "grp-3",
          name: "Security",
          description: "InfoSec & GRC",
          external_id: "okta-sec",
          member_count: 2,
        },
        {
          id: "grp-4",
          name: "IT",
          description: "IT operations",
          external_id: "okta-it",
          member_count: 2,
        },
      ],
    },
  };
}

export function getDirectorySyncStatusResponse() {
  return {
    data: {
      userCount: 12,
      groupCount: 4,
      connections: [{ provider: "okta", lastSyncAt: new Date(Date.now() - 1800000).toISOString() }],
    },
  };
}
