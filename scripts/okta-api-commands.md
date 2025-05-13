# Okta API Commands for AWS WorkSpaces Groups

These commands can be run in Postman, curl, or any API client to manage your AWS WorkSpaces Okta groups.

## Setup Variables

```bash
# Replace these values with your actual credentials
OKTA_DOMAIN="flosports.okta.com"
OKTA_API_TOKEN="00u978FMNsBbJAr979NS_wjlfEDDmjtH4YHCi0utV6"  # Replace with your actual token
```

## Create AWS WorkSpaces Groups

### 1. Create AWS_WorkSpacesAdmin Group

```bash
curl -X POST \
  "https://${OKTA_DOMAIN}/api/v1/groups" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: SSWS ${OKTA_API_TOKEN}" \
  -d '{
    "profile": {
      "name": "AWS_WorkSpacesAdmin",
      "description": "Administrators with full access to manage AWS WorkSpaces"
    }
  }'
```

### 2. Create AWS_WorkSpacesUser Group

```bash
curl -X POST \
  "https://${OKTA_DOMAIN}/api/v1/groups" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: SSWS ${OKTA_API_TOKEN}" \
  -d '{
    "profile": {
      "name": "AWS_WorkSpacesUser",
      "description": "Standard users with basic access to AWS WorkSpaces"
    }
  }'
```

## Find Group IDs

This command will help you find the ID of a specific group:

```bash
curl -X GET \
  "https://${OKTA_DOMAIN}/api/v1/groups?q=AWS_WorkSpacesAdmin" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: SSWS ${OKTA_API_TOKEN}"
```

## Delete a Group by ID

Once you have the group ID, you can delete it:

```bash
# Replace GROUP_ID with the actual ID from the find command above
GROUP_ID="00grbb41mbJPCfYsG697"  # Example ID, replace with real one

curl -X DELETE \
  "https://${OKTA_DOMAIN}/api/v1/groups/${GROUP_ID}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: SSWS ${OKTA_API_TOKEN}"
```

## Update Group Description

```bash
# Replace GROUP_ID with the actual ID from the find command above
GROUP_ID="00grbb41mbJPCfYsG697"  # Example ID, replace with real one

curl -X PUT \
  "https://${OKTA_DOMAIN}/api/v1/groups/${GROUP_ID}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: SSWS ${OKTA_API_TOKEN}" \
  -d '{
    "profile": {
      "name": "AWS_WorkSpacesAdmin", 
      "description": "Updated description for AWS WorkSpaces Administrators"
    }
  }'
```

## List All Groups

```bash
curl -X GET \
  "https://${OKTA_DOMAIN}/api/v1/groups" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: SSWS ${OKTA_API_TOKEN}"
```

## Add User to Group

```bash
# Replace GROUP_ID with the actual group ID and USER_ID with the Okta user ID
GROUP_ID="00grbb41mbJPCfYsG697"  # Example ID, replace with real one
USER_ID="00u123456789abcdef0"    # Example ID, replace with real one

curl -X PUT \
  "https://${OKTA_DOMAIN}/api/v1/groups/${GROUP_ID}/users/${USER_ID}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: SSWS ${OKTA_API_TOKEN}"
```

---

These commands represent the core functionality used in the successful `simple-okta-groups.sh` script. You can import them into Postman as a collection or run them directly from a terminal until your full automation system is developed.