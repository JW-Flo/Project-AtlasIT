# AtlasIT Architecture Snapshot (Strategic Addendum)

This top-level architecture snapshot complements `docs/architecture.md` and reflects current strategic module boundaries.

## Unified Platform Domains

1. Identity Lifecycle (JML)
2. Compliance Digital Twin (CDT)
3. Security Orchestration
4. Vendor Assurance / Third-Party Risk (TPRM)
5. Exposure Management / Threat Scanning

## Expanded Component Diagram

```text
JML + Directory Events ───────────────┐
                                      ├─> Orchestrator ──────────┐
Vendor Evidence + Questionnaires ─────┤                           ├─> Risk Scoring Engine ─> CDT
                                      │                           │
External Attack Surface Findings ─────┘                           └─> Trust Center
```

## New Strategic Engines

- Vendor Assurance Engine
- Trust Center Service
- Exposure Scanner
- Risk Scoring Engine

For detailed responsibilities, data flows, and controls, use `docs/architecture.md` as the canonical source.
