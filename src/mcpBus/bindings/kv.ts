import { KVNamespace } from '@cloudflare/workers-types';

/**
 * Wrapper for Cloudflare KV namespace operations with JSON serialization
 * and error handling for the MCP Bus orchestration service.
 */
export class KVBinding {
  private readonly kv: KVNamespace;

  constructor(kv: KVNamespace) {
    if (!kv) {
      throw new Error('KV namespace binding is required');
    }
    this.kv = kv;
  }

  /**
   * Retrieve and parse a JSON value from KV
   * @param key - Storage key
   * @returns Parsed value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.kv.get(key);
      if (value === null) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get KV key '${key}': ${error.message}`);
      }
      throw new Error(`Failed to get KV key '${key}'`);
    }
  }

  /**
   * Serialize and store a value in KV
   * @param key - Storage key
   * @param value - Value to store (will be JSON serialized)
   * @param expirationTtl - Optional expiration time in seconds
   */
  async put<T>(key: string, value: T, expirationTtl?: number): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      await this.kv.put(key, stringValue, {
        expirationTtl
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to put KV key '${key}': ${error.message}`);
      }
      throw new Error(`Failed to put KV key '${key}'`);
    }
  }

  /**
   * Delete a key from KV
   * @param key - Storage key to delete
   */
  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(key);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete KV key '${key}': ${error.message}`);
      }
      throw new Error(`Failed to delete KV key '${key}'`);
    }
  }

  /**
   * List keys in KV with optional prefix
   * @param prefix - Optional key prefix to filter
   * @returns Array of key metadata objects
   */
  async list(prefix: string = ''): Promise<Array<{ name: string; expiration?: number; metadata?: unknown }>> {
    try {
      const result = await this.kv.list({ prefix });
      return result.keys;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list KV keys with prefix '${prefix}': ${error.message}`);
      }
      throw new Error(`Failed to list KV keys with prefix '${prefix}'`);
    }
  }
}

/**
 * Factory function to create a KVBinding instance
 * @param kv - Cloudflare KV namespace binding
 * @returns Configured KVBinding instance
 */
export function createKVBinding(kv: KVNamespace): KVBinding {
  return new KVBinding(kv);
}
