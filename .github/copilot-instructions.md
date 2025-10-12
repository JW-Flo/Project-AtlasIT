# Copilot Instructions (Project-AtlasIT Wrapper)

Canonical Source
Refer to AWhittleWandering/.github/copilot-instructions.md (treat that as source-of-truth).

Local Additions

- Services here must not redefine invariants; only extend.
- If adding platform-specific endpoints, still append feed entry in canonical repo (tags include project-atlasit).

Change Feed
Do NOT start a separate feed; consume canonical `docs/roadmap/live-change-log.ndjson`.

Override Policy
If platform requires exception, document under “Local Overrides” and append justification line to change feed.

Local Overrides
(none)

Agent Context

- Follow canonical Section 13 precedence.
- This wrapper must not introduce alternative context resolution logic.
