package atlasit.jml

default allow := false

# Allow joiner workflows when tenant is active and subject is unique
allow if {
  input.workflowType == "joiner"
  input.tenant.status == "active"
  input.subject.unique == true
}

# Allow mover workflows when subject exists and change is authorized
allow if {
  input.workflowType == "mover"
  input.subject.exists == true
  input.changeAuthorized == true
}

# Allow leaver workflows when subject exists and no legal hold
allow if {
  input.workflowType == "leaver"
  input.subject.exists == true
  input.legalHold == false
}

# SoD violation check
deny contains msg if {
  input.sodConflicts[_]
  msg := sprintf("Separation of Duties conflict: %v", [input.sodConflicts])
}
