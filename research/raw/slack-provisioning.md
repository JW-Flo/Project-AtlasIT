# Slack Provisioning

## Summary
Slack Provisioning automates workspace membership, channel enrollment, and deactivation workflows for distributed teams.

## Entities
### WorkspaceUser
Represents a user within the Slack workspace.
- id: string (required) - Slack internal user identifier
- email: string (required) - Unique email linked to the workspace user
- displayName: string - Human readable display name
- status: enum[active,disabled,deleted] - Lifecycle state for the workspace user
- roles: string[] - Collection of workspace roles (admin, owner, member)

### ChannelMembership
Tracks a member's relationship to Slack channels.
- id: string (required) - Unique membership identifier
- channelId: string (required) - Channel identifier
- userId: WorkspaceUser (required) - Linked workspace user
- membershipType: enum[member,guest,admin] - Type of membership
- joinedAt: datetime - Timestamp indicating when the user joined the channel
- isPinned: boolean - Whether the membership is pinned for provisioning purposes

## Operations
### GET /users
Return workspace users with provisioning details.
- summary: List workspace users
- returns: WorkspaceUser[]

### POST /users
Create a new workspace user.
- summary: Create workspace user
- returns: WorkspaceUser

### GET /channels/{channelId}/members
Return channel memberships for the specified channel.
- summary: List channel memberships
- returns: ChannelMembership[]
