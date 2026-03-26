import type { MondayUser, MondayTeam, MondayGraphQLResponse } from "./types.js";

const API_BASE = "https://api.monday.com/v2";

async function mondayGraphQL<T>(
  query: string,
  accessToken: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(`Monday.com API error (${response.status}): ${errorBody}`);
  }

  const result = (await response.json()) as MondayGraphQLResponse<T>;

  if (result.errors) {
    const errorMsg = result.errors.map((e) => e.message).join("; ");
    throw new Error(`GraphQL error: ${errorMsg}`);
  }

  return result.data;
}

// -- Users --

export async function listUsers(accessToken: string): Promise<MondayUser[]> {
  const query = `
    query {
      users {
        id
        name
        email
        enabled
        account_owner
      }
    }
  `;

  const result = await mondayGraphQL<{ users: MondayUser[] }>(
    query,
    accessToken,
  );
  return result.users || [];
}

// -- Teams --

export async function listTeams(accessToken: string): Promise<MondayTeam[]> {
  const query = `
    query {
      teams {
        id
        name
        owner {
          id
          name
          email
        }
        users {
          id
          name
          email
        }
      }
    }
  `;

  const result = await mondayGraphQL<{ teams: MondayTeam[] }>(
    query,
    accessToken,
  );
  return result.teams || [];
}
