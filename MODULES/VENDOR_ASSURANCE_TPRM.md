# Module: Vendor Assurance / Third-Party Risk (TPRM)

## Objective

Provide an automation-first third-party risk workflow that continuously maps vendor evidence into AtlasIT's compliance and risk posture.

## Core Capabilities

- Vendor inventory
- Tiering / ownership
- Security questionnaires
- SOC2 / ISO / DPA / BAA collection
- Document expiry alerts
- Risk scoring
- Approval workflows
- Reassessment cadences
- Trust Center publishing

## Key Integrations

- Compliance Digital Twin (control impact)
- Risk Scoring Engine (vendor risk contribution)
- Trust Center (approved evidence publication)
- Orchestrator (notifications, approvals, reassessment jobs)

## Security Requirements

- Treat all uploaded documents and questionnaire responses as untrusted
- Validate file type, size, and integrity before indexing
- Preserve immutable evidence lineage for any published trust artifact
