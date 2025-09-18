# Google Workspace Admin

## Summary
Google Workspace Admin centralises identity, license, and group governance across Gmail, Drive, and third-party marketplace apps.

## Entities
### DirectoryUser
Directory user synchronized from HR or IdP sources.
- id: string (required) - Google directory user identifier
- primaryEmail: string (required) - Primary mailbox address
- orgUnitPath: string - Organizational unit path
- isSuspended: boolean - Suspension flag
- licenses: string[] - Assigned product SKU identifiers

### Group
Represents Google Group metadata used for access control.
- id: string (required) - Group identifier
- email: string (required) - Primary group email
- name: string - Friendly display name
- description: string - Group description
- directMembersCount: number - Count of direct members

### GroupMember
Relationship between directory users and groups.
- id: string (required) - Membership identifier
- groupId: Group (required) - Linked group
- userId: DirectoryUser (required) - Linked directory user
- role: enum[OWNER,MANAGER,MEMBER] - Role within the group
- joinedAt: datetime - Timestamp when membership was created

## Operations
### GET /directory/users
Retrieve directory users along with org unit and license metadata.
- summary: List directory users
- returns: DirectoryUser[]

### POST /directory/users
Create a new directory user record.
- summary: Create directory user
- returns: DirectoryUser

### GET /groups
Fetch Google Groups metadata.
- summary: List groups
- returns: Group[]

### GET /groups/{groupId}/members
Fetch memberships for a given Google Group.
- summary: List group members
- returns: GroupMember[]
