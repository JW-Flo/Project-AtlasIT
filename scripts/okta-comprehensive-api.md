# Comprehensive Okta API Collection for Postman

This collection contains all the essential Okta API calls for managing groups, users, applications, and more. You can import these into Postman or use them directly via curl.

## Environment Variables for Postman

Create these variables in your Postman environment:

```
OKTA_DOMAIN: flosports.okta.com
OKTA_API_TOKEN: 00u978FMNsBbJAr979NS_wjlfEDDmjtH4YHCi0utV6
```

## Group Management

### List All Groups

```http
GET https://{{OKTA_DOMAIN}}/api/v1/groups
Accept: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}
```

### Create Group

```http
POST https://{{OKTA_DOMAIN}}/api/v1/groups
Accept: application/json
Content-Type: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}

{
  "profile": {
    "name": "AWS_WorkSpacesAdmin",
    "description": "Administrators with full access to manage AWS WorkSpaces"
  }
}
```

### Get Group by ID

```http
GET https://{{OKTA_DOMAIN}}/api/v1/groups/{{GROUP_ID}}
Accept: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}
```

### Search Groups by Name

```http
GET https://{{OKTA_DOMAIN}}/api/v1/groups?q={{GROUP_NAME}}
Accept: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}
```

### Update Group

```http
PUT https://{{OKTA_DOMAIN}}/api/v1/groups/{{GROUP_ID}}
Accept: application/json
Content-Type: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}

{
  "profile": {
    "name": "AWS_WorkSpacesAdmin",
    "description": "Updated description for AWS WorkSpaces Administrators"
  }
}
```

### Delete Group

```http
DELETE https://{{OKTA_DOMAIN}}/api/v1/groups/{{GROUP_ID}}
Accept: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}
```

## User Management

### List All Users

```http
GET https://{{OKTA_DOMAIN}}/api/v1/users
Accept: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}
```

### Create User

```http
POST https://{{OKTA_DOMAIN}}/api/v1/users
Accept: application/json
Content-Type: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}

{
  "profile": {
    "firstName": "John",
    "lastName": "Contractor",
    "email": "jcontractor@flosports.tv",
    "login": "jcontractor@flosports.tv"
  },
  "credentials": {
    "password": {
      "value": "Temporary123!"
    }
  }
}
```

### Get User by ID

```http
GET https://{{OKTA_DOMAIN}}/api/v1/users/{{USER_ID}}
Accept: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}
```

### Search Users by Email

```http
GET https://{{OKTA_DOMAIN}}/api/v1/users?search=profile.email eq "{{EMAIL}}"
Accept: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}
```

### Update User

```http
POST https://{{OKTA_DOMAIN}}/api/v1/users/{{USER_ID}}
Accept: application/json
Content-Type: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}

{
  "profile": {
    "firstName": "John",
    "lastName": "Contractor",
    "email": "jcontractor@flosports.tv",
    "title": "SRE Contractor"
  }
}
```

### Deactivate User

```http
POST https://{{OKTA_DOMAIN}}/api/v1/users/{{USER_ID}}/lifecycle/deactivate
Accept: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}
```

### Activate User

```http
POST https://{{OKTA_DOMAIN}}/api/v1/users/{{USER_ID}}/lifecycle/activate
Accept: application/json
Content-Type: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}

{
  "sendEmail": true
}
```

### Reset Password

```http
POST https://{{OKTA_DOMAIN}}/api/v1/users/{{USER_ID}}/lifecycle/reset_password
Accept: application/json
Content-Type: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}

{
  "sendEmail": true
}
```

## User-Group Management

### Add User to Group

```http
PUT https://{{OKTA_DOMAIN}}/api/v1/groups/{{GROUP_ID}}/users/{{USER_ID}}
Accept: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}
```

### Remove User from Group

```http
DELETE https://{{OKTA_DOMAIN}}/api/v1/groups/{{GROUP_ID}}/users/{{USER_ID}}
Accept: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}
```

### List Groups for User

```http
GET https://{{OKTA_DOMAIN}}/api/v1/users/{{USER_ID}}/groups
Accept: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}
```

### List Users in Group

```http
GET https://{{OKTA_DOMAIN}}/api/v1/groups/{{GROUP_ID}}/users
Accept: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}
```

## Application Management

### List All Applications

```http
GET https://{{OKTA_DOMAIN}}/api/v1/apps
Accept: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}
```

### Get Application by ID

```http
GET https://{{OKTA_DOMAIN}}/api/v1/apps/{{APP_ID}}
Accept: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}
```

