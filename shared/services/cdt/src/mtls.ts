// Simple client certificate fingerprint allowlist check.
// Assumes header 'cf-client-cert' includes PEM when API Shield mTLS is enabled.
// If ALLOWED_CLIENT_CERT_FPS env var empty, check is skipped.

function pemBody(pem: string) {
  return pem
    .replace(/-----BEGIN CERTIFICATE-----/, "")
    .replace(/-----END CERTIFICATE-----/, "")
    .replace(/\s+/g, "");
}

async function sha256Base64(raw: ArrayBuffer | Uint8Array) {
  // Normalize to Uint8Array then digest; avoids ArrayBufferLike vs BufferSource typing issues
  const view = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
  // Work around environments where Uint8Array buffer type is widened to ArrayBufferLike by copying
  let buf: ArrayBuffer;
  if (view.buffer instanceof ArrayBuffer) {
    buf = view.buffer.slice(0);
  } else {
    // Fallback: copy contents into a new ArrayBuffer
    const copy = new Uint8Array(view.byteLength);
    copy.set(view);
    buf = copy.buffer;
  }
  const d = await crypto.subtle.digest("SHA-256", buf);
  return btoa(String.fromCharCode(...new Uint8Array(d)));
}

export async function validateClientCert(
  req: Request,
  allowedFingerprints: string[] | undefined,
) {
  if (!allowedFingerprints || allowedFingerprints.length === 0)
    return { ok: true, reason: "no-allowlist-configured" } as const;
  const pem = req.headers.get("cf-client-cert");
  if (!pem) return { ok: false, reason: "missing-cert-header" } as const;
  try {
    const body = pemBody(pem);
    const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
    const fp = await sha256Base64(der);
    const match = allowedFingerprints.includes(fp);
    return match
      ? ({ ok: true, fingerprint: fp } as const)
      : ({
          ok: false,
          reason: "fingerprint-not-allowed",
          fingerprint: fp,
        } as const);
  } catch (e) {
    return { ok: false, reason: "parse-error" } as const;
  }
}
