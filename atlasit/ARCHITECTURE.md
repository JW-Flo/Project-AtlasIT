# AtlasIT Architecture

**Status**: Baseline  
**Owner**: Platform Team  
**Last Updated**: 2025-11-05

## Overview

AtlasIT is a cloud-first IT management platform for SMBs, built on Cloudflare Workers, Durable Objects, and serverless infrastructure. The platform orchestrates identity lifecycle management (JML), policy enforcement, and compliance evidence generation.

## Core Components

### 1. JML Engine (Joiner/Mover/Leaver)

The JML Engine coordinates user lifecycle workflows as Durable Object-backed sagas:

- **Joiner**: Onboard new users, provision accounts, enforce MFA
- **Mover**: Transfer users between roles/departments
- **Leaver**: Offboard users, revoke access, archive data

Each workflow emits evidence artifacts for audit and compliance.

### 2. Policy Engine

Evaluates policies against subjects (users, devices, contexts) using:

- Policy packs with versioned rules (DSL/CEL subset)
- Deterministic evaluation with evidence generation
- Hash-addressed storage in R2 for immutability

### 3. Evidence System

Cryptographically verifiable audit trail:

- SHA-256 content-addressed storage
- Canonical JSON serialization
- R2 + D1 index for fast retrieval
- Tamper-evident evidence envelopes

### 4. Adapters

Pluggable connectors for external systems:

- Identity Providers (Okta, Google Workspace, Entra ID)
- SaaS Applications (Ramp, Slack, etc.)
- HR Systems (BambooHR, Rippling)
- Mock adapters for testing

## Architecture Principles

1. **No Static Secrets**: Use OIDC, Vault, or runtime-scoped credentials
2. **Evidence First**: All actions emit verifiable evidence
3. **Idempotent Operations**: Safe to retry, deterministic outcomes
4. **Tenant Isolation**: Durable Objects scoped per tenant
5. **Fail-Safe Defaults**: Explicit allow model for access control

## Data Flow

```
User Request → API Gateway → JML Engine (DO) → Adapters → External Systems
                                  ↓
                           Evidence Writer → R2 + D1
                                  ↓
                           Policy Evaluation → Compliance Check
```

## Security Model

- **Authentication**: Cloudflare Access + tenant-scoped tokens
- **Authorization**: Policy-driven with explicit grants
- **Secrets**: HashiCorp Vault integration (planned)
- **Audit**: All mutations logged with evidence hashes

## Compliance

- SOC2 Type II ready architecture
- GDPR data retention controls
- Evidence retention: indefinite (configurable per tenant)
- Snapshot generation: nightly per tenant

## Future Architecture

- Multi-region deployment (EU, US, APAC)
- Event-driven architecture with EventBridge
- Step Functions for long-running workflows
- AI-assisted policy recommendations

## References

- [JML Engine](../docs/JML_ENGINE.md)
- [Policy and Evidence](../docs/POLICY_AND_EVIDENCE.md)
- [Platform Foundation](../docs/PLATFORM_FOUNDATION.md)