### Assign User to Application

```http
POST https://{{OKTA_DOMAIN}}/api/v1/apps/{{APP_ID}}/users
Accept: application/json
Content-Type: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}

{
  "id": "{{USER_ID}}",
  "scope": "USER",
  "credentials": {
    "userName": "jcontractor@flosports.tv"
  }
}
```

### Assign Group to Application

```http
PUT https://{{OKTA_DOMAIN}}/api/v1/apps/{{APP_ID}}/groups/{{GROUP_ID}}
Accept: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}
```

### Unassign User from Application

```http
DELETE https://{{OKTA_DOMAIN}}/api/v1/apps/{{APP_ID}}/users/{{USER_ID}}
Accept: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}
```

### Unassign Group from Application

```http
DELETE https://{{OKTA_DOMAIN}}/api/v1/apps/{{APP_ID}}/groups/{{GROUP_ID}}
Accept: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}
```

### List Users Assigned to Application

```http
GET https://{{OKTA_DOMAIN}}/api/v1/apps/{{APP_ID}}/users
Accept: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}
```

### List Groups Assigned to Application

```http
GET https://{{OKTA_DOMAIN}}/api/v1/apps/{{APP_ID}}/groups
Accept: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}
```

## AWS WorkSpaces Automation (Project-Ignite Specific)

### Create Both AWS WorkSpaces Groups

```http
# First create AWS_WorkSpacesAdmin
POST https://{{OKTA_DOMAIN}}/api/v1/groups
Accept: application/json
Content-Type: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}

{
  "profile": {
    "name": "AWS_WorkSpacesAdmin",
    "description": "Administrators with full access to manage AWS WorkSpaces"
  }
}

# Then create AWS_WorkSpacesUser
POST https://{{OKTA_DOMAIN}}/api/v1/groups
Accept: application/json
Content-Type: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}

{
  "profile": {
    "name": "AWS_WorkSpacesUser", 
    "description": "Standard users with basic access to AWS WorkSpaces"
  }
}
```

### Onboard SRE Contractor (Complete Flow)

```http
# 1. Create user
POST https://{{OKTA_DOMAIN}}/api/v1/users
Accept: application/json
Content-Type: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}

{
  "profile": {
    "firstName": "John",
    "lastName": "Contractor",
    "email": "jcontractor@flosports.tv",
    "login": "jcontractor@flosports.tv",
    "title": "SRE Contractor"
  },
  "credentials": {
    "password": {
      "value": "Temporary123!"
    }
  }
}

# 2. Once user is created, get the user ID from the response, then add to AWS_WorkSpacesUser group
PUT https://{{OKTA_DOMAIN}}/api/v1/groups/{{GROUP_ID}}/users/{{USER_ID}}
Accept: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}

# 3. Assign to necessary applications (get APP_ID from List Applications call)
POST https://{{OKTA_DOMAIN}}/api/v1/apps/{{APP_ID}}/users
Accept: application/json
Content-Type: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}

{
  "id": "{{USER_ID}}",
  "scope": "USER"
}
```

## Testing APIs

### Health Check

```http
GET https://{{OKTA_DOMAIN}}/api/v1/users/me
Accept: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}
```

### Rate Limit Check

```http
GET https://{{OKTA_DOMAIN}}/api/v1/users?limit=1
Accept: application/json
Authorization: SSWS {{OKTA_API_TOKEN}}
```

Response headers will include:
- `x-rate-limit-limit`: Rate limit maximum
- `x-rate-limit-remaining`: Remaining calls in window
- `x-rate-limit-reset`: Time when limit resets (Unix time)

## Importing into Postman

1. Copy this entire file
2. In Postman, choose "Import" > "Raw text" and paste the content
3. Postman will extract all the requests above into a collection
4. Set up your environment variables (OKTA_DOMAIN, OKTA_API_TOKEN)

Alternatively, save this file as a .md file, and either:
- Import it into Postman directly
- Use a converter tool to create a Postman collection JSON

## Using with AWS WorkSpaces Automation

The AWS WorkSpaces automation for SRE contractors (as described in Project Ignite Charter) requires:

1. Creating the AWS_WorkSpacesAdmin and AWS_WorkSpacesUser groups in Okta
2. Onboarding SRE contractors with proper group membership
3. Setting up the appropriate application assignments
4. Coordinating with the AWS Terraform modules for WorkSpaces provisioning

These API calls enable you to manually perform all Okta-side operations required for the AWS WorkSpaces automation, and can be used as reference for building the automation scripts.