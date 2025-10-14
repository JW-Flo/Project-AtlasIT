# Service Level Objectives (SLO)

Last Updated: 2025-10-14
Status: Baseline v1.0
Owner: Platform Engineering

## Overview

This document defines Service Level Objectives (SLOs) for the AtlasIT platform. These objectives establish measurable targets for system reliability, performance, and availability.

## SLO Definitions

### 1. API Availability

**Objective:** 99.9% availability for all public API endpoints

**Measurement:**

- Success rate = (successful requests / total requests) × 100
- Measured over rolling 30-day window
- Excludes planned maintenance windows (announced 48h in advance)

**Error Budget:**

- Monthly budget: 0.1% = ~43 minutes downtime per month
- Alert threshold: 50% of budget consumed in any 7-day period

**Current Status:** ✅ Baseline established, monitoring in place

---

### 2. API Response Time

**Objective:** p95 latency targets by endpoint type

| Endpoint Category   | p95 Target | p99 Target | Notes                       |
| ------------------- | ---------- | ---------- | --------------------------- |
| Health checks       | <50ms      | <100ms     | `/health`, `/healthz`       |
| Compliance snapshot | <150ms     | <300ms     | `/api/compliance/snapshot`  |
| Evidence search     | <200ms     | <500ms     | `/api/evidence/search`      |
| Policy evaluation   | <90ms      | <200ms     | `/api/v1/policy/evaluate`   |
| Workflow execution  | <2000ms    | <5000ms    | `/api/v1/workflows/execute` |
| Report generation   | <5000ms    | <10000ms   | Complex aggregations        |

**Measurement:**

- Measured at edge (Cloudflare Workers)
- Excludes client network latency
- Calculated from structured logs with correlation IDs

**Current Status:** ⚙️ In Progress - Collection active, thresholds being validated

---

### 3. Data Freshness

**Objective:** Compliance snapshot age <15 minutes

**Measurement:**

- `ageSeconds` field in `/api/compliance/snapshot` response
- Target: <900 seconds (15 minutes)
- Alert: >1800 seconds (30 minutes)

**Current Status:** ✅ Implemented, metric exposed in API

---

### 4. Data Durability

**Objective:** 99.999999999% (11 nines) durability for stored evidence

**Measurement:**

- Evidence stored in R2 (Cloudflare R2 provides this guarantee)
- Verification: Monthly integrity check of evidence hashes
- Recovery Time Objective (RTO): <4 hours
- Recovery Point Objective (RPO): <1 hour

**Current Status:** ✅ R2 provides durability guarantee, hash verification implemented

---

### 5. Workflow Reliability

**Objective:** 98% successful workflow execution rate

**Measurement:**

- Success rate = (completed workflows / total workflows) × 100
- Excludes workflows failed due to invalid input (4xx errors)
- Measured over rolling 7-day window

**Error Budget:**

- Weekly budget: 2% failure rate
- Alert threshold: 5% failure rate in any 24-hour period

**Current Status:** ⚙️ In Progress - Workflow tracking exists, metrics being collected

---

### 6. Security Scan Coverage

**Objective:** 100% of commits scanned for secrets and vulnerabilities

**Measurement:**

- Pre-commit hooks active for secret scanning
- CI pipeline runs on all PRs
- Zero high/critical vulnerabilities in production

**Gates:**

- Pre-commit: `scripts/scan-secrets.js` must pass
- CI: `npm audit` for dependencies
- Pre-deploy: All security checks must pass

**Current Status:** ✅ Secret scanning active, dependency audit in place

---

## Monitoring & Alerting

### Health Endpoint Structure

All services expose `/health` endpoints with the following structure:

```json
{
  "status": "healthy",
  "service": "service-name",
  "timestamp": "2025-10-14T07:48:23.326Z",
  "requestId": "uuid",
  "quota": {
    "date": "2025-10-14",
    "used": 42,
    "limit": 500,
    "remaining": 458
  },
  "rateLimit": {
    "windowSeconds": 60,
    "burst": 10
  },
  "snapshotAgeSeconds": 120,
  "evidenceCount": 145
}
```

### Key Metrics Collected

| Metric                     | Type      | Description                        | Alert Threshold    |
| -------------------------- | --------- | ---------------------------------- | ------------------ |
| `request_duration_ms`      | Histogram | Request latency by endpoint        | p95 > target + 50% |
| `request_errors_total`     | Counter   | Total error count by status code   | Rate > 5%          |
| `snapshot_age_seconds`     | Gauge     | Age of compliance snapshot         | >1800 (30 min)     |
| `evidence_count`           | Gauge     | Total indexed evidence items       | -                  |
| `evidence_ingest_total`    | Counter   | Evidence ingestion volume          | -                  |
| `workflow_execution_total` | Counter   | Workflow execution count by status | Failure rate >5%   |
| `ai_quota_used`            | Gauge     | Daily AI request quota consumption | >90% of limit      |

---

## Performance Budgets

### Bundle Size Targets

| Asset Type      | Target | Alert Threshold | Notes                    |
| --------------- | ------ | --------------- | ------------------------ |
| Worker bundle   | <1MB   | >1.5MB          | Cloudflare limit: 10MB   |
| Console app JS  | <500KB | >750KB          | Initial load performance |
| Console app CSS | <100KB | >150KB          | Initial load performance |

### Build Time Targets

