# AtlasIT – Project Context Summary

## 1. Core Vision

AtlasIT is a Cloudflare-native, automation-first IT & security platform for SMB/mid-market. It consolidates identity lifecycle automation, compliance automation (Compliance Digital Twin), security orchestration, and AI Policy Codex into a unified automation console.

## 2. Repo & Workspace Setup

- Repos: Project-AtlasIT, JW-Site, AWhittleWandering
- Multi-root VSCode workspace with Copilot/Codex agent workflows

## 3. Architecture & Modules

- Orchestrator service
- Research engine + adapter generator
- IAM Engine (Joiner/Mover/Leaver)
- Policy/Compliance layer (SOC2, HIPAA, ISO, etc.)
- IdP abstraction
- Zero-Trust extensions
- Compliance Digital Twin

## 4. Market & Competitors

- Conservative TAM: ~$1.5–2B (US/global SMB compliance + IAM)
- Aspirational TAM: $10–15B+ (category creation)
- Competitors: Drata, Vanta, Tugboat, Secureframe, Okta, SailPoint, ServiceNow, Splunk Phantom, Palo Alto Cortex XSOAR
- Emerging threat: Lumos (AI-driven IGA)

## 5. Strategic Roadmap (0–60 mo)

- 0–6 mo: MVP, file provisionals, design partners
- 6–18 mo: AI Policy Codex v1, self-healing orchestration, SMB SaaS tiers
- 18–36 mo: Compliance Simulation Engine, MSSP marketplace, ARR $5–10M
- 36–60 mo: Auditless continuous certification, behavioral compliance agents, universal schema
- Exit path: acquisition (ServiceNow, CrowdStrike, Okta)

## 6. Patentability & IP

- Compliance Digital Twin (state engine tied to live identity/security events)
- Cross-domain orchestration graph
- AI Policy Codex
- Distributed governance fabric
- MSSP/SMB federated twins

Exhibit B carve-outs: AtlasIT platform, conversational AI analysis tool, playbooks & JML workflows.

## 7. Security & Reliability Requirements

- Threat modeling, OPA/Rego guardrails
- Vault integration, ephemeral creds
- Structured logging, error budgets, telemetry contracts
- Retry/circuit breaker, DR runbooks
- Conformance harnesses, golden adapters, code scanning
- SMB onboarding wizard, RBAC guardrails

## 8. AWS Side-Car Plan

- Cloudflare primary infra
- AWS for parallel storage/support stack (S3, RDS, IAM, CloudTrail)
- Free-tier IaC boilerplate staged
- Future migration possible

## 9. Copilot/Agent Prompts

- StackGen → AWS sidecar infra
- Copilot → CDT scaffold (rules, idempotency, HMAC, evidence store)
- LegalGPT → Patentability / Exhibit B validation
- Market Research → TAM, competitors, VC scan

## 10. Outputs Generated

- atlasit_roadmap.md
- AtlasIT_Strategic_Roadmap_AcquisitionPath.pdf
- atlasit_master_requirements.md
- AtlasIT_FutureState_Patentability_Roadmap.pdf
- atlas_it_repo_docs_starter_skeleton_for_vscode_copilot.md

---
**Bottom Line:** AtlasIT = SMB-first unified automation SaaS. Differentiators (CDT, AI Codex, orchestration graph) = potentially patentable IP. Competitive urgency high (Lumos). Priority = provisional filings + MVP within 6–12 months. Strategic exit = acquisition.
