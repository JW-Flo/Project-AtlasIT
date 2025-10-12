// Simple client certificate fingerprint allowlist check.
// Assumes header 'cf-client-cert' includes PEM when API Shield mTLS is enabled.
// If ALLOWED_CLIENT_CERT_FPS env var empty, check is skipped.

function pemBody(pem: string) {
  return pem.replace(/-----BEGIN CERTIFICATE-----/, '')
    .replace(/-----END CERTIFICATE-----/, '')
    .replace(/\s+/g, '');
}

async function sha256Base64(raw: Uint8Array) {
  const d = await crypto.subtle.digest('SHA-256', raw);
  return btoa(String.fromCharCode(...new Uint8Array(d)));
}

export async function validateClientCert(req: Request, allowed: string[] | undefined) {
  if (!allowed || allowed.length === 0) return { ok: true, reason: 'no-allowlist-configured' } as const;
  const pem = req.headers.get('cf-client-cert');
  if (!pem) return { ok: false, reason: 'missing-cert-header' } as const;
  try {
    const body = pemBody(pem);
    const der = Uint8Array.from(atob(body), c => c.charCodeAt(0));
    const fp = await sha256Base64(der);
    const match = allowed.includes(fp);
    return match ? { ok: true, fingerprint: fp } as const : { ok: false, reason: 'fingerprint-not-allowed', fingerprint: fp } as const;
  } catch (e) {
    return { ok: false, reason: 'parse-error' } as const;
  }
}
