async function sendEmail(platform, emailReq) {
  const env = platform?.env;
  const emailWorker = env?.EMAIL_WORKER;
  if (!emailWorker) {
    console.warn("EMAIL_WORKER binding not available — email not sent:", emailReq.type);
    return false;
  }
  try {
    const res = await emailWorker.fetch(
      new Request("https://email-worker/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...env.EMAIL_WORKER_TOKEN ? { Authorization: `Bearer ${env.EMAIL_WORKER_TOKEN}` } : {}
        },
        body: JSON.stringify(emailReq)
      })
    );
    if (!res.ok) {
      const body = await res.text();
      console.error("Email worker error:", res.status, body);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to call email worker:", err.message);
    return false;
  }
}
async function sendInviteEmail(platform, params) {
  return sendEmail(platform, { type: "invite", ...params });
}
async function sendIncidentEmail(platform, params) {
  return sendEmail(platform, { type: "incident_notification", ...params });
}

export { sendEmail, sendIncidentEmail, sendInviteEmail };
//# sourceMappingURL=email-BNV8ODsA.js.map
