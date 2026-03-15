package atlasit.authz

default allow := false

# Allow workflow execution only to principals with role "automation:execute"
allow if {
  input.action == "workflow.execute"
  some r in input.subject.roles
  r == "automation:execute"
  input.tenantId == input.subject.tenantId
}

# Allow evidence read for principals with "evidence:read"
allow if {
  input.action == "evidence.read"
  some r in input.subject.roles
  r == "evidence:read"
  input.tenantId == input.subject.tenantId
}

# Allow admin actions for "admin:*" role
allow if {
  some r in input.subject.roles
  startswith(r, "admin:")
  input.tenantId == input.subject.tenantId
}

# Deny retention purge unless "admin:retention" present
deny contains msg if {
  input.action == "retention.purge"
  not "admin:retention" in input.subject.roles
  msg := "missing required role admin:retention"
}
