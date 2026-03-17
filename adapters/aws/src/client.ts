/**
 * AWS IAM API client.
 *
 * Uses raw HTTP with Signature V4 signing — no AWS SDK dependency.
 * IAM is a global service; the endpoint is always https://iam.amazonaws.com.
 * All IAM responses are XML; we parse them with lightweight helpers.
 */

import { signRequest } from "./signing.js";
import type {
  AwsConfig,
  IAMUser,
  IAMGroup,
  IAMPolicy,
  IAMAccessKey,
  IAMListResponse,
} from "./types.js";

const IAM_ENDPOINT = "https://iam.amazonaws.com";
const IAM_API_VERSION = "2010-05-08";
const SERVICE = "iam";

// --- XML parsing helpers ---

/**
 * Extract the text content of a single XML element.
 * Returns undefined if the element is not found.
 */
function xmlText(xml: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`);
  const match = xml.match(re);
  return match ? match[1].trim() : undefined;
}

/**
 * Extract all occurrences of a repeating XML element.
 */
function xmlAll(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g");
  const results: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    results.push(match[1]);
  }
  return results;
}

function parseUser(memberXml: string): IAMUser {
  return {
    UserName: xmlText(memberXml, "UserName") ?? "",
    UserId: xmlText(memberXml, "UserId") ?? "",
    Arn: xmlText(memberXml, "Arn") ?? "",
    Path: xmlText(memberXml, "Path") ?? "/",
    CreateDate: xmlText(memberXml, "CreateDate") ?? "",
    PasswordLastUsed: xmlText(memberXml, "PasswordLastUsed"),
  };
}

function parseGroup(memberXml: string): IAMGroup {
  return {
    GroupName: xmlText(memberXml, "GroupName") ?? "",
    GroupId: xmlText(memberXml, "GroupId") ?? "",
    Arn: xmlText(memberXml, "Arn") ?? "",
    Path: xmlText(memberXml, "Path") ?? "/",
    CreateDate: xmlText(memberXml, "CreateDate") ?? "",
  };
}

function parseAccessKey(memberXml: string): IAMAccessKey {
  return {
    AccessKeyId: xmlText(memberXml, "AccessKeyId") ?? "",
    UserName: xmlText(memberXml, "UserName") ?? "",
    Status: xmlText(memberXml, "Status") ?? "",
    CreateDate: xmlText(memberXml, "CreateDate") ?? "",
  };
}

function parsePolicy(memberXml: string): IAMPolicy {
  return {
    PolicyName: xmlText(memberXml, "PolicyName") ?? "",
    PolicyArn: xmlText(memberXml, "PolicyArn") ?? "",
  };
}

// --- Core request execution ---

async function iamRequest(
  config: AwsConfig,
  params: Record<string, string>,
): Promise<string> {
  const queryParams = new URLSearchParams({
    ...params,
    Version: IAM_API_VERSION,
  });

  // IAM uses GET with query-string parameters
  const url = `${IAM_ENDPOINT}/?${queryParams.toString()}`;

  const signedHeaders = await signRequest({
    method: "GET",
    url,
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=utf-8",
    },
    body: "",
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: config.region,
    service: SERVICE,
  });

  const response = await fetch(url, {
    method: "GET",
    headers: signedHeaders,
  });

  const body = await response.text();

  if (!response.ok) {
    const errorCode = xmlText(body, "Code") ?? "UnknownError";
    const errorMessage = xmlText(body, "Message") ?? body.slice(0, 500);
    throw new Error(
      `AWS IAM API error (${response.status}): ${errorCode} - ${errorMessage}`,
    );
  }

  return body;
}

// --- Paginated fetcher ---

async function paginateIAM<T>(
  config: AwsConfig,
  action: string,
  memberTag: string,
  parser: (xml: string) => T,
  extraParams?: Record<string, string>,
): Promise<IAMListResponse<T>> {
  const allItems: T[] = [];
  let marker: string | undefined;

  do {
    const params: Record<string, string> = {
      Action: action,
      MaxItems: "1000",
      ...extraParams,
    };
    if (marker) {
      params.Marker = marker;
    }

    const xml = await iamRequest(config, params);
    const members = xmlAll(xml, memberTag);
    allItems.push(...members.map(parser));

    const isTruncated = xmlText(xml, "IsTruncated") === "true";
    marker = isTruncated ? xmlText(xml, "Marker") : undefined;
  } while (marker);

  return { items: allItems, isTruncated: false };
}

// --- Public API methods ---

export async function listUsers(config: AwsConfig): Promise<IAMUser[]> {
  const result = await paginateIAM(config, "ListUsers", "member", parseUser);
  return result.items;
}

export async function getUser(
  config: AwsConfig,
  userName: string,
): Promise<IAMUser> {
  const xml = await iamRequest(config, {
    Action: "GetUser",
    UserName: userName,
  });

  const userXml = xmlText(xml, "User");
  if (!userXml) {
    throw new Error(`User not found: ${userName}`);
  }
  return parseUser(userXml);
}

export async function createUser(
  config: AwsConfig,
  userName: string,
  path?: string,
): Promise<IAMUser> {
  const params: Record<string, string> = {
    Action: "CreateUser",
    UserName: userName,
  };
  if (path) {
    params.Path = path;
  }

  const xml = await iamRequest(config, params);
  const userXml = xmlText(xml, "User");
  if (!userXml) {
    throw new Error(`Failed to create user: ${userName}`);
  }
  return parseUser(userXml);
}

export async function deleteUser(
  config: AwsConfig,
  userName: string,
): Promise<void> {
  await iamRequest(config, {
    Action: "DeleteUser",
    UserName: userName,
  });
}

export async function listGroups(config: AwsConfig): Promise<IAMGroup[]> {
  const result = await paginateIAM(config, "ListGroups", "member", parseGroup);
  return result.items;
}

export async function addUserToGroup(
  config: AwsConfig,
  userName: string,
  groupName: string,
): Promise<void> {
  await iamRequest(config, {
    Action: "AddUserToGroup",
    UserName: userName,
    GroupName: groupName,
  });
}

export async function removeUserFromGroup(
  config: AwsConfig,
  userName: string,
  groupName: string,
): Promise<void> {
  await iamRequest(config, {
    Action: "RemoveUserFromGroup",
    UserName: userName,
    GroupName: groupName,
  });
}

export async function listGroupsForUser(
  config: AwsConfig,
  userName: string,
): Promise<IAMGroup[]> {
  const result = await paginateIAM(
    config,
    "ListGroupsForUser",
    "member",
    parseGroup,
    { UserName: userName },
  );
  return result.items;
}

export async function createAccessKey(
  config: AwsConfig,
  userName: string,
): Promise<IAMAccessKey> {
  const xml = await iamRequest(config, {
    Action: "CreateAccessKey",
    UserName: userName,
  });

  const keyXml = xmlText(xml, "AccessKey");
  if (!keyXml) {
    throw new Error(`Failed to create access key for user: ${userName}`);
  }
  return parseAccessKey(keyXml);
}

export async function deleteAccessKey(
  config: AwsConfig,
  userName: string,
  accessKeyId: string,
): Promise<void> {
  await iamRequest(config, {
    Action: "DeleteAccessKey",
    UserName: userName,
    AccessKeyId: accessKeyId,
  });
}

export async function attachUserPolicy(
  config: AwsConfig,
  userName: string,
  policyArn: string,
): Promise<void> {
  await iamRequest(config, {
    Action: "AttachUserPolicy",
    UserName: userName,
    PolicyArn: policyArn,
  });
}

export async function detachUserPolicy(
  config: AwsConfig,
  userName: string,
  policyArn: string,
): Promise<void> {
  await iamRequest(config, {
    Action: "DetachUserPolicy",
    UserName: userName,
    PolicyArn: policyArn,
  });
}

/**
 * List members of a specific IAM group.
 * Uses GetGroup which returns group info + members.
 */
export async function listGroupMembers(
  config: AwsConfig,
  groupName: string,
): Promise<IAMUser[]> {
  const allUsers: IAMUser[] = [];
  let marker: string | undefined;

  do {
    const params: Record<string, string> = {
      Action: "GetGroup",
      GroupName: groupName,
      MaxItems: "1000",
    };
    if (marker) {
      params.Marker = marker;
    }

    const xml = await iamRequest(config, params);

    // GetGroup returns <Users><member>...</member></Users>
    const usersBlock = xmlText(xml, "Users");
    if (usersBlock) {
      const members = xmlAll(usersBlock, "member");
      allUsers.push(...members.map(parseUser));
    }

    const isTruncated = xmlText(xml, "IsTruncated") === "true";
    marker = isTruncated ? xmlText(xml, "Marker") : undefined;
  } while (marker);

  return allUsers;
}

/**
 * List attached policies for a user.
 */
export async function listAttachedUserPolicies(
  config: AwsConfig,
  userName: string,
): Promise<IAMPolicy[]> {
  const result = await paginateIAM(
    config,
    "ListAttachedUserPolicies",
    "member",
    parsePolicy,
    { UserName: userName },
  );
  return result.items;
}
