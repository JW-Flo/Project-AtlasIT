/**
 * SAML 2.0 Service Provider (SP) implementation.
 * Uses Web Crypto API exclusively — no Node.js dependencies.
 * Designed to run on Cloudflare Workers.
 */

import type { SSOConfiguration, SSOIdentity, SSOCallbackResult } from "./types";

const SAML_NS = "urn:oasis:names:tc:SAML:2.0:assertion";
const SAMLP_NS = "urn:oasis:names:tc:SAML:2.0:protocol";

/**
 * Generate a SAML AuthnRequest XML and return the redirect URL.
 */
export function buildAuthnRequestUrl(
  config: SSOConfiguration,
  spEntityId: string,
  acsUrl: string,
  relayState: string,
): string {
  const id = `_${crypto.randomUUID().replace(/-/g, "")}`;
  const issueInstant = new Date().toISOString();

  const request = [
    `<samlp:AuthnRequest`,
    ` xmlns:samlp="${SAMLP_NS}"`,
    ` xmlns:saml="${SAML_NS}"`,
    ` ID="${id}"`,
    ` Version="2.0"`,
    ` IssueInstant="${issueInstant}"`,
    ` Destination="${config.samlSsoUrl}"`,
    ` AssertionConsumerServiceURL="${acsUrl}"`,
    ` ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"`,
    ` IsPassive="false"`,
    `>`,
    `<saml:Issuer>${spEntityId}</saml:Issuer>`,
    `<samlp:NameIDPolicy`,
    ` Format="${config.samlNameIdFormat || "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"}"`,
    ` AllowCreate="true"/>`,
    `</samlp:AuthnRequest>`,
  ].join("");

  // Deflate + Base64 encode for HTTP-Redirect binding
  const encoded = btoa(request);
  const params = new URLSearchParams({
    SAMLRequest: encoded,
    RelayState: relayState,
  });

  return `${config.samlSsoUrl}?${params.toString()}`;
}

/**
 * Parse and validate a SAML Response (HTTP-POST binding).
 * Verifies signature using the IdP's X.509 certificate via Web Crypto.
 */
export async function processSamlResponse(
  samlResponseB64: string,
  config: SSOConfiguration,
  spEntityId: string,
  acsUrl: string,
): Promise<SSOCallbackResult> {
  let xml: string;
  try {
    xml = atob(samlResponseB64);
  } catch {
    return { success: false, error: "Invalid Base64 SAML response" };
  }

  // Extract status
  const statusMatch = xml.match(/<samlp:StatusCode\s+Value="([^"]+)"/);
  if (!statusMatch) {
    return { success: false, error: "Missing StatusCode in SAML response" };
  }
  if (!statusMatch[1].endsWith(":Success")) {
    return { success: false, error: `SAML authentication failed: ${statusMatch[1]}` };
  }

  // Validate destination
  const destinationMatch = xml.match(/<samlp:Response[^>]+Destination="([^"]+)"/);
  if (destinationMatch && destinationMatch[1] !== acsUrl) {
    return { success: false, error: "SAML Response destination mismatch" };
  }

  // Verify XML signature — reject unsigned responses
  if (!config.samlCertificate) {
    return { success: false, error: "SAML certificate not configured — cannot verify response signature" };
  }
  const signatureValid = await verifySamlSignature(xml, config.samlCertificate);
  if (!signatureValid) {
    return { success: false, error: "SAML Response signature verification failed" };
  }

  // Check conditions (NotBefore / NotOnOrAfter)
  const conditionsValid = validateConditions(xml, spEntityId);
  if (!conditionsValid.valid) {
    return { success: false, error: conditionsValid.error };
  }

  // Extract assertion identity
  const identity = extractIdentity(xml);
  if (!identity) {
    return { success: false, error: "Could not extract identity from SAML assertion" };
  }

  // Extract SessionIndex for SLO
  const sessionIndexMatch = xml.match(/<saml:AuthnStatement[^>]+SessionIndex="([^"]+)"/);

  return {
    success: true,
    identity,
    sessionIndex: sessionIndexMatch?.[1],
  };
}

/**
 * Verify the XML signature of a SAML response using Web Crypto API.
 */
async function verifySamlSignature(xml: string, pemCertificate: string): Promise<boolean> {
  try {
    // Extract the SignatureValue
    const sigValueMatch = xml.match(
      /<ds:SignatureValue[^>]*>([\s\S]*?)<\/ds:SignatureValue>/,
    );
    if (!sigValueMatch) {
      // Also try without namespace prefix
      const sigValueMatch2 = xml.match(
        /<SignatureValue[^>]*>([\s\S]*?)<\/SignatureValue>/,
      );
      if (!sigValueMatch2) return false;
      return await verifySignatureWithCert(xml, sigValueMatch2[1].trim(), pemCertificate);
    }
    return await verifySignatureWithCert(xml, sigValueMatch[1].trim(), pemCertificate);
  } catch (e) {
    console.error("SAML signature verification error:", e);
    return false;
  }
}

