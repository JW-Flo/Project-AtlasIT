# Testing Requirements Reference

## Test Stack

| Tool      | Purpose                  | Location                 |
| --------- | ------------------------ | ------------------------ |
| Vitest    | Unit & integration tests | `*.test.ts` files        |
| Puppeteer | E2E browser tests        | `qa/tests/e2e.test.js`   |
| Miniflare | Workers local testing    | Built into Vitest config |

## Test Structure

```
backend/edge-worker/
├── tests/
│   ├── unit/
│   │   ├── services/        # Business logic tests
│   │   └── utils/           # Utility function tests
│   ├── integration/
│   │   ├── routers/         # API endpoint tests
│   │   └── middleware/      # Middleware tests
│   └── setup.ts             # Test configuration

frontend/
├── src/
│   └── components/
│       └── __tests__/       # Component tests co-located
└── tests/
    └── e2e/                 # End-to-end tests
```

## Unit Test Patterns

### Service Tests

```typescript
// tests/unit/services/cache.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CacheService } from "../../../src/services/cache";

describe("CacheService", () => {
  let cache: CacheService;
  let mockKV: KVNamespace;

  beforeEach(() => {
    mockKV = {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as KVNamespace;
    cache = new CacheService(mockKV);
  });

  describe("get", () => {
    it("returns parsed JSON when key exists", async () => {
      const data = { foo: "bar" };
      vi.mocked(mockKV.get).mockResolvedValue(JSON.stringify(data));

      const result = await cache.get("test-key");

      expect(result).toEqual(data);
      expect(mockKV.get).toHaveBeenCalledWith("test-key", "json");
    });

    it("returns null when key does not exist", async () => {
      vi.mocked(mockKV.get).mockResolvedValue(null);

      const result = await cache.get("missing-key");

      expect(result).toBeNull();
    });
  });

  describe("getOrFetch", () => {
    it("returns cached value without calling fetcher", async () => {
      const cached = { cached: true };
      vi.mocked(mockKV.get).mockResolvedValue(JSON.stringify(cached));
      const fetcher = vi.fn();

      const result = await cache.getOrFetch("key", fetcher);

      expect(result).toEqual(cached);
      expect(fetcher).not.toHaveBeenCalled();
    });

    it("calls fetcher and caches result when cache miss", async () => {
      vi.mocked(mockKV.get).mockResolvedValue(null);
      const fresh = { fresh: true };
      const fetcher = vi.fn().mockResolvedValue(fresh);

      const result = await cache.getOrFetch("key", fetcher, 600);

      expect(result).toEqual(fresh);
      expect(fetcher).toHaveBeenCalled();
      expect(mockKV.put).toHaveBeenCalledWith("key", JSON.stringify(fresh), { expirationTtl: 600 });
    });
  });
});
```

### Utility Tests

```typescript
// tests/unit/utils/formatters.test.ts
import { describe, it, expect } from "vitest";
import { formatRange, formatEfficiency, formatDuration } from "../../../src/utils/formatters";

describe("formatRange", () => {
  it("formats miles with unit", () => {
    expect(formatRange(267)).toBe("267 mi");
  });

  it("handles zero", () => {
    expect(formatRange(0)).toBe("0 mi");
  });

  it("rounds decimals", () => {
    expect(formatRange(267.8)).toBe("268 mi");
  });
});

describe("formatEfficiency", () => {
  it("formats Wh/mi", () => {
    expect(formatEfficiency(248)).toBe("248 Wh/mi");
  });
});

describe("formatDuration", () => {
  it("formats hours and minutes", () => {
    expect(formatDuration(90)).toBe("1h 30m");
  });

  it("handles minutes only", () => {
    expect(formatDuration(45)).toBe("45m");
  });

  it("handles hours only", () => {
    expect(formatDuration(120)).toBe("2h");
  });
});
```

## Integration Test Patterns

### API Router Tests

```typescript
// tests/integration/routers/telemetry.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { unstable_dev } from "wrangler";
import type { UnstableDevWorker } from "wrangler";

describe("Telemetry Router", () => {
  let worker: UnstableDevWorker;

  beforeAll(async () => {
    worker = await unstable_dev("src/index.ts", {
      experimental: { disableExperimentalWarning: true },
      vars: {
        ADMIN_TOKEN: "test-token",
      },
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  describe("GET /api/v1/telemetry", () => {
    it("returns telemetry data", async () => {
      const res = await worker.fetch("/api/v1/telemetry");
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.status).toBe("success");
      expect(json.data).toBeDefined();
    });

    it("supports pagination", async () => {
      const res = await worker.fetch("/api/v1/telemetry?limit=10&offset=0");
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.pagination).toBeDefined();
      expect(json.pagination.limit).toBe(10);
    });
  });

  describe("POST /api/v1/telemetry", () => {
    it("validates request body", async () => {
      const res = await worker.fetch("/api/v1/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invalid: "data" }),
      });

      expect(res.status).toBe(400);
    });

    it("accepts valid telemetry", async () => {
      const telemetry = {
        batteryLevel: 85,
        batteryRange: 267,
        latitude: 37.7749,
        longitude: -122.4194,
        isCharging: false,
        timestamp: new Date().toISOString(),
      };

      const res = await worker.fetch("/api/v1/telemetry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify(telemetry),
      });

      expect(res.status).toBe(201);
    });
  });
});
```

