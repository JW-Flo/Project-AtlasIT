/**
 * Lightweight SMTP client for Cloudflare Workers.
 * Uses the cloudflare:sockets TCP API (requires nodejs_compat).
 * Supports STARTTLS, AUTH LOGIN, and AUTH PLAIN.
 */

import { connect } from "cloudflare:sockets";
import type { EmailMessage, SendResult } from "./send";

export interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

/**
 * Send email via SMTP relay.
 */
export async function sendViaSmtp(message: EmailMessage, config: SmtpConfig): Promise<SendResult> {
  const recipients = Array.isArray(message.to) ? message.to : [message.to];
  const from = message.from || config.fromEmail;
  const fromName = message.fromName || config.fromName;

  // Build RFC 2822 message
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const toHeader = recipients.join(", ");
  const msgId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@atlasit.pro>`;

  const rawMessage = [
    `From: ${fromName} <${from}>`,
    `To: ${toHeader}`,
    `Subject: ${message.subject}`,
    `MIME-Version: 1.0`,
    `Message-ID: ${msgId}`,
    `Date: ${new Date().toUTCString()}`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: quoted-printable`,
    ``,
    message.html,
    ``,
    `--${boundary}--`,
  ].join("\r\n");

  const useStartTLS = config.port === 587 || config.port === 25;
  const useImplicitTLS = config.port === 465;

  try {
    const socket = connect(
      { hostname: config.host, port: config.port },
      { secureTransport: useImplicitTLS ? "on" : "off", allowHalfOpen: false },
    );

    const writer = socket.writable.getWriter();
    const reader = socket.readable.getReader();
    const decoder = new TextDecoder();

    async function readResponse(): Promise<string> {
      let response = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        response += decoder.decode(value, { stream: true });
        // SMTP responses end with \r\n and the continuation lines have a dash
        // A final response line has a space after the code (e.g., "250 OK\r\n")
        const lines = response.split("\r\n");
        const lastComplete = lines.slice(0, -1);
        if (lastComplete.length > 0) {
          const last = lastComplete[lastComplete.length - 1];
          // Check if this is a final response (code + space, not code + dash)
          if (last.length >= 4 && last[3] === " ") {
            return response;
          }
        }
      }
      return response;
    }

    async function send(cmd: string): Promise<string> {
      await writer.write(new TextEncoder().encode(cmd + "\r\n"));
      return readResponse();
    }

    function checkOk(response: string, expectedCode: string): void {
      if (!response.startsWith(expectedCode)) {
        throw new Error(`SMTP error: expected ${expectedCode}, got: ${response.trim()}`);
      }
    }

    // Read server greeting
    const greeting = await readResponse();
    checkOk(greeting, "220");

    // EHLO
    let ehloResp = await send("EHLO atlasit.pro");
    checkOk(ehloResp, "250");

    // STARTTLS if needed
    if (useStartTLS && ehloResp.includes("STARTTLS")) {
      const tlsResp = await send("STARTTLS");
      checkOk(tlsResp, "220");

      // Upgrade to TLS
      const tlsSocket = socket.startTls();
      // Release old reader/writer
      reader.releaseLock();
      writer.releaseLock();

      // Get new reader/writer from TLS socket
      const tlsWriter = tlsSocket.writable.getWriter();
      const tlsReader = tlsSocket.readable.getReader();

      // Reassign for the rest of the session
      const tlsSend = async (cmd: string): Promise<string> => {
        await tlsWriter.write(new TextEncoder().encode(cmd + "\r\n"));
        let resp = "";
        while (true) {
          const { value, done } = await tlsReader.read();
          if (done) break;
          resp += decoder.decode(value, { stream: true });
          const lines = resp.split("\r\n");
          const lastComplete = lines.slice(0, -1);
          if (lastComplete.length > 0 && lastComplete[lastComplete.length - 1][3] === " ") {
            return resp;
          }
        }
        return resp;
      };

      // Re-EHLO after STARTTLS
      ehloResp = await tlsSend("EHLO atlasit.pro");
      checkOk(ehloResp, "250");

      // AUTH LOGIN
      const authResp = await tlsSend("AUTH LOGIN");
      checkOk(authResp, "334");
      const userResp = await tlsSend(btoa(config.username));
      checkOk(userResp, "334");
      const passResp = await tlsSend(btoa(config.password));
      checkOk(passResp, "235");

      // MAIL FROM
      const mailFromResp = await tlsSend(`MAIL FROM:<${from}>`);
      checkOk(mailFromResp, "250");

      // RCPT TO
      for (const rcpt of recipients) {
        const rcptResp = await tlsSend(`RCPT TO:<${rcpt}>`);
        checkOk(rcptResp, "250");
      }

      // DATA
      const dataResp = await tlsSend("DATA");
      checkOk(dataResp, "354");

      // Send message body, end with \r\n.\r\n
      await tlsWriter.write(new TextEncoder().encode(rawMessage + "\r\n.\r\n"));
      let dataEndResp = "";
      while (true) {
        const { value, done } = await tlsReader.read();
        if (done) break;
        dataEndResp += decoder.decode(value, { stream: true });
        if (dataEndResp.includes("250")) break;
      }

      // QUIT
      await tlsWriter.write(new TextEncoder().encode("QUIT\r\n"));
      tlsWriter.releaseLock();
      tlsReader.releaseLock();
      await tlsSocket.close();

      return { ok: true, messageId: msgId };
    }

    // Non-STARTTLS path (implicit TLS on 465 or plain on 25)
    // AUTH LOGIN
    if (ehloResp.includes("AUTH")) {
      const authResp = await send("AUTH LOGIN");
      checkOk(authResp, "334");
      const userResp = await send(btoa(config.username));
      checkOk(userResp, "334");
      const passResp = await send(btoa(config.password));
      checkOk(passResp, "235");
    }

    // MAIL FROM
    const mailFromResp = await send(`MAIL FROM:<${from}>`);
    checkOk(mailFromResp, "250");

    // RCPT TO
    for (const rcpt of recipients) {
      const rcptResp = await send(`RCPT TO:<${rcpt}>`);
      checkOk(rcptResp, "250");
    }

    // DATA
    const dataResp = await send("DATA");
    checkOk(dataResp, "354");

    await writer.write(new TextEncoder().encode(rawMessage + "\r\n.\r\n"));
    const dataEndResp = await readResponse();
    checkOk(dataEndResp, "250");

    // QUIT
    await send("QUIT");
    writer.releaseLock();
    reader.releaseLock();
    await socket.close();

    return { ok: true, messageId: msgId };
  } catch (err: any) {
    console.error("SMTP send failed:", err.message);
    return { ok: false, error: `SMTP: ${err.message}` };
  }
}
