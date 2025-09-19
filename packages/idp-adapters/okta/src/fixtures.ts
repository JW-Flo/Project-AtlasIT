import usersFixture from "../fixtures/idp/users.json" assert { type: "json" };
import groupsFixture from "../fixtures/idp/groups.json" assert { type: "json" };
import type { IdpGroup, IdpUser } from "@atlasit/idp";

export interface OktaFixtureUser extends IdpUser {
  groups: string[];
  status: "active" | "inactive" | "suspended" | string;
}

export interface OktaFixtureGroup extends IdpGroup {
  members: string[];
}

function clone<T>(value: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

const USERS: OktaFixtureUser[] = usersFixture as OktaFixtureUser[];
const GROUPS: OktaFixtureGroup[] = groupsFixture as OktaFixtureGroup[];

export function loadFixtureUsers(): OktaFixtureUser[] {
  return clone(USERS);
}

export function loadFixtureGroups(): OktaFixtureGroup[] {
  return clone(GROUPS);
}