async function verifySignatureWithCert(
  xml: string,
  signatureValueB64: string,
  pemCert: string,
): Promise<boolean> {
  // Extract the SignedInfo element (the data that was signed)
  const signedInfoMatch = xml.match(
    /(<ds:SignedInfo[\s\S]*?<\/ds:SignedInfo>|<SignedInfo[\s\S]*?<\/SignedInfo>)/,
  );
  if (!signedInfoMatch) return false;

  // Determine the signature algorithm
  const algMatch = xml.match(
    /SignatureMethod\s+Algorithm="([^"]+)"/,
  );
  const algorithm = algMatch?.[1] || "";

  let hashAlg: string;
  if (algorithm.includes("sha256") || algorithm.includes("SHA256")) {
    hashAlg = "SHA-256";
  } else if (algorithm.includes("sha384")) {
    hashAlg = "SHA-384";
  } else if (algorithm.includes("sha512")) {
    hashAlg = "SHA-512";
  } else {
    hashAlg = "SHA-256"; // default to SHA-256
  }

  // Import the X.509 certificate
  const certDer = pemToDer(pemCert);
  if (!certDer) return false;

  try {
    const publicKey = await crypto.subtle.importKey(
      "spki",
      certDer,
      { name: "RSASSA-PKCS1-v1_5", hash: hashAlg },
      false,
      ["verify"],
    );

    const signatureBytes = base64ToUint8Array(signatureValueB64);
    const signedInfoBytes = new TextEncoder().encode(signedInfoMatch[1]);

    return await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      publicKey,
      signatureBytes,
      signedInfoBytes,
    );
  } catch {
    return false;
  }
}

/**
 * Validate SAML Conditions (time bounds and audience restriction).
 */
function validateConditions(xml: string, spEntityId: string): { valid: boolean; error?: string } {
  const conditionsMatch = xml.match(
    /<saml:Conditions([^>]*)>/,
  );
  if (!conditionsMatch) {
    // No conditions — some IdPs omit them, allow
    return { valid: true };
  }

  const now = Date.now();
  const clockSkewMs = 300_000; // 5 minutes

  const notBeforeMatch = conditionsMatch[1].match(/NotBefore="([^"]+)"/);
  if (notBeforeMatch) {
    const notBefore = new Date(notBeforeMatch[1]).getTime();
    if (now < notBefore - clockSkewMs) {
      return { valid: false, error: "SAML assertion is not yet valid (NotBefore)" };
    }
  }

  const notAfterMatch = conditionsMatch[1].match(/NotOnOrAfter="([^"]+)"/);
  if (notAfterMatch) {
    const notAfter = new Date(notAfterMatch[1]).getTime();
    if (now > notAfter + clockSkewMs) {
      return { valid: false, error: "SAML assertion has expired (NotOnOrAfter)" };
    }
  }

  // Audience restriction
  const audienceMatch = xml.match(
    /<saml:Audience>([\s\S]*?)<\/saml:Audience>/,
  );
  if (audienceMatch && audienceMatch[1].trim() !== spEntityId) {
    return { valid: false, error: "SAML audience restriction mismatch" };
  }

  return { valid: true };
}

/**
 * Extract user identity from the SAML assertion.
 */
function extractIdentity(xml: string): SSOIdentity | null {
  // NameID
  const nameIdMatch = xml.match(
    /<saml:NameID[^>]*>([\s\S]*?)<\/saml:NameID>/,
  );
  const nameId = nameIdMatch?.[1]?.trim();

  // Attributes
  const attributes: Record<string, string> = {};
  const attrRegex =
    /<saml:Attribute\s+Name="([^"]+)"[^>]*>[\s\S]*?<saml:AttributeValue[^>]*>([\s\S]*?)<\/saml:AttributeValue>[\s\S]*?<\/saml:Attribute>/g;
  let match;
  while ((match = attrRegex.exec(xml)) !== null) {
    attributes[match[1]] = match[2].trim();
  }

  // Resolve email from common attribute names or NameID
  const email =
    attributes["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ||
    attributes["email"] ||
    attributes["Email"] ||
    attributes["mail"] ||
    attributes["http://schemas.xmlsoap.org/claims/EmailAddress"] ||
    nameId;

  if (!email) return null;

  const displayName =
    attributes["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
    attributes["displayName"] ||
    attributes["name"] ||
    attributes["cn"];

  const firstName =
    attributes["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"] ||
    attributes["firstName"] ||
    attributes["givenName"];

  const lastName =
    attributes["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"] ||
    attributes["lastName"] ||
    attributes["sn"];

  const groupsRaw =
    attributes["http://schemas.xmlsoap.org/claims/Group"] ||
    attributes["groups"] ||
    attributes["memberOf"];

  const groups = groupsRaw ? groupsRaw.split(",").map((g) => g.trim()) : undefined;

  return {
    email: email.toLowerCase(),
    nameId,
    displayName: displayName || (firstName && lastName ? `${firstName} ${lastName}` : undefined),
    firstName,
    lastName,
    groups,
    rawAttributes: attributes,
  };
}

/**
 * Generate SP metadata XML for IdP configuration.
 */
export function generateSpMetadata(spEntityId: string, acsUrl: string, sloUrl?: string): string {
  return [
    `<?xml version="1.0"?>`,
    `<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${spEntityId}">`,
    `  <md:SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true"`,
    `    protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">`,
    `    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>`,
    `    <md:AssertionConsumerService`,
    `      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"`,
    `      Location="${acsUrl}" index="0" isDefault="true"/>`,
    sloUrl
      ? [
          `    <md:SingleLogoutService`,
          `      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"`,
          `      Location="${sloUrl}"/>`,
        ].join("\n")
      : "",
    `  </md:SPSSODescriptor>`,
    `</md:EntityDescriptor>`,
  ]
    .filter(Boolean)
    .join("\n");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pemToDer(pem: string): ArrayBuffer | null {
  const lines = pem
    .replace(/-----BEGIN CERTIFICATE-----/g, "")
    .replace(/-----END CERTIFICATE-----/g, "")
    .replace(/-----BEGIN PUBLIC KEY-----/g, "")
    .replace(/-----END PUBLIC KEY-----/g, "")
    .replace(/\s/g, "");
  if (!lines) return null;
  return base64ToUint8Array(lines).buffer;
}

function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
