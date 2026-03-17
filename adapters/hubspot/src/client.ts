import type {
  HubSpotContact,
  HubSpotList,
  HubSpotListResponse,
} from "./types.js";

const API_BASE = "https://api.hubapi.com";

async function hubspotFetch<T>(
  url: string,
  accessToken: string,
  method: string = "GET",
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const init: RequestInit = { method, headers };
  if (body) {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(`HubSpot API error (${response.status}): ${errorBody}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json()) as T;
  return data;
}

async function paginateAll<T>(
  initialUrl: string,
  accessToken: string,
  pageSize: number = 100,
): Promise<T[]> {
  const results: T[] = [];
  let after: string | undefined;

  while (true) {
    const url = after
      ? `${initialUrl}&after=${encodeURIComponent(after)}`
      : `${initialUrl}&limit=${pageSize}`;

    const response = await hubspotFetch<HubSpotListResponse<T>>(
      url,
      accessToken,
    );

    results.push(...response.results);

    // Check if there's a next page
    if (!response.paging?.next?.after) {
      break;
    }

    after = response.paging.next.after;
  }

  return results;
}

// -- Contacts --

export async function listContacts(
  accessToken: string,
): Promise<HubSpotContact[]> {
  const url = `${API_BASE}/crm/v3/objects/contacts`;
  return paginateAll<HubSpotContact>(url, accessToken);
}

export async function getContact(
  contactId: string,
  accessToken: string,
): Promise<HubSpotContact> {
  const url = `${API_BASE}/crm/v3/objects/contacts/${encodeURIComponent(contactId)}`;
  return hubspotFetch<HubSpotContact>(url, accessToken);
}

export async function createContact(
  accessToken: string,
  email: string,
  firstName?: string,
  lastName?: string,
): Promise<HubSpotContact> {
  const url = `${API_BASE}/crm/v3/objects/contacts`;
  return hubspotFetch<HubSpotContact>(url, accessToken, "POST", {
    properties: {
      email,
      firstname: firstName,
      lastname: lastName,
    },
  });
}

export async function deleteContact(
  contactId: string,
  accessToken: string,
): Promise<void> {
  const url = `${API_BASE}/crm/v3/objects/contacts/${encodeURIComponent(contactId)}`;
  await hubspotFetch<void>(url, accessToken, "DELETE");
}

// -- Lists (for groups) --

export async function listLists(accessToken: string): Promise<HubSpotList[]> {
  const url = `${API_BASE}/crm/v3/lists`;
  return paginateAll<HubSpotList>(url, accessToken);
}

export async function getList(
  listId: string,
  accessToken: string,
): Promise<HubSpotList> {
  const url = `${API_BASE}/crm/v3/lists/${encodeURIComponent(listId)}`;
  return hubspotFetch<HubSpotList>(url, accessToken);
}

export async function listListMembers(
  listId: string,
  accessToken: string,
): Promise<HubSpotContact[]> {
  const url = `${API_BASE}/crm/v3/lists/${encodeURIComponent(listId)}/memberships/contacts`;
  return paginateAll<HubSpotContact>(url, accessToken);
}

export async function addListMember(
  listId: string,
  contactIds: string[],
  accessToken: string,
): Promise<void> {
  const url = `${API_BASE}/crm/v3/lists/${encodeURIComponent(listId)}/memberships/contacts/add`;
  await hubspotFetch<void>(url, accessToken, "PUT", {
    contactIds,
  });
}

export async function removeListMember(
  listId: string,
  contactIds: string[],
  accessToken: string,
): Promise<void> {
  const url = `${API_BASE}/crm/v3/lists/${encodeURIComponent(listId)}/memberships/contacts/remove`;
  await hubspotFetch<void>(url, accessToken, "PUT", {
    contactIds,
  });
}
