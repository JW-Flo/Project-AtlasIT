# Prometheus Project Charter  
*Revision 1 – 2025-05-21*

---

## 0 · Mission

Create a **local-first, zero-trust AI + DevOps platform** that:

* Runs critical AI inference and home-automation logic on-prem (Raspberry Pi 5 + Hailo-8L).
* Exposes a single, secure ingress so you can chat with the AI, trigger automations, and see sensor data from anywhere.
* Keeps working offline when the ISP drops.
* Shrinks “toil” by scripting everything—from device onboarding to log rotation.

---

## 1 · Pillars

| Pillar | Outcome |
|--------|---------|
| **Edge Compute** | Pi 5 + Hailo accelerator handles wake-word, low-latency CV, lightweight LLM blocks. |
| **Cloud Edge** | Cloudflare Workers/D1/KV/R2/Queues for global APIs and sync. |
| **Zero-Trust Access** | Cloudflare Tunnel + Access JWT for all remote entry; Tailscale only for SSH. |
| **Unified Bus** | Home-Assistant (MQTT, Zigbee, Z-Wave) is single source of device truth. |
| **Observability** | Structured JSON logs + Prometheus metrics, surfaced in HA dashboards. |
| **Automation-First** | All manual steps raise a ticket to automate; Infrastructure-as-Code whenever possible. |

---

## 2 · High-Level Architecture