### Health Endpoint Contract Test

```typescript
// tests/integration/routers/health.test.ts
// CRITICAL: Ensures health response never removes keys (additive only)

describe("Health Endpoint Contract", () => {
  const REQUIRED_KEYS = ["status", "timestamp", "version"];

  it("contains all required keys", async () => {
    const res = await worker.fetch("/api/v1/health");
    const json = await res.json();

    REQUIRED_KEYS.forEach((key) => {
      expect(json).toHaveProperty(key);
    });
  });

  it("status is valid enum", async () => {
    const res = await worker.fetch("/api/v1/health");
    const json = await res.json();

    expect(["healthy", "degraded", "unhealthy"]).toContain(json.status);
  });

  it("timestamp is valid ISO string", async () => {
    const res = await worker.fetch("/api/v1/health");
    const json = await res.json();

    expect(() => new Date(json.timestamp)).not.toThrow();
  });
});
```

## Component Test Patterns

```tsx
// src/components/__tests__/MetricCard.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricCard } from "../dashboard/MetricCard";

describe("MetricCard", () => {
  it("renders title and value", () => {
    render(<MetricCard title="Battery" value={85} unit="%" />);

    expect(screen.getByText("Battery")).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText("%")).toBeInTheDocument();
  });

  it("shows loading skeleton", () => {
    render(<MetricCard title="Battery" value={0} loading />);

    expect(screen.queryByText("Battery")).not.toBeInTheDocument();
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows error state", () => {
    render(<MetricCard title="Battery" value={0} error="Failed to load" />);

    expect(screen.getByText("Failed to load")).toBeInTheDocument();
  });

  it("renders positive trend", () => {
    render(
      <MetricCard title="Efficiency" value={248} trend={{ value: 5, label: "vs last week" }} />,
    );

    expect(screen.getByText("↑")).toBeInTheDocument();
    expect(screen.getByText(/5%/)).toBeInTheDocument();
  });

  it("renders negative trend", () => {
    render(
      <MetricCard title="Efficiency" value={248} trend={{ value: -3, label: "vs last week" }} />,
    );

    expect(screen.getByText("↓")).toBeInTheDocument();
  });
});
```

## E2E Test Patterns

```javascript
// qa/tests/e2e.test.js
import puppeteer from "puppeteer";

describe("Dashboard E2E", () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: "new" });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
  });

  afterAll(async () => {
    await browser.close();
  });

  it("loads dashboard with metrics", async () => {
    await page.goto("https://awhittlewandering.com");

    // Wait for metrics to load
    await page.waitForSelector('[data-testid="metric-card"]', {
      timeout: 10000,
    });

    const cards = await page.$$('[data-testid="metric-card"]');
    expect(cards.length).toBeGreaterThanOrEqual(4);
  });

  it("displays map with route", async () => {
    await page.goto("https://awhittlewandering.com");

    await page.waitForSelector(".mapboxgl-canvas", { timeout: 15000 });

    // Check route layer exists
    const routeLayer = await page.evaluate(() => {
      const map = document.querySelector(".mapboxgl-canvas");
      return map !== null;
    });

    expect(routeLayer).toBe(true);
  });

  it("is responsive on mobile", async () => {
    await page.setViewport({ width: 375, height: 667 });
    await page.goto("https://awhittlewandering.com");

    // Sidebar should be hidden on mobile
    const sidebar = await page.$('[data-testid="sidebar"]');
    const isHidden = await sidebar?.evaluate(
      (el) => window.getComputedStyle(el).display === "none" || el.classList.contains("hidden"),
    );

    expect(isHidden).toBe(true);
  });
});
```

## Test Coverage Requirements

| Area                    | Minimum Coverage | Target |
| ----------------------- | ---------------- | ------ |
| Services/Business Logic | 80%              | 90%    |
| API Routers             | 70%              | 85%    |
| React Components        | 60%              | 80%    |
| Utilities               | 90%              | 95%    |
| E2E Critical Paths      | 100%             | 100%   |

## Running Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Specific file
npm test -- src/services/cache.test.ts

# E2E only
npm run test:e2e

# QA pipeline
npm run qa:core
```

## CI Integration

```yaml
# .github/workflows/test.yml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: "20"
        cache: "npm"
    - run: npm ci
    - run: npm run test:coverage
    - uses: codecov/codecov-action@v4
      with:
        files: ./coverage/lcov.info
```

## Mock Patterns

### Mocking D1

```typescript
const mockD1 = {
  prepare: vi.fn(() => ({
    bind: vi.fn(() => ({
      all: vi.fn().mockResolvedValue({ results: [] }),
      first: vi.fn().mockResolvedValue(null),
      run: vi.fn().mockResolvedValue({ success: true }),
    })),
  })),
  batch: vi.fn().mockResolvedValue([]),
};
```

### Mocking Fetch (Tessie API)

```typescript
vi.mock("global", () => ({
  fetch: vi.fn().mockImplementation((url) => {
    if (url.includes("/state")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ battery_level: 85 }),
      });
    }
    return Promise.resolve({ ok: false, status: 404 });
  }),
}));
```
