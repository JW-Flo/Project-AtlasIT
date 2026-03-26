import { describe, it, expect } from 'vitest';
import { validateClientCert } from '../src/mtls';

// NOTE: This certificate text is a shortened placeholder for fingerprint logic tests only.
const TEST_CERT_PEM = `-----BEGIN CERTIFICATE-----\nMIIBszCCAVmgAwIBAgIUYjUwAAAAAAAtESTESTFIXTUREwCgYIKoZIzj0EAwIw\nEjEQMA4GA1UEAwwHY2R0LXRlc3QwHhcNMjUwMTAxMDAwMDAwWhcNMjYwMTAxMDAw\nMDAwWjASMRAwDgYDVQQDDAdjZHQtdGVzdDBZMBMGByqGSM49AgEGCCqGSM49AwEH\nA0IABO0Yg4J8b5YF5s0S0i0x9WurC4oXb1cTaJc2wWv18OyR7dAf4y08T+Gm9u3S\n2Cgnos6YYeVb7eOziQ4uKOZDDVajUzBRMB0GA1UdDgQWBBRrlq2vFIXTUREPRINT\nQOy6bXHScTAMBgNVHRMBAf8EAjAAMA4GA1UdDwEB/wQEAwIFoDAeBgNVHREEFzAV\nhhN1c2VyQGNsaWVudC5leGFtcGxlMAoGCCqGSM49BAMCA0gAMEUCIQCyFIXTURE/\n4y8M1qVXh2ZC1+X3p3cp2gR6j5BGZ8i1+FKl8gIgGfFIXTURE98bwp7XwMuwQL0g\nUO9G6GxZrS0yE1Ff07C9L6Q=\n-----END CERTIFICATE-----`;

async function computeFingerprint(pem: string) {
  const body = pem.replace(/-----BEGIN CERTIFICATE-----/, '')
    .replace(/-----END CERTIFICATE-----/, '')
    .replace(/\s+/g, '');
  const der = Uint8Array.from(atob(body), c => c.charCodeAt(0));
  const d = await crypto.subtle.digest('SHA-256', der.buffer);
  return btoa(String.fromCharCode(...new Uint8Array(d)));
}

describe('mTLS validateClientCert', () => {
  it('allows certificate when fingerprint is in allowlist', async () => {
    const fp = await computeFingerprint(TEST_CERT_PEM);
    const req = new Request('https://example.com', { headers: { 'cf-client-cert': TEST_CERT_PEM } });
    const res = await validateClientCert(req, [fp]);
    expect(res.ok).toBe(true);
    expect((res as any).fingerprint).toBe(fp);
  });

  it('rejects when fingerprint not present', async () => {
    const req = new Request('https://example.com', { headers: { 'cf-client-cert': TEST_CERT_PEM } });
    const res = await validateClientCert(req, ['SomeOtherFP']);
    expect(res.ok).toBe(false);
  });

  it('skips check when allowlist empty', async () => {
    const req = new Request('https://example.com');
    const res = await validateClientCert(req, []);
    expect(res.ok).toBe(true);
  });
});
