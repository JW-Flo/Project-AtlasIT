package atlasit.evidence

import future.keywords.if
import future.keywords.in
import future.keywords.contains

# Evidence validation rules per EVIDENCE_SCHEMA.json

# Required fields validation
deny contains msg if {
    input.evidence
    not input.evidence.trace_id
    msg := "Evidence artifact missing required field: trace_id"
}

deny contains msg if {
    input.evidence
    not input.evidence.control_id
    msg := "Evidence artifact missing required field: control_id"
}

deny contains msg if {
    input.evidence
    not input.evidence.timestamp
    msg := "Evidence artifact missing required field: timestamp"
}

# Control ID format validation
deny contains msg if {
    input.evidence.control_id
    not regex.match(`^[A-Z]+-[A-Z0-9-]+$`, input.evidence.control_id)
    msg := sprintf("Invalid control_id format: %s (expected pattern: ^[A-Z]+-[A-Z0-9-]+$)", [input.evidence.control_id])
}

# UUID format validation for trace_id
deny contains msg if {
    input.evidence.trace_id
    not regex.match(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`, input.evidence.trace_id)
    msg := sprintf("Invalid trace_id format: %s (expected UUID)", [input.evidence.trace_id])
}

# Timestamp ISO 8601 format validation
deny contains msg if {
    input.evidence.timestamp
    not regex.match(`^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}`, input.evidence.timestamp)
    msg := sprintf("Invalid timestamp format: %s (expected ISO 8601)", [input.evidence.timestamp])
}

# Result enum validation
deny contains msg if {
    input.evidence.result
    not input.evidence.result in ["pass", "fail", "skip", "error"]
    msg := sprintf("Invalid result value: %s (must be pass, fail, skip, or error)", [input.evidence.result])
}

# Allow if no deny rules triggered
allow if {
    count(deny) == 0
}

# Helper to validate complete evidence artifact
valid_evidence if {
    input.evidence.trace_id
    input.evidence.control_id
    input.evidence.timestamp
    allow
}
