# Data Schema Overview

This document summarizes the current D1 (SQLite) schema for the onboarding service.

## Tables

### tenants

| Column     | Type       | Notes                                                    |
| ---------- | ---------- | -------------------------------------------------------- |
| id         | INTEGER PK | Autoincrement                                            |
| name       | TEXT       | Tenant display name                                      |
| industry   | TEXT       | Industry segment (enum constrained at application layer) |
| created_at | TEXT       | ISO timestamp                                            |

### onboarding_sessions

| Column             | Type                               | Notes                                                       |
| ------------------ | ---------------------------------- | ----------------------------------------------------------- |
| id                 | INTEGER PK                         | Autoincrement                                               |
| tenant_id          | INTEGER FK -> tenants(id)          | Owning tenant                                               |
| status             | TEXT                               | workflow status (draft/submitted/processing/complete/error) |
| created_at         | TEXT                               | ISO timestamp                                               |
| updated_at         | TEXT                               | ISO timestamp (updated on state change)                     |
| answers_json       | TEXT                               | JSON string of user answers (added in 0002)                 |
| policy_baseline_id | INTEGER FK -> policy_baselines(id) | Linked baseline (added in 0002)                             |

### policy_baselines (0002)

| Column        | Type                      | Notes                                 |
| ------------- | ------------------------- | ------------------------------------- |
| id            | INTEGER PK                | Autoincrement                         |
| tenant_id     | INTEGER FK -> tenants(id) | Scope                                 |
| version       | TEXT                      | Semantic or hash version label        |
| name          | TEXT                      | Baseline name                         |
| description   | TEXT                      | Optional description                  |
| controls_json | TEXT                      | JSON array of controls / requirements |
| created_at    | TEXT                      | Timestamp                             |

Unique: (tenant_id, version)

### audit_events (0002)

| Column       | Type                                       | Notes                                    |
| ------------ | ------------------------------------------ | ---------------------------------------- | ---- | ------------------ |
| id           | INTEGER PK                                 | Autoincrement                            |
| tenant_id    | INTEGER FK -> tenants(id)                  | Scope                                    |
| session_id   | INTEGER FK -> onboarding_sessions(id) NULL | Optional related session                 |
| actor        | TEXT                                       | system                                   | user | api key identifier |
| event_type   | TEXT                                       | e.g. session.created, baseline.generated |
| details_json | TEXT                                       | JSON payload with event-specific fields  |
| created_at   | TEXT                                       | Timestamp                                |

Indexes: tenant_id, session_id, event_type

## Migration Order

1. 0001_initial.sql
2. 0002_policy_audit.sql

## Schema Hash

Run: `npm run schema:hash` to compute a hash of all migration files for drift detection.

## Future Additions

- risk_assessments table for expanded compliance workflows
- prompt_versions table if persisted prompt metadata becomes necessary
