# AtlasIT Load Tests

k6 load testing suite for the AtlasIT platform. Tests cover three services:

- **Core API** — tenant management, feature flags, event publishing
- **AI Orchestrator** — event fanout, agent registry, dead letter queue
- **Compliance Worker** — snapshots, policy evaluation, evidence ingestion

## Prerequisites

### Install k6

```bash
# macOS
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D68
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Docker
docker pull grafana/k6
```

## Environment Variables

| Variable           | Description                          | Default                 |
|--------------------|--------------------------------------|-------------------------|
| `BASE_URL`         | Core API base URL                    | `http://localhost:8787` |
| `ORCHESTRATOR_URL` | Orchestrator base URL (if separate)  | Same as `BASE_URL`      |
| `COMPLIANCE_URL`   | Compliance worker base URL           | Same as `BASE_URL`      |
| `API_TOKEN`        | Bearer token for auth                | (empty, no auth)        |
| `TENANT_ID`        | Tenant ID for X-Tenant-ID header     | `test-tenant`           |

## Scenarios

### Smoke (Quick Validation)

Minimal test: 1 VU, 30 seconds. Verifies endpoints respond.

```bash
k6 run tests/load/scenarios/smoke.js
```

### Load (Normal Traffic)

Ramp 0 to 50 VUs over 2 min, sustain 5 min, ramp down 1 min. Enforces SLO thresholds.

```bash
k6 run tests/load/scenarios/load.js
```

### Stress (Breaking Point)

Ramp to 200 VUs: 0->50 (2min) -> 100 (3min) -> 200 (2min) -> 0 (1min). Expects some failures.

```bash
k6 run tests/load/scenarios/stress.js
```

### Soak (Endurance)

20 VUs sustained for 30 minutes. Detects memory leaks and latency degradation.

```bash
k6 run tests/load/scenarios/soak.js
```

## Running with Environment Variables

```bash
# Against staging
k6 run tests/load/scenarios/load.js \
  -e BASE_URL=https://core-api.atlasit.pro \
  -e ORCHESTRATOR_URL=https://orchestrator.atlasit.pro \
  -e COMPLIANCE_URL=https://compliance.atlasit.pro \
  -e API_TOKEN=your-api-token \
  -e TENANT_ID=your-tenant-id

# With Docker
docker run --rm -v $(pwd)/tests/load:/tests \
  -e BASE_URL=https://core-api.atlasit.pro \
  grafana/k6 run /tests/scenarios/smoke.js
```

## Running Individual Service Scripts

You can run a single service script directly with default options:

```bash
k6 run tests/load/scripts/core-api.js
k6 run tests/load/scripts/orchestrator.js
k6 run tests/load/scripts/compliance.js
```

## SLO Thresholds

Thresholds are derived from `packages/shared/src/observability/slo.ts`:

| SLO                          | Target | k6 Threshold                       |
|------------------------------|--------|-------------------------------------|
| API Availability             | 99.9%  | `http_req_failed rate < 0.1%`      |
| General p95 Latency          | —      | `http_req_duration p(95) < 500ms`  |
| Compliance Snapshot Latency  | 95%    | `p(95) < 500ms` (tagged)           |
| Workflow Execution Success   | 99%    | Covered via error rate              |
| Evidence Ingest Success      | 99.9%  | Covered via error rate              |

## Interpreting Results

k6 outputs a summary after each run. Key metrics to watch:

- **http_req_duration**: Response time distribution (avg, p90, p95, p99, max)
- **http_req_failed**: Percentage of requests that returned 4xx/5xx
- **http_reqs**: Total request count and rate (req/s)
- **iteration_duration**: Time per full test iteration
- **checks**: Pass/fail ratio for assertion checks

Threshold violations are marked with a cross in the summary. A non-zero exit code indicates threshold breaches.

### Example output

```
     checks.........................: 95.23% ✓ 4521  ✗ 227
     http_req_duration..............: avg=142ms  p(95)=387ms  p(99)=612ms
     http_req_failed................: 0.08%  ✓ 4     ✗ 4744
     http_reqs......................: 4748   79.13/s
```

## CI Integration

```yaml
# GitHub Actions example
- name: Run k6 smoke test
  uses: grafana/k6-action@v0.3.1
  with:
    filename: tests/load/scenarios/smoke.js
  env:
    BASE_URL: ${{ secrets.STAGING_API_URL }}
    API_TOKEN: ${{ secrets.STAGING_API_TOKEN }}
    TENANT_ID: ci-test-tenant
```

## File Structure

```
tests/load/
├── config.js           # Shared config, headers, thresholds
├── scenarios/
│   ├── smoke.js        # 1 VU, 30s — quick validation
│   ├── load.js         # 50 VUs, 8min — normal traffic
│   ├── stress.js       # 200 VUs, 8min — breaking point
│   └── soak.js         # 20 VUs, 30min — endurance
├── scripts/
│   ├── core-api.js     # Core API endpoint tests
│   ├── orchestrator.js # Orchestrator endpoint tests
│   └── compliance.js   # Compliance worker endpoint tests
└── README.md
```
