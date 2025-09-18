import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export interface SimulateOptions {
  adapterDir: string;
  contractPath: string;
  junitPath?: string;
}

export interface SimulationAssertion {
  name: string;
  passed: boolean;
  message?: string;
}

export interface SimulationResult {
  passed: boolean;
  assertions: SimulationAssertion[];
}

async function readJson(file: string) {
  const contents = await fs.readFile(file, "utf8");
  return JSON.parse(contents);
}

async function loadAdapter(adapterDir: string) {
  const entry = path.join(adapterDir, "dist", "index.js");
  const exists = await fs
    .stat(entry)
    .then(() => true)
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return false;
      throw error;
    });

  if (!exists) {
    throw new Error(`Adapter build output missing: ${entry}`);
  }

  const moduleUrl = pathToFileURL(entry).href;
  return import(moduleUrl);
}

function toJUnitXml(result: SimulationResult): string {
  const failures = result.assertions.filter((assertion) => !assertion.passed);
  const testCases = result.assertions
    .map((assertion) => {
      const safeMessage = assertion.message
        ? assertion.message.replace(/[<>]/g, (match) =>
            match === "<" ? "&lt;" : match === ">" ? "&gt;" : match,
          )
        : "";
      if (assertion.passed) {
        return `    <testcase name="${assertion.name}"/>`;
      }
      return `    <testcase name="${assertion.name}">\n      <failure message="${safeMessage}"/>\n    </testcase>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<testsuite name="adapter-simulation" tests="${result.assertions.length}" failures="${failures.length}" time="0">\n${testCases}\n</testsuite>\n`;
}

export async function simulateAdapter(options: SimulateOptions): Promise<SimulationResult> {
  const adapterDir = path.resolve(process.cwd(), options.adapterDir);
  const contractFile = path.resolve(process.cwd(), options.contractPath);
  const contract = await readJson(contractFile);

  const assertions: SimulationAssertion[] = [];

  try {
    const module = await loadAdapter(adapterDir);
    if (typeof module.createAdapter !== "function") {
      throw new Error("createAdapter export not found");
    }

    const handler = module.createAdapter();
    if (!handler || typeof handler.fetch !== "function") {
      throw new Error("Adapter handler missing fetch implementation");
    }

    const healthConfig = contract?.expects?.health;
    if (!healthConfig) {
      throw new Error("Contract missing expects.health section");
    }

    const baseUrl = "https://adapter.local";
    const request = new Request(`${baseUrl}${healthConfig.path ?? "/health"}`);
    const response = await handler.fetch(request);

    const statusMatch = response.status === (healthConfig.status ?? 200);
    assertions.push({
      name: "health-status",
      passed: statusMatch,
      message: statusMatch
        ? undefined
        : `Expected status ${(healthConfig.status ?? 200)}, received ${response.status}`,
    });

    let bodyJson: any = null;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      bodyJson = await response.json();
    }

    const hasJson = bodyJson !== null && typeof bodyJson === "object";
    assertions.push({
      name: "health-body-json",
      passed: hasJson,
      message: hasJson ? undefined : "Expected JSON response body",
    });

    const expectedHeaders = healthConfig.headers ?? {};
    for (const [headerKey, headerValue] of Object.entries(expectedHeaders)) {
      const actual = response.headers.get(headerKey);
      const match = actual === headerValue;
      assertions.push({
        name: `health-header-${headerKey.toLowerCase()}`,
        passed: match,
        message: match
          ? undefined
          : `Header ${headerKey} expected \"${headerValue}\" but received \"${actual ?? "<missing>"}\"`,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    assertions.push({ name: "simulation-error", passed: false, message });
  }

  const passed = assertions.every((assertion) => assertion.passed);
  const junit = toJUnitXml({ passed, assertions });

  if (options.junitPath) {
    await fs.mkdir(path.dirname(options.junitPath), { recursive: true });
    await fs.writeFile(options.junitPath, junit, "utf8");
  }

  return { passed, assertions };
}
