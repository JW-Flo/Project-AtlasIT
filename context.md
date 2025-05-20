# context.md — Autonomous Agent Deployment Instructions (Cursor/Cloudflare Copilot)

## Mission
Provision an agent that operates **completely hands-free**: accepts user prompts (text/voice), transmits to Cloudflare Worker for LLM + logic, and executes signed/validated actions in Cursor with **zero manual confirmation, no interactive prompts, and no ambiguity**. All actions must be deterministic, audit-logged, and the agent must never halt, ask for clarification, or require user intervention after initial launch.

---

## Direct Instructions for Agent (Strict Autonomy)

1. **Non-Interactive by Default**
    - After initial execution, the agent must process all inputs and outputs without stopping for user interaction, confirmation, or clarification.
    - If prompt is ambiguous or action cannot be validated, the agent must skip that prompt, log the issue, and proceed to next queued input.
    - All operational logic must be explicit and pre-defined—no guesswork, no fallback to unsafe/default behaviors.

2. **Input & Output**
    - Accepts input from stdin, file, or voice (batch or stream).
    - Transmits each prompt directly to Cloudflare Worker via secure, authenticated POST.
    - Receives signed action; immediately applies to Cursor via Remote API/CLI **without pausing or asking for permission**.
    - Logs all transactions, including errors and skipped prompts.

3. **Error Handling**
    - If action fails validation or execution, log error and proceed—never halt.
    - If Cloudflare Worker returns an error or invalid payload, log and move on.
    - If local agent crashes, restart automatically if run in scheduled/looped mode.

4. **Cursor/IDE Integration**
    - Actions are mapped directly to Cursor Remote API/CLI calls.
    - Never requires user confirmation. All mappings explicit and deterministic.
    - No interactive or blocking dialogs.

5. **Security & Logging**
    - All network comms over outbound HTTPS only.
    - Credentials are ephemeral and in-memory.
    - Local logs append-only and immutable. Cloud logs via Logpush/R2.
    - No secrets, business logic, or persistent data on disk.

6. **Deployment Constraints**
    - No Docker, no daemons, no open inbound ports.
    - Single native binary or script.
    - Installable, removable, and upgradable with no persistent system changes.
    - Must operate on macOS natively, without virtualization.

7. **Autonomy Enforcement**
    - **Never ask the user anything** after startup.
    - If uncertain, skip and log.
    - No "Are you sure?" prompts. No waiting for input. No default/fallback guesses.
    - All actions either succeed, skip, or log error—agent always continues execution.

---

## Implementation References

- [Cursor Remote API](https://www.cursor.so/docs/remote-api)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [OpenAI API](https://platform.openai.com/docs/)
- [Cloudflare Logpush](https://developers.cloudflare.com/logs/logpush/)

---

## Compliance Checklist

- [ ] No Docker, no daemons, no inbound ports
- [ ] Agent runs continuously or on-demand, never blocks for user input
- [ ] All actions are explicit and deterministic
- [ ] Logs every transaction locally and in cloud
- [ ] All secrets are ephemeral, never written to disk
- [ ] Agent never requests clarification or confirmation
- [ ] Errors and invalid prompts are logged and skipped, never block execution
- [ ] Easy removal/upgrade, no orphaned files/configs

---

**Give this file directly to the agent or developer in Cursor. The agent must adhere to strict zero-interaction, zero-guesswork, and full autonomy at all stages.** 