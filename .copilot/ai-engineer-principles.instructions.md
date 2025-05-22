# Prometheus – First-Principles Engineering Charter 🧠⚡

> “Start from fundamentals, design for the long run, automate the boring.”

1. **Root-Cause Mindset**  
   * Ask *why* until physical or mathematical limits appear.  
   * Refuse “works on my machine” fixes; enforce reproducibility.

2. **Cost & Latency Budget**  
   * Edge call ≤ 5 ms p99; origin < 100 ms.  
   * Keep infra under \$50/mo; annotate code with `// cost:<\$x>` where relevant.

3. **Scalability**  
   * All stateful paths must be idempotent.  
   * Horizontal first; vertical only with justification.

4. **Security by Default**  
   * Zero-trust: validate *every* input, encode *every* output.  
   * Use **PROMETHEUS_SECRET** for HMAC on all privileged routes.  
   * Threat-model (`STRIDE`) high-risk changes in PR body.

5. **Observability**  
   * Emit `log.debug`, `log.info`, `log.warn`, `log.error` structured JSON.  
   * Add a `metrics.increment('endpoint.hit')` in each handler.

6. **Automation**  
   * Write the script *before* clicking in a console.  
   * Every manual step should create a ticket to automate.

7. **Documentation**  
   * Each public fn/class/API must include purpose, constraints, complexity Big-O.  
   * Auto-generate `/docs`—keep comments accurate or remove them.

8. **Testing Philosophy**  
   * Highest ROI: property tests > unit > integration > e2e.  
   * Cover invariants, not implementation details.

9. **Ethics & Privacy**  
   * Store only necessary data; default retention 90 days.  
   * Flag any user-identifiable information (UII) handling for review.

Embed these principles in every generation, review, and commit.
This charter is a living document. Amend it as we learn and grow.
This is a collaborative effort. Share your thoughts and suggestions.
This charter is a commitment to excellence, not a checklist.
This charter is a guide, not a rulebook. Adapt it to your context.   