import { beforeEach, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JMLEngine } from '../index.js';

type StoredValue = Record<string, unknown>;

type StorageListResult = Map<string, StoredValue>;

const testDir = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(testDir, '..', 'fixtures', 'jml');

const clone = <T>(value: T): T =>
  typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

class InMemoryStorage {
  #data = new Map<string, StoredValue>();

  async put(key: string, value: StoredValue) {
    this.#data.set(key, clone(value));
  }

  async get(key: string) {
    const value = this.#data.get(key);
    return value ? clone(value) : undefined;
  }

  async list({ prefix = '' }: { prefix?: string } = {}) {
    const results: StorageListResult = new Map();
    for (const [key, value] of this.#data.entries()) {
      if (!prefix || key.startsWith(prefix)) {
        results.set(key, clone(value));
      }
    }
    return results;
  }
}

const createState = () => ({
  storage: new InMemoryStorage(),
});

async function loadFixture<T = StoredValue>(name: string): Promise<T> {
  const path = join(fixturesDir, `${name}.json`);
  const content = await readFile(path, 'utf-8');
  return JSON.parse(content) as T;
}

describe('JMLEngine Durable Object orchestrator', () => {
  let state: ReturnType<typeof createState>;
  let engine: JMLEngine;

  beforeEach(() => {
    state = createState();
    engine = new JMLEngine(state as any, {});
  });

  it('runs the joiner flow end-to-end', async () => {
    const joiner = await loadFixture('joiner');
    const response = await engine.handleEnqueue(joiner);
    expect(response.status).toBe(200);

    const { runId } = await response.json();
    expect(runId).toBeDefined();

    const run = await state.storage.get(`run:${runId}`);
    expect(run).toBeDefined();
    expect(run?.status).toBe('completed');
    expect(run?.history).toHaveLength(4);
    expect(run?.history?.map((h: any) => h.stepId)).toStrictEqual([
      'validate-profile',
      'provision-primary-account',
      'synchronize-access',
      'notify-stakeholders',
    ]);
  });

  it('applies mover role change and reconciles to target entitlements', async () => {
    const mover = await loadFixture('mover');
    const response = await engine.handleEnqueue(mover);
    const { runId } = await response.json();

    const run = await state.storage.get(`run:${runId}`);
    expect(run?.status).toBe('completed');

    const reconciliation = run?.history?.find((entry: any) => entry.stepId === 'reconcile-entitlements');
    expect(reconciliation?.output?.applied).toStrictEqual(mover.entitlements.target);

    const roleChange = run?.history?.find((entry: any) => entry.stepId === 'apply-role-change');
    expect(roleChange?.output?.newRole).toMatchObject(mover.newRole);
  });

  it('sends failed steps to the DLQ after exhausting retries', async () => {
    const leaver = await loadFixture('leaver');
    const failing = {
      ...leaver,
      control: { failStep: 'collect-artifacts' },
    };

    const response = await engine.handleEnqueue(failing);
    const { runId } = await response.json();
    const run = await state.storage.get(`run:${runId}`);

    expect(run?.status).toBe('failed');
    const dlqEntries = await state.storage.list({ prefix: 'dlq:' });
    expect(dlqEntries.size).toBe(1);

    const [, dlq] = Array.from(dlqEntries.entries())[0];
    expect(dlq.runId).toBe(runId);
    expect(dlq.stepId).toBe('collect-artifacts');
    expect(dlq.attempts).toBeGreaterThanOrEqual(1);
  });
});
