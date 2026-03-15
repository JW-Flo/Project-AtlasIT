# AtlasIT Development Roadmap & Architecture Overview

## 1. Project Vision

AtlasIT is being built as a **Cloudflare-native IT automation and security platform** aimed at small and mid-sized businesses that can’t afford dedicated IT teams. It integrates IAM lifecycle automation (Joiner–Mover–Leaver flows), connector orchestration, IdP management, compliance enforcement, and AI-driven adapter generation. The long-term goal is a **commercial SaaS** with open-source automator components, deployable at the edge via Cloudflare Workers and Pages.

---

## 2. Repository Structure

We currently operate a multi-repo workspace with three core repositories:

- **Project-AtlasIT**
  - Core backend logic, orchestrator services, IAM automation engine, SvelteKit platform frontend.
- **JW-Site**
  - Personal/portfolio site, immersive experience, will host AtlasIT as a subpage and provide project previews.
- **AWhittleWandering**
  - Standalone dynamic web app (Tesla-powered road trip project), but demo/preview will be embedded inside JW-Site `/projects`.

Each repo is integrated into a **multi-root VS Code workspace** with shared tooling, task definitions, and editor configs.

---

## 3. Architecture Plan

### Core Components

- **SvelteKit Apps** (per-repo): Edge-ready, deployed via Cloudflare Pages.
- **AtlasIT Orchestrator**: Cloudflare Worker service managing lifecycle jobs, adapter scaffolding, and AI-generated connectors.
- **Research Engine**: Discovers capabilities of SaaS providers, produces structured schemas for connector generation.
- **Adapter Generator**: Generates connector templates from schemas, validated via simulator.
- **IAM Automation Demo**: Joiner/Mover/Leaver flow simulation with task tracking, retry semantics, analytics.
- **IT & Security Policy Engine**: Define, enforce, and audit security baselines (MFA, password strength, endpoint posture).
- **Compliance Module**: Automated checks for SOC2, HIPAA, NIST CSF; generates reports and stores audit artifacts in R2.
- **IdP Management**: Central abstraction for existing IdPs (Okta, Entra/AD, Google, AWS).
- **Fallback IdP**: Lightweight built-in OIDC/SAML IdP for SMBs without an existing identity provider.
- **Security Extensions**: Zero-trust enforcement, anomaly detection, AI-driven recommendations.

### Workflow

1. **Research Engine** discovers provider.
2. **Adapter Generator** builds initial connector scaffold.
3. **Simulator** validates scaffold against defined contracts.
4. **Promotion** via transition checklist & feature flag.
5. **IAM Engine** consumes connector in J/M/L lifecycle demo.
6. **Policy & Compliance Layer** enforces org-wide security policies.
7. **IdP Management** provisions users into existing or fallback IdP.

---

## 4. Development Workflow (Multi-Agent)

- **Copilot**: Planner & committer.
  - Writes PR plans to `ops/hand-off.md`.
  - Marks sections READY once safe.
  - Commits/pushes staged worktrees from `.codex.done`.
- **Codex**: Executor.
  - Runs only PRs marked READY.
  - Executes fenced `### COMMAND PLAN`.
  - Stages changes in isolated git worktrees.
  - Writes results to `ops/.codex.done`.

This ensures safe, auditable progress with clean PRs.

---

## 5. Current PR Plans (Project-AtlasIT)

- **PR1**: Platform extract (conditional; skip if app exists).
- **PR2**: SvelteKit bootstrap (baseline).
- **PR3**: Restore JML demo.
- **PR4**: Implement adapter generator.
- **PR5**: Extend research engine to structured schema.
- **PR6**: Documentation & checklist alignment.

JW-Site & AWhittleWandering have matching **PR2** (SvelteKit bootstrap) and **PR6** (docs alignment).

---

## 6. Roadmap & Timeline

### Phase 1 — Migration & Bootstrap (Q1–Q2 2025)

- Migrate all apps (JW-Site, AtlasIT, AWhittleWandering) to SvelteKit.
- Ensure Cloudflare-native builds (no Node polyfills).
- Restore IAM demo functionality.

### Phase 2 — Engine & Orchestrator (Q2–Q3 2025)

- Build adapter generator service with templates.
- Connect research engine → generator → simulator.
- Integrate IAM analytics dashboard & observability pipeline.

### Phase 2.5 — Policy & Compliance Layer (Q3 2025)

- Implement IT/Security policy engine (policy-as-code).
- Add compliance checks and reporting exports.
- Store audit evidence in R2.

### Phase 3 — IdP Abstraction & Fallback (Q4 2025)

- Full IdP connector management (Okta/Entra/AWS/Google).
- Stood-up IdP service for SMBs with no provider.
- Policy enforcement at IdP layer.

### Phase 4 — Market Readiness (Q1–Q2 2026)

- Harden orchestrator and compliance modules.
- Documentation, demos, and project previews.
- Prepare SaaS tiering and sales collateral.

### Phase 5 — Commercialization & Security Expansion (2026)

- Launch AtlasIT as a commercial SaaS.
- AI-driven security recommendations.
- Deep compliance coverage and extensions.
- Expanded connector catalog.

---

## 7. Market Positioning

- Target: SMBs (1–100 employees) who want to internalize IT ops securely.
- Value prop: **“Stop being a slave to MSPs — manage IT internally and securely.”**
- Differentiator: Edge-native, AI-driven connector onboarding + policy + IdP fallback.

---

## 8. Next Steps

1. Copilot: Mark PR3 + PR4 READY in `Project-AtlasIT/ops/hand-off.md`.
2. Codex: Execute those plans, stage results, update `.codex.done`.
3. Copilot: Commit, push, and open draft PRs.
4. Review diffs, validate JML demo + adapter generator.
5. Begin Policy/Compliance engine scaffolding.

---

## 9. Long-Term Vision

AtlasIT evolves into a **modular platform**:

- **AtlasIT – IT Ops**: IAM automation, provisioning, SSO.
- **AtlasIT – AI Security**: Automated detection, remediation, and compliance.
- **AtlasIT – Compliance**: Evidence locker, reporting, regulatory alignment.
- **AtlasIT – IdP**: Unified IdP abstraction + fallback OIDC/SAML service.
- **AtlasIT – Extensions**: Custom connectors, retro game modes, immersive experiences.

---

**Status:** Bootstrap complete, headless executor workflow in place, PR3+PR4 pending READY.
**Goal:** Deliver a functional AtlasIT platform backend + dashboard, expand connector coverage, and integrate policy/compliance/IdP modules for SaaS launch.