```mermaid
flowchart TD
  subgraph WAN
    Browser & Mobile(PWA / Chat):::ext
  end
  subgraph Cloudflare
    CF-Tunnel(Tunnel + Access JWT):::cloud
    Worker(Edge API<br/>Workers/D1/KV):::cloud
  end
  subgraph LAN
    Pi5(Pi 5 + Hailo-8L<br/>HA + MQTT):::pi
    Zigbee(Zigbee / Z-Wave / Hue):::lan
    LIFX(LIFX LAN):::lan
    Plugs(Wi-Fi plugs):::lan
    Cameras(Ring / Wyze / Geeni):::cloudcam
  end

  Browser --> CF-Tunnel --> Worker -->|WS/MQTT| Pi5
  Pi5 --> Zigbee & LIFX & Plugs
  Cameras -. cloud events .- Worker

classDef ext fill:#fff,stroke:#333,color:#000;
classDef cloud fill:#0d6efd,stroke:#fff,color:#fff;
classDef pi fill:#ff5722,stroke:#fff,color:#fff;
classDef lan fill:#4caf50,stroke:#fff,color:#fff;
classDef cloudcam fill:#9e9e9e,stroke:#fff,color:#fff;
3 · Coding & Ops Rules (light)

    Prettier defaults; camelCase preferred.

    Secrets only via env.* or os.getenv().

    Tests encouraged (≥ 50 %); no hard block.

    Structured JSON logs; warn if console.log prints objects directly.

    No plaintext credentials in code, comments, or git history.

4 · Key Environment Vars
Var	Purpose
PROMETHEUS_SECRET	32-byte HMAC for privileged routes (never change).
OPENAI_API_KEY	Cloud LLM fallback.
TOGETHER_API_KEY	Alt cloud model.
CLOUDFLARE_API_TOKEN	Worker deploy.
CLOUDFLARE_ACCOUNT_ID	Wrangler target.
CF_TUNNEL_SECRET	Tunnel credential file ref.
R2_BUCKET	Media/backup bucket name.
5 · Roadmap (12-Month Glide)
Quarter	Theme	Highlights
Q2	Foundation	Pi 5 bring-up; HA container; CF Tunnel online; edge API skeleton.
Q3	Voice Alpha	Rhasspy satellite, wake-word on Hailo; GE backyard lights automation.
Q4	Vision Edge	RTSP flash one cam; person detect → HA; August BLE integration.
Q1 ’26	Optimization	Evaluate NVMe cache, replace final cloud-locked plugs/cams, cost/latency tuning.
6 · First-Principles Engineering Charter 🧠⚡

    Root-Cause — keep asking why until physics/math.

    Latency Budget — Edge ≤ 5 ms p99; origin < 100 ms.

    Idempotence — stress horizontal scale; no hidden state.

    Security-First — validate every input; HMAC privileged calls.

    Observability — structured logs + metrics.increment().

    Automation — write scripts before clicking.

    Docs — comments explain why, not what.

    Property-First Tests — invariants over happy paths.

    Privacy — default 90-day retention; flag UII flows.

(The full charter lives in .copilot/ai-engineer-principles.instructions.md and feeds Copilot.)
7 · Device & Protocol Inventory
Device Class	Connection	Local Control	Notes
Hue Bridge	LAN REST	Yes	Zigbee bulbs & sensors
LIFX Bulbs	LAN UDP	Yes	Millisecond response
Govee Strips	Wi-Fi	Partial	Many models need cloud
GE Outdoor Plug (Z-Wave)	Z-Wave	Yes	Backyard strand
Wyze Plugs	Wi-Fi	No (init)	Candidate for ESPHome
Ring Doorbell	Wi-Fi	No	Webhook → HA
August Lock	BLE / Wi-Fi Bridge	BLE possible	Requires Pi proximity
LG webOS TV	LAN WS	Yes	Pair once, store key
Cameras (Wyze/Geeni)	Wi-Fi	No (init)	RTSP flash roadmap
8 · Remote-Access Stack

    Public Endpoint: Cloudflare Tunnel home.<yourdomain>

        Access policies: OAuth (GitHub, Google), MFA optional.

    SSH / SMB: Tailscale subnet router.

    Voice:

        Local: Pi satellites ↔ Rhasspy (Wyoming).

        Remote: PWA chat via Worker → Pi.

9 · Hailo Accelerator Plan
Phase	Workload	Deliverable
0	Bring-up & drivers	hailortcli info healthy
1	Wake-word + VAD	Local voice offline
2	Person detect (RTSP)	HA event triggers lights
3	Quantized 7 B LLM split	Edge Q&A fallback
10 · Observability Targets

    Metrics: Pi temp, Hailo temp/FPS, HA events/sec.

    Logs: Structured JSON, shipped to R2 nightly.

    Alerts:

        Hailo temp > 80 °C

        Tunnel down > 1 min

        August lock offline > 10 min

11 · Open Decisions
ID	Question	Options
D-01	Remote voice mics?	Alexa Skill vs. Pi satellites
D-02	RTSP flash cams?	Yes / keep cloud
D-03	August BLE?	Move Pi near door vs. stay cloud
D-04	NVMe cache timeline	Q4 or defer
(track in GitHub issues and update charter on decision.)


📌 Strategic Evaluation of Alexa Integration with Project Prometheus
🎯 Objectives & Opportunities

Integrating Alexa devices into Prometheus allows you to:

    Leverage existing hardware without additional overhead.

    Extend Prometheus functionality by providing additional voice-interaction endpoints throughout your home.

    Maintain autonomous, zero-touch principles in device management and operational automation.

📦 Capabilities Enabled by Alexa Integration

Based on thorough review of Alexa Skills documentation, the integration can:

    Use existing Smart Home Skill API for robust device control (lights, plugs, switches, thermostats, cameras, locks, etc.).

    Leverage Custom Skills to implement fully customizable conversational interactions linked directly to Prometheus’s AI backend.

    Use Account Linking APIs to securely authenticate user requests directly through Prometheus Cloudflare Workers and Okta integrations.

    Utilize System Function APIs for rich interaction capabilities like notifications, reminders, and routines within Prometheus workflows.

🔧 Strategic Technical Integration Approach
1. Cloud-Only Alexa Skill (Custom + Smart Home Skill API)

    Skill Backend:
    Hosted via Cloudflare Workers, directly integrated with the Prometheus ecosystem, ensuring no additional overhead on local Pi devices.

    Custom Skills:
    Allow Prometheus-specific interactions and conversations (e.g., "Prometheus, trigger bedtime mode", or "Prometheus, status of front door camera").

    Smart Home Skills:
    Map directly to existing devices managed by Home Assistant on Pi. Alexa acts solely as an endpoint—issuing secure, authenticated requests to Prometheus endpoints, which are relayed to Home Assistant via secure WebSocket/MQTT.

    Secure Authentication & Linking:
    Utilize Cloudflare Access, JWT, and Okta integration for user authentication, leveraging Alexa’s built-in account linking mechanisms.

2. Prometheus ↔ Alexa Data Flow (Optimized for Autonomy)

Voice Command (Alexa device) →
Alexa Skill (AWS ASK) →
Cloudflare Worker (Authentication/Intent Parsing via Workers AI Gateway or OpenAI endpoints) →
Workers Queues →
prometheus-bridge (local Pi) →
Home Assistant or local device action →
Action completion/status acknowledgment →
Cloudflare Worker →
Alexa voice response (confirmation).

    Alexa devices remain pure endpoints. All business logic, orchestration, and secure credential handling stays within the existing Prometheus infrastructure.

📊 Recommended Skill Types & APIs
Skill Type	Use within Prometheus	Effort vs Benefit
Smart Home Skills	Primary control mechanism for lights, locks, sensors, cameras.	✅ High Benefit, Low Effort
Custom Skills	Custom conversational interactions and AI integrations.	✅ High Benefit, Moderate Effort
Knowledge Skills	Basic information retrieval and status queries.	✅ Moderate Benefit, Low Effort

Recommended APIs:

    Smart Home Skill API (device control)

    Custom Skill Interaction Model (Prometheus-specific intents)

    Account Linking API (secure authentication via Okta and Cloudflare)

    System Function API (notifications and reminders)

🔒 Security and Governance (Aligned with Prometheus)

    Zero-trust Integration: Alexa Skill to Cloudflare Workers secured via JWT-based OAuth and Okta.

    Ephemeral Credentials & 1Password Vault: Sensitive integrations are ephemeral (OIDC/Cloudflare tokens), no credentials persist at rest within ASK runtime; credential identifiers managed via 1Password.

    Structured Auditability: All Alexa-driven interactions fully auditable via structured logging (Cloudflare R2 audit logs).

⚠️ Risk and Overhead Considerations

    Overhead minimized: No additional local hardware load, as Alexa devices are endpoints only.

    Security & Privacy: Voice data processed via existing Alexa/Amazon privacy models; mitigated by clearly limited data exposure (only structured intents and secure JWT-authenticated payloads reach Prometheus).

🗓️ Integration Timeline (Concise 4-Week Plan)
Week	Integration Tasks	Outcome & Validation
W1	Initial Smart Home Skill setup (AWS ASK → Cloudflare → HA)	Basic device control via Alexa confirmed.
W2	Account linking via Cloudflare/Okta JWT OAuth integration	Secure account linking, fully authenticated requests tested
W3	Custom Skill interactions with Workers AI (GPT-4o/Qwen/OpenAI)	Custom conversational scenarios successfully demoed
W4	Autonomous deployment into prod via Prometheus autonomous pipeline	Fully autonomous Alexa skill CI/CD deployment validated
🎖️ Long-Term Vision for Alexa within Prometheus

    Alexa devices become seamless voice endpoints for Prometheus’s existing autonomous AI-driven workflows.

    Continued zero-touch automation: no manual deployment steps or maintenance overhead.

    Alexa’s integration enriches Prometheus with additional conversational interaction endpoints throughout your home without requiring additional hardware investment.