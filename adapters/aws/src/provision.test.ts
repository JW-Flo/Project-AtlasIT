import { describe, it, expect, vi, afterEach } from "vitest";
import app from "./index.js";

// ---------------------------------------------------------------------------
// IAM XML response builders
// ---------------------------------------------------------------------------

function createUserXml(username: string): string {
  return `<CreateUserResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
    <CreateUserResult>
      <User>
        <Path>/atlasit/</Path>
        <UserName>${username}</UserName>
        <UserId>AIDIODR4TAW7CSEXAMPLE</UserId>
        <Arn>arn:aws:iam::123456789012:user/atlasit/${username}</Arn>
        <CreateDate>2024-01-01T00:00:00Z</CreateDate>
      </User>
    </CreateUserResult>
    <ResponseMetadata>
      <RequestId>req-1234</RequestId>
    </ResponseMetadata>
  </CreateUserResponse>`;
}

function tagUserXml(): string {
  return `<TagUserResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
    <ResponseMetadata>
      <RequestId>req-5678</RequestId>
    </ResponseMetadata>
  </TagUserResponse>`;
}

function errorXml(code: string, message: string): string {
  return `<ErrorResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
    <Error>
      <Type>Sender</Type>
      <Code>${code}</Code>
      <Message>${message}</Message>
    </Error>
    <RequestId>req-err</RequestId>
  </ErrorResponse>`;
}

function listAccessKeysXml(keyIds: string[] = []): string {
  const members = keyIds
    .map(
      (k) => `<member>
      <AccessKeyId>${k}</AccessKeyId>
      <Status>Active</Status>
      <UserName>testuser</UserName>
      <CreateDate>2024-01-01T00:00:00Z</CreateDate>
    </member>`,
    )
    .join("\n");
  return `<ListAccessKeysResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
    <ListAccessKeysResult>
      <AccessKeyMetadata>${members}</AccessKeyMetadata>
      <IsTruncated>false</IsTruncated>
    </ListAccessKeysResult>
    <ResponseMetadata><RequestId>req-lak</RequestId></ResponseMetadata>
  </ListAccessKeysResponse>`;
}

function listAttachedPoliciesXml(arns: string[] = []): string {
  const members = arns
    .map(
      (a) => `<member>
      <PolicyName>SomePolicy</PolicyName>
      <PolicyArn>${a}</PolicyArn>
    </member>`,
    )
    .join("\n");
  return `<ListAttachedUserPoliciesResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
    <ListAttachedUserPoliciesResult>
      <AttachedPolicies>${members}</AttachedPolicies>
      <IsTruncated>false</IsTruncated>
    </ListAttachedUserPoliciesResult>
    <ResponseMetadata><RequestId>req-lap</RequestId></ResponseMetadata>
  </ListAttachedUserPoliciesResponse>`;
}

function listGroupsXml(groupNames: string[] = []): string {
  const members = groupNames
    .map(
      (g) => `<member>
      <GroupName>${g}</GroupName>
      <GroupId>AGPAIDR4TAW7CSEXAMPLE</GroupId>
      <Arn>arn:aws:iam::123456789012:group/${g}</Arn>
      <Path>/</Path>
      <CreateDate>2024-01-01T00:00:00Z</CreateDate>
    </member>`,
    )
    .join("\n");
  return `<ListGroupsForUserResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
    <ListGroupsForUserResult>
      <Groups>${members}</Groups>
      <IsTruncated>false</IsTruncated>
    </ListGroupsForUserResult>
    <ResponseMetadata><RequestId>req-lgfu</RequestId></ResponseMetadata>
  </ListGroupsForUserResponse>`;
}

function deleteLoginProfileOkXml(): string {
  return `<DeleteLoginProfileResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
    <ResponseMetadata><RequestId>req-dlp</RequestId></ResponseMetadata>
  </DeleteLoginProfileResponse>`;
}

