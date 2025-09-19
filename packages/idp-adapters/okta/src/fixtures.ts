import usersJson from "../../../fixtures/idp/users.json" assert { type: "json" };
import groupsJson from "../../../fixtures/idp/groups.json" assert { type: "json" };
import type { IdpGroup, IdpUser } from "@atlasit/idp";

export const USERS = usersJson as IdpUser[];
export const GROUPS = groupsJson as IdpGroup[];