| Build Type             | Target | Alert Threshold |
| ---------------------- | ------ | --------------- |
| TypeScript compilation | <30s   | >60s            |
| Vitest unit tests      | <60s   | >120s           |
| Full CI pipeline       | <5min  | >10min          |

---

## Incident Response Targets

### Severity Levels

| Severity      | Response Time     | Resolution Target | Examples                                     |
| ------------- | ----------------- | ----------------- | -------------------------------------------- |
| P0 - Critical | 15 min            | 4 hours           | Service completely unavailable               |
| P1 - High     | 1 hour            | 24 hours          | Major feature broken, security vulnerability |
| P2 - Medium   | 4 hours           | 1 week            | Minor feature degradation                    |
| P3 - Low      | Next business day | 1 month           | Cosmetic issues, documentation               |

### Communication SLOs

- **Incident Declaration:** Within 15 minutes of detection
- **Status Update Frequency:** Every 30 minutes during P0/P1 incidents
- **Post-Incident Report:** Within 48 hours of resolution

---

## Baseline Performance Data

### Current Measurements (as of 2025-10-14)

Based on health endpoint data and structured logs:

| Metric                  | Current Measurement | Target | Status           |
| ----------------------- | ------------------- | ------ | ---------------- |
| Health endpoint p95     | ~35ms               | <50ms  | ✅ Within target |
| Compliance snapshot p95 | ~120ms              | <150ms | ✅ Within target |
| Evidence search p95     | ~180ms              | <200ms | ✅ Within target |
| Policy evaluate p95     | ~75ms               | <90ms  | ✅ Within target |
| Snapshot age            | ~2min               | <15min | ✅ Within target |

**Note:** These are initial measurements from development environment. Production measurements will be tracked separately.

---

## SLO Review Process

### Review Cadence

- **Weekly:** Automated SLO dashboard review
- **Monthly:** Engineering team SLO review meeting
- **Quarterly:** Comprehensive SLO revision and adjustment

### Adjustment Criteria

SLOs may be adjusted based on:

1. Sustained achievement (tighten targets)
2. Consistent miss with valid business justification (relax targets)
3. New feature requirements
4. Infrastructure changes
5. Customer feedback and business needs

### Change Log

| Date       | SLO Changed      | Old Value | New Value | Reason               |
| ---------- | ---------------- | --------- | --------- | -------------------- |
| 2025-10-14 | Initial baseline | N/A       | See above | Initial SLO document |

---

## Future Enhancements

### Planned Additions (Q1 2026)

1. **Multi-region SLOs**
   - Per-region latency targets
   - Cross-region replication SLOs

2. **Advanced Metrics**
   - Apdex score for user experience
   - Time to first byte (TTFB) tracking
   - Client-side performance metrics (Core Web Vitals)

3. **Automated SLO Reporting**
   - Weekly SLO burn rate reports
   - Automated incident creation on SLO breach
   - SLO dashboard with real-time status

4. **Customer-Specific SLOs**
   - Tenant-level performance tracking
   - Custom SLO agreements for enterprise customers

---

## References

- Platform Foundation: `docs/PLATFORM_FOUNDATION.md`
- Observability Strategy: `docs/OBSERVABILITY.md`
- Data Retention: `docs/DATA_RETENTION_MATRIX.md`
- Incident Response: (To be created: `docs/INCIDENT_RESPONSE.md`)

---

## Appendix A: SLO Calculation Examples

### Example 1: API Availability

```
Total requests in 30 days: 1,000,000
Failed requests: 500
Availability = (1,000,000 - 500) / 1,000,000 × 100 = 99.95%
Status: ✅ Meets 99.9% target
```

### Example 2: Error Budget Consumption

```
Monthly error budget: 0.1% = 1,000 failed requests allowed
Current failures: 500
Budget consumed: 500 / 1,000 = 50%
Status: ⚠️ Half budget consumed, monitor closely
```

### Example 3: p95 Latency Calculation

```
100 requests recorded:
[10ms, 12ms, 15ms, ..., 180ms, 220ms, 450ms]
Sorted and p95 (95th percentile) = request at position 95 = 180ms
Target: <150ms
Status: ❌ Exceeds target, investigation needed
```

---

## Appendix B: Monitoring Implementation

### Structured Log Format

```json
{
  "level": "info",
  "timestamp": "2025-10-14T07:48:23.326Z",
  "requestId": "uuid",
  "event": "request.complete",
  "endpoint": "/api/compliance/snapshot",
  "method": "GET",
  "status": 200,
  "durationMs": 125,
  "tenantId": "tenant-123"
}
```

### Metrics Collection Points

1. **Request Entry:** Start timer, generate correlation ID
2. **Business Logic:** Track specific operation durations
3. **External Calls:** Track dependency latencies
4. **Request Exit:** Record total duration, status, emit structured log

### Alert Configuration

Alerts should be configured in monitoring system (e.g., Grafana, Datadog):

```yaml
# Example alert configuration
- name: high_latency_compliance_snapshot
  condition: p95(request_duration_ms{endpoint="/api/compliance/snapshot"}) > 225ms
  window: 5min
  severity: warning

- name: critical_latency_compliance_snapshot
  condition: p95(request_duration_ms{endpoint="/api/compliance/snapshot"}) > 300ms
  window: 5min
  severity: critical
```

---

**Document Version:** 1.0  
**Next Review:** 2025-11-14  
**Owner:** Platform Engineering Team