function deleteUserOkXml(): string {
  return `<DeleteUserResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">
    <ResponseMetadata><RequestId>req-du</RequestId></ResponseMetadata>
  </DeleteUserResponse>`;
}

function okResponse(xml: string) {
  return { ok: true, status: 200, text: async () => xml };
}

function errResponse(code: string, message: string, httpStatus = 409) {
  return { ok: false, status: httpStatus, text: async () => errorXml(code, message) };
}

// ---------------------------------------------------------------------------
// Env factory
// ---------------------------------------------------------------------------

function makeEnv(overrides: Record<string, unknown> = {}) {
  return {
    DB: {
      prepare: () => ({
        bind: () => ({
          first: async () => null,
          run: async () => ({ success: true }),
        }),
        run: async () => ({ success: true }),
      }),
    },
    ADAPTER_SECRET: "test-secret",
    ORCHESTRATOR_URL: "https://orchestrator.example.com",
    ADAPTER_NAME: "aws",
    AWS_ACCESS_KEY_ID: "AKIAIOSFODNN7EXAMPLE",
    AWS_SECRET_ACCESS_KEY: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    AWS_REGION: "us-east-1",
    CONNECTOR_ID: "aws",
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// POST /api/provision
// ---------------------------------------------------------------------------

describe("POST /api/provision — aws", () => {
  it("returns 400 when X-Tenant-ID header is missing", async () => {
    const req = new Request("http://localhost/api/provision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ tenantId: "tenant-1", userProfile: { email: "alice@example.com" } }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/X-Tenant-ID/);
  });

  it("returns 400 when tenantId is missing from the request body", async () => {
    const req = new Request("http://localhost/api/provision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ userProfile: { email: "alice@example.com" } }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/tenantId/);
  });

  it("returns 400 when userProfile.email is missing from the request body", async () => {
    const req = new Request("http://localhost/api/provision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ tenantId: "tenant-1", userProfile: {} }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/email/);
  });

  it("successfully creates an IAM user and tags it", async () => {
    const mockFetch = vi
      .fn()
      // CreateUser
      .mockResolvedValueOnce(okResponse(createUserXml("alice")))
      // TagUser
      .mockResolvedValueOnce(okResponse(tagUserXml()));

    vi.stubGlobal("fetch", mockFetch);

    const req = new Request("http://localhost/api/provision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({
        tenantId: "tenant-1",
        userProfile: { email: "alice@example.com" },
      }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(200);

    const body = await res.json() as {
      status: string;
      username: string;
      iamPath: string;
      email: string;
      tenantId: string;
    };
    expect(body.status).toBe("provisioned");
    expect(body.username).toBe("alice");
    expect(body.iamPath).toBe("/atlasit/");
    expect(body.email).toBe("alice@example.com");
    expect(body.tenantId).toBe("tenant-1");
  });

  it("handles EntityAlreadyExists gracefully and continues to tag the user", async () => {
    const mockFetch = vi
      .fn()
      // CreateUser returns EntityAlreadyExists
      .mockResolvedValueOnce(errResponse("EntityAlreadyExists", "User already exists", 409))
      // TagUser still succeeds
      .mockResolvedValueOnce(okResponse(tagUserXml()));

    vi.stubGlobal("fetch", mockFetch);

    const req = new Request("http://localhost/api/provision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({
        tenantId: "tenant-1",
        userProfile: { email: "alice@example.com" },
      }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe("provisioned");
  });

  it("returns 502 when CreateUser fails with a non-EntityAlreadyExists error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(errResponse("ServiceFailure", "IAM service unavailable", 500)),
    );

    const req = new Request("http://localhost/api/provision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({
        tenantId: "tenant-1",
        userProfile: { email: "bob@example.com" },
      }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(502);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/CreateUser failed/i);
    expect(body.error).toContain("ServiceFailure");
  });

  it("returns 502 when TagUser fails", async () => {
    const mockFetch = vi
      .fn()
      // CreateUser succeeds
      .mockResolvedValueOnce(okResponse(createUserXml("bob")))
      // TagUser fails
      .mockResolvedValueOnce(errResponse("InvalidInput", "Tag value too long", 400));

    vi.stubGlobal("fetch", mockFetch);

    const req = new Request("http://localhost/api/provision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({
        tenantId: "tenant-1",
        userProfile: { email: "bob@example.com" },
      }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(502);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/TagUser failed/i);
  });

  it("derives the IAM username from the email local part", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(okResponse(createUserXml("john.doe")))
      .mockResolvedValueOnce(okResponse(tagUserXml()));

    vi.stubGlobal("fetch", mockFetch);

    const req = new Request("http://localhost/api/provision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({
        tenantId: "tenant-1",
        userProfile: { email: "john.doe@example.com" },
      }),
    });

    const res = await app.fetch(req, makeEnv());
    const body = await res.json() as { username: string };
    expect(body.username).toBe("john.doe");
  });

  it("sends CreateUser with /atlasit/ path to IAM endpoint", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(okResponse(createUserXml("carol")))
      .mockResolvedValueOnce(okResponse(tagUserXml()));

    vi.stubGlobal("fetch", mockFetch);

    const req = new Request("http://localhost/api/provision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({
        tenantId: "tenant-1",
        userProfile: { email: "carol@example.com" },
      }),
    });

    await app.fetch(req, makeEnv());

    const createCall = mockFetch.mock.calls[0];
    expect(createCall[0]).toBe("https://iam.amazonaws.com/");
    const createBody = new URLSearchParams(createCall[1].body as string);
    expect(createBody.get("Action")).toBe("CreateUser");
    expect(createBody.get("UserName")).toBe("carol");
    expect(createBody.get("Path")).toBe("/atlasit/");
  });
});

