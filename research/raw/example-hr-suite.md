# Example HR Suite

## Summary
Example HR Suite centralises employee lifecycle management, provisioning, and compliance checkpoints for mid-market teams.

## Entities
### Employee
Members of the organisation managed inside Example HR Suite.
- id: string (required) - Unique employee identifier
- email: string (required) - Primary work email
- status: enum[active,inactive,terminated] - Current employment state
- department: string - Employee department label
- hireDate: date - ISO 8601 hire date stamp

### Assignment
Represents role assignments mapped to downstream systems.
- id: string (required) - Unique assignment id
- employeeId: Employee (required) - Linked employee entity
- role: string (required) - Role name
- effectiveDate: date - Activation date
- permissions: string[] - Granted permissions bundle

## Operations
### GET /employees
Returns active employees for ingestion.
- summary: List employees
- returns: Employee[]

### GET /assignments
Surface employee assignment relationships for provisioning.
- summary: List assignments
- returns: Assignment[]
