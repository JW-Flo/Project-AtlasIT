const SAML_NS = "urn:oasis:names:tc:SAML:2.0:assertion";
const SAMLP_NS = "urn:oasis:names:tc:SAML:2.0:protocol";
async function buildAuthnRequestUrl(config, spEntityId, acsUrl, relayState) {
  const id = `_${crypto.randomUUID().replace(/-/g, "")}`;
  const issueInstant = (/* @__PURE__ */ new Date()).toISOString();
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
    `</samlp:AuthnRequest>`
  ].join("");
  const deflated = await deflateRaw(new TextEncoder().encode(request));
  const encoded = uint8ArrayToBase64(deflated);
  const params = new URLSearchParams({
    SAMLRequest: encoded,
    RelayState: relayState
  });
  return `${config.samlSsoUrl}?${params.toString()}`;
}
async function processSamlResponse(samlResponseB64, config, spEntityId, acsUrl) {
  let xml;
  try {
    xml = atob(samlResponseB64);
  } catch {
    return { success: false, error: "Invalid Base64 SAML response" };
  }
  const statusMatch = xml.match(/<samlp:StatusCode\s+Value="([^"]+)"/);
  if (!statusMatch) {
    return { success: false, error: "Missing StatusCode in SAML response" };
  }
  if (!statusMatch[1].endsWith(":Success")) {
    return { success: false, error: `SAML authentication failed: ${statusMatch[1]}` };
  }
  const destinationMatch = xml.match(/<samlp:Response[^>]+Destination="([^"]+)"/);
  if (destinationMatch && destinationMatch[1] !== acsUrl) {
    return { success: false, error: "SAML Response destination mismatch" };
  }
  if (!config.samlCertificate) {
    return {
      success: false,
      error: "SAML certificate not configured — cannot verify response signature"
    };
  }
  const signatureValid = await verifySamlSignature(xml, config.samlCertificate);
  if (!signatureValid) {
    return { success: false, error: "SAML Response signature verification failed" };
  }
  const conditionsValid = validateConditions(xml, spEntityId);
  if (!conditionsValid.valid) {
    return { success: false, error: conditionsValid.error };
  }
  const identity = extractIdentity(xml);
  if (!identity) {
    return { success: false, error: "Could not extract identity from SAML assertion" };
  }
  const sessionIndexMatch = xml.match(/<saml:AuthnStatement[^>]+SessionIndex="([^"]+)"/);
  return {
    success: true,
    identity,
    sessionIndex: sessionIndexMatch?.[1]
  };
}
async function verifySamlSignature(xml, pemCertificate) {
  try {
    const sigValueMatch = xml.match(/<ds:SignatureValue[^>]*>([\s\S]*?)<\/ds:SignatureValue>/);
    if (!sigValueMatch) {
      const sigValueMatch2 = xml.match(/<SignatureValue[^>]*>([\s\S]*?)<\/SignatureValue>/);
      if (!sigValueMatch2)
        return false;
      return await verifySignatureWithCert(xml, sigValueMatch2[1].trim(), pemCertificate);
    }
    return await verifySignatureWithCert(xml, sigValueMatch[1].trim(), pemCertificate);
  } catch (e) {
    console.error("SAML signature verification error:", e);
    return false;
  }
}
async function verifySignatureWithCert(xml, signatureValueB64, pemCert) {
  const signedInfoMatch = xml.match(/(<ds:SignedInfo[\s\S]*?<\/ds:SignedInfo>|<SignedInfo[\s\S]*?<\/SignedInfo>)/);
  if (!signedInfoMatch)
    return false;
  const algMatch = xml.match(/SignatureMethod\s+Algorithm="([^"]+)"/);
  const algorithm = algMatch?.[1] || "";
  let hashAlg;
  if (algorithm.includes("sha256") || algorithm.includes("SHA256")) {
    hashAlg = "SHA-256";
  } else if (algorithm.includes("sha384")) {
    hashAlg = "SHA-384";
  } else if (algorithm.includes("sha512")) {
    hashAlg = "SHA-512";
  } else {
    hashAlg = "SHA-256";
  }
  const certDer = pemToDer(pemCert);
  if (!certDer)
    return false;
  try {
    const publicKey = await crypto.subtle.importKey("spki", certDer, { name: "RSASSA-PKCS1-v1_5", hash: hashAlg }, false, ["verify"]);
    const signatureBytes = base64ToUint8Array(signatureValueB64);
    const signedInfoBytes = new TextEncoder().encode(signedInfoMatch[1]);
    return await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, signatureBytes.buffer, signedInfoBytes.buffer);
  } catch {
    return false;
  }
}
function validateConditions(xml, spEntityId) {
  const conditionsMatch = xml.match(/<saml:Conditions([^>]*)>/);
  if (!conditionsMatch) {
    return { valid: true };
  }
  const now = Date.now();
  const clockSkewMs = 3e5;
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
  const audienceMatch = xml.match(/<saml:Audience>([\s\S]*?)<\/saml:Audience>/);
  if (audienceMatch && audienceMatch[1].trim() !== spEntityId) {
    return { valid: false, error: "SAML audience restriction mismatch" };
  }
  return { valid: true };
}
function extractIdentity(xml) {
  const nameIdMatch = xml.match(/<saml:NameID[^>]*>([\s\S]*?)<\/saml:NameID>/);
  const nameId = nameIdMatch?.[1]?.trim();
  const attributes = {};
  const attrRegex = /<saml:Attribute\s+Name="([^"]+)"[^>]*>[\s\S]*?<saml:AttributeValue[^>]*>([\s\S]*?)<\/saml:AttributeValue>[\s\S]*?<\/saml:Attribute>/g;
  let match;
  while ((match = attrRegex.exec(xml)) !== null) {
    attributes[match[1]] = match[2].trim();
  }
  const email = attributes["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || attributes["email"] || attributes["Email"] || attributes["mail"] || attributes["http://schemas.xmlsoap.org/claims/EmailAddress"] || nameId;
  if (!email)
    return null;
  const displayName = attributes["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || attributes["displayName"] || attributes["name"] || attributes["cn"];
  const firstName = attributes["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"] || attributes["firstName"] || attributes["givenName"];
  const lastName = attributes["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"] || attributes["lastName"] || attributes["sn"];
  const groupsRaw = attributes["http://schemas.xmlsoap.org/claims/Group"] || attributes["groups"] || attributes["memberOf"];
  const groups = groupsRaw ? groupsRaw.split(",").map((g) => g.trim()) : void 0;
  return {
    email: email.toLowerCase(),
    nameId,
    displayName: displayName || (firstName && lastName ? `${firstName} ${lastName}` : void 0),
    firstName,
    lastName,
    groups,
    rawAttributes: attributes
  };
}
async function fetchIdpMetadata(metadataUrl) {
  const res = await fetch(metadataUrl, {
    headers: { Accept: "application/xml, text/xml" }
  });
  if (!res.ok)
    return null;
  const xml = await res.text();
  return parseIdpMetadata(xml);
}
function parseIdpMetadata(xml) {
  const entityIdMatch = xml.match(/EntityDescriptor[^>]+entityID="([^"]+)"/);
  if (!entityIdMatch)
    return null;
  const ssoRedirectMatch = xml.match(/<(?:md:)?SingleSignOnService[^>]+Binding="urn:oasis:names:tc:SAML:2\.0:bindings:HTTP-Redirect"[^>]+Location="([^"]+)"/);
  const ssoPostMatch = xml.match(/<(?:md:)?SingleSignOnService[^>]+Binding="urn:oasis:names:tc:SAML:2\.0:bindings:HTTP-POST"[^>]+Location="([^"]+)"/);
  const ssoRedirectAlt = xml.match(/<(?:md:)?SingleSignOnService[^>]+Location="([^"]+)"[^>]+Binding="urn:oasis:names:tc:SAML:2\.0:bindings:HTTP-Redirect"/);
  const ssoPostAlt = xml.match(/<(?:md:)?SingleSignOnService[^>]+Location="([^"]+)"[^>]+Binding="urn:oasis:names:tc:SAML:2\.0:bindings:HTTP-POST"/);
  const ssoUrl = ssoRedirectMatch?.[1] || ssoRedirectAlt?.[1] || ssoPostMatch?.[1] || ssoPostAlt?.[1];
  if (!ssoUrl)
    return null;
  const sloMatch = xml.match(/<(?:md:)?SingleLogoutService[^>]+Location="([^"]+)"/);
  const signingCertBlock = xml.match(/<(?:md:)?KeyDescriptor[^>]+use="signing"[^>]*>[\s\S]*?<(?:ds:)?X509Certificate[^>]*>([\s\S]*?)<\/(?:ds:)?X509Certificate>/);
  const anyCertBlock = xml.match(/<(?:ds:)?X509Certificate[^>]*>([\s\S]*?)<\/(?:ds:)?X509Certificate>/);
  const certBase64 = (signingCertBlock?.[1] || anyCertBlock?.[1])?.replace(/\s/g, "");
  if (!certBase64)
    return null;
  const certLines = certBase64.match(/.{1,64}/g) || [];
  const certificate = [
    "-----BEGIN CERTIFICATE-----",
    ...certLines,
    "-----END CERTIFICATE-----"
  ].join("\n");
  const nameIdMatch = xml.match(/<(?:md:)?NameIDFormat[^>]*>([\s\S]*?)<\/(?:md:)?NameIDFormat>/);
  return {
    entityId: entityIdMatch[1],
    ssoUrl,
    sloUrl: sloMatch?.[1],
    certificate,
    nameIdFormat: nameIdMatch?.[1]?.trim()
  };
}
function generateSpMetadata(spEntityId, acsUrl, sloUrl) {
  return [
    `<?xml version="1.0"?>`,
    `<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${spEntityId}">`,
    `  <md:SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true"`,
    `    protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">`,
    `    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>`,
    `    <md:AssertionConsumerService`,
    `      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"`,
    `      Location="${acsUrl}" index="0" isDefault="true"/>`,
    "",
    `  </md:SPSSODescriptor>`,
    `</md:EntityDescriptor>`
  ].filter(Boolean).join("\n");
}
function pemToDer(pem) {
  const lines = pem.replace(/-----BEGIN CERTIFICATE-----/g, "").replace(/-----END CERTIFICATE-----/g, "").replace(/-----BEGIN PUBLIC KEY-----/g, "").replace(/-----END PUBLIC KEY-----/g, "").replace(/\s/g, "");
  if (!lines)
    return null;
  return base64ToUint8Array(lines).buffer;
}
function base64ToUint8Array(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
function uint8ArrayToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
async function deflateRaw(data) {
  const cs = new CompressionStream("deflate-raw");
  const writer = cs.writable.getWriter();
  writer.write(data);
  writer.close();
  const reader = cs.readable.getReader();
  const chunks = [];
  let totalLength = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done)
      break;
    chunks.push(value);
    totalLength += value.length;
  }
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

export { buildAuthnRequestUrl as b, fetchIdpMetadata as f, generateSpMetadata as g, processSamlResponse as p };
//# sourceMappingURL=saml-ndSwh4nV.js.map