// ---------------------------------------------------------------------------
// POST /api/deprovision
// ---------------------------------------------------------------------------

describe("POST /api/deprovision — aws", () => {
  it("returns 400 when X-Tenant-ID header is missing", async () => {
    const req = new Request("http://localhost/api/deprovision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ tenantId: "tenant-1", userProfile: { email: "alice@example.com" } }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/X-Tenant-ID/);
  });

  it("returns 400 when tenantId is missing from the request body", async () => {
    const req = new Request("http://localhost/api/deprovision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ userProfile: { email: "alice@example.com" } }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/tenantId/);
  });

  it("returns 400 when userProfile.email is missing from the request body", async () => {
    const req = new Request("http://localhost/api/deprovision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({ tenantId: "tenant-1", userProfile: {} }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/email/);
  });

  it("successfully deletes an IAM user after cleaning up access keys, policies, and groups", async () => {
    const mockFetch = vi
      .fn()
      // ListAccessKeys — no keys
      .mockResolvedValueOnce(okResponse(listAccessKeysXml([])))
      // ListAttachedUserPolicies — no policies
      .mockResolvedValueOnce(okResponse(listAttachedPoliciesXml([])))
      // ListGroupsForUser — no groups
      .mockResolvedValueOnce(okResponse(listGroupsXml([])))
      // DeleteLoginProfile — success
      .mockResolvedValueOnce(okResponse(deleteLoginProfileOkXml()))
      // DeleteUser — success
      .mockResolvedValueOnce(okResponse(deleteUserOkXml()));

    vi.stubGlobal("fetch", mockFetch);

    const req = new Request("http://localhost/api/deprovision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({
        tenantId: "tenant-1",
        userProfile: { email: "alice@example.com" },
      }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(200);

    const body = await res.json() as {
      status: string;
      username: string;
      tenantId: string;
    };
    expect(body.status).toBe("deprovisioned");
    expect(body.username).toBe("alice");
    expect(body.tenantId).toBe("tenant-1");
  });

  it("deletes access keys before deleting the user", async () => {
    const mockFetch = vi
      .fn()
      // ListAccessKeys — one key
      .mockResolvedValueOnce(okResponse(listAccessKeysXml(["AKIAIOSFODNN7KEY001"])))
      // DeleteAccessKey
      .mockResolvedValueOnce(okResponse("<DeleteAccessKeyResponse/>"))
      // ListAttachedUserPolicies — empty
      .mockResolvedValueOnce(okResponse(listAttachedPoliciesXml([])))
      // ListGroupsForUser — empty
      .mockResolvedValueOnce(okResponse(listGroupsXml([])))
      // DeleteLoginProfile
      .mockResolvedValueOnce(okResponse(deleteLoginProfileOkXml()))
      // DeleteUser
      .mockResolvedValueOnce(okResponse(deleteUserOkXml()));

    vi.stubGlobal("fetch", mockFetch);

    const req = new Request("http://localhost/api/deprovision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({
        tenantId: "tenant-1",
        userProfile: { email: "bob@example.com" },
      }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(200);

    // Verify DeleteAccessKey was called with the correct key id
    const deleteKeyCall = mockFetch.mock.calls[1];
    const deleteKeyBody = new URLSearchParams(deleteKeyCall[1].body as string);
    expect(deleteKeyBody.get("Action")).toBe("DeleteAccessKey");
    expect(deleteKeyBody.get("AccessKeyId")).toBe("AKIAIOSFODNN7KEY001");
  });

  it("detaches managed policies before deleting the user", async () => {
    const policyArn = "arn:aws:iam::aws:policy/ReadOnlyAccess";

    const mockFetch = vi
      .fn()
      // ListAccessKeys — empty
      .mockResolvedValueOnce(okResponse(listAccessKeysXml([])))
      // ListAttachedUserPolicies — one policy
      .mockResolvedValueOnce(okResponse(listAttachedPoliciesXml([policyArn])))
      // DetachUserPolicy
      .mockResolvedValueOnce(okResponse("<DetachUserPolicyResponse/>"))
      // ListGroupsForUser — empty
      .mockResolvedValueOnce(okResponse(listGroupsXml([])))
      // DeleteLoginProfile
      .mockResolvedValueOnce(okResponse(deleteLoginProfileOkXml()))
      // DeleteUser
      .mockResolvedValueOnce(okResponse(deleteUserOkXml()));

    vi.stubGlobal("fetch", mockFetch);

    const req = new Request("http://localhost/api/deprovision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({
        tenantId: "tenant-1",
        userProfile: { email: "carol@example.com" },
      }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(200);

    // Verify DetachUserPolicy was called with the correct policy ARN
    const detachCall = mockFetch.mock.calls[2];
    const detachBody = new URLSearchParams(detachCall[1].body as string);
    expect(detachBody.get("Action")).toBe("DetachUserPolicy");
    expect(detachBody.get("PolicyArn")).toBe(policyArn);
  });

  it("removes user from groups before deleting the user", async () => {
    const mockFetch = vi
      .fn()
      // ListAccessKeys — empty
      .mockResolvedValueOnce(okResponse(listAccessKeysXml([])))
      // ListAttachedUserPolicies — empty
      .mockResolvedValueOnce(okResponse(listAttachedPoliciesXml([])))
      // ListGroupsForUser — one group
      .mockResolvedValueOnce(okResponse(listGroupsXml(["Developers"])))
      // RemoveUserFromGroup
      .mockResolvedValueOnce(okResponse("<RemoveUserFromGroupResponse/>"))
      // DeleteLoginProfile
      .mockResolvedValueOnce(okResponse(deleteLoginProfileOkXml()))
      // DeleteUser
      .mockResolvedValueOnce(okResponse(deleteUserOkXml()));

    vi.stubGlobal("fetch", mockFetch);

    const req = new Request("http://localhost/api/deprovision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({
        tenantId: "tenant-1",
        userProfile: { email: "dave@example.com" },
      }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(200);

    // Verify RemoveUserFromGroup was called with the correct group name
    const removeCall = mockFetch.mock.calls[3];
    const removeBody = new URLSearchParams(removeCall[1].body as string);
    expect(removeBody.get("Action")).toBe("RemoveUserFromGroup");
    expect(removeBody.get("GroupName")).toBe("Developers");
  });

  it("treats NoSuchEntity from DeleteUser as already deprovisioned and returns success", async () => {
    const mockFetch = vi
      .fn()
      // ListAccessKeys — empty
      .mockResolvedValueOnce(okResponse(listAccessKeysXml([])))
      // ListAttachedUserPolicies — empty
      .mockResolvedValueOnce(okResponse(listAttachedPoliciesXml([])))
      // ListGroupsForUser — empty
      .mockResolvedValueOnce(okResponse(listGroupsXml([])))
      // DeleteLoginProfile — NoSuchEntity (ignored)
      .mockResolvedValueOnce(errResponse("NoSuchEntity", "Login profile does not exist", 404))
      // DeleteUser — NoSuchEntity
      .mockResolvedValueOnce(errResponse("NoSuchEntity", "User does not exist", 404));

    vi.stubGlobal("fetch", mockFetch);

    const req = new Request("http://localhost/api/deprovision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({
        tenantId: "tenant-1",
        userProfile: { email: "eve@example.com" },
      }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe("deprovisioned");
  });

  it("returns 502 when DeleteUser fails with a non-NoSuchEntity error", async () => {
    const mockFetch = vi
      .fn()
      // ListAccessKeys — empty
      .mockResolvedValueOnce(okResponse(listAccessKeysXml([])))
      // ListAttachedUserPolicies — empty
      .mockResolvedValueOnce(okResponse(listAttachedPoliciesXml([])))
      // ListGroupsForUser — empty
      .mockResolvedValueOnce(okResponse(listGroupsXml([])))
      // DeleteLoginProfile — NoSuchEntity (ignored)
      .mockResolvedValueOnce(errResponse("NoSuchEntity", "No profile", 404))
      // DeleteUser — unexpected failure
      .mockResolvedValueOnce(errResponse("DeleteConflict", "User has resources attached", 409));

    vi.stubGlobal("fetch", mockFetch);

    const req = new Request("http://localhost/api/deprovision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({
        tenantId: "tenant-1",
        userProfile: { email: "frank@example.com" },
      }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(502);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/DeleteUser failed/i);
    expect(body.error).toContain("DeleteConflict");
  });

  it("ignores NoSuchEntity from DeleteLoginProfile and proceeds to DeleteUser", async () => {
    const mockFetch = vi
      .fn()
      // ListAccessKeys — empty
      .mockResolvedValueOnce(okResponse(listAccessKeysXml([])))
      // ListAttachedUserPolicies — empty
      .mockResolvedValueOnce(okResponse(listAttachedPoliciesXml([])))
      // ListGroupsForUser — empty
      .mockResolvedValueOnce(okResponse(listGroupsXml([])))
      // DeleteLoginProfile — NoSuchEntity
      .mockResolvedValueOnce(errResponse("NoSuchEntity", "No login profile", 404))
      // DeleteUser — success
      .mockResolvedValueOnce(okResponse(deleteUserOkXml()));

    vi.stubGlobal("fetch", mockFetch);

    const req = new Request("http://localhost/api/deprovision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": "tenant-1",
        Authorization: "Bearer test",
      },
      body: JSON.stringify({
        tenantId: "tenant-1",
        userProfile: { email: "grace@example.com" },
      }),
    });

    const res = await app.fetch(req, makeEnv());
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe("deprovisioned");

    // DeleteUser should still have been called (5th overall call)
    expect(mockFetch).toHaveBeenCalledTimes(5);
    const deleteUserCall = mockFetch.mock.calls[4];
    const deleteUserBody = new URLSearchParams(deleteUserCall[1].body as string);
    expect(deleteUserBody.get("Action")).toBe("DeleteUser");
  });
});
