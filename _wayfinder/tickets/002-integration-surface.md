---
type: wayfinder-ticket
status: closed
labels: [wayfinder:research]
blocked_by: []
---

# Cal.diy-OTSICAL integration surface

## Question
What integration surface does Cal.diy expose to push bookings into Kan: API v2, webhooks (booking.created/updated/cancelled), auth, payload shapes? Verify Kan's ingest paths (packages/api tRPC routers; packages/mcp exists!). Outcome: cited markdown at docs/research/cal-diy-integration.md with 2-3 ranked architectures.

## Context
Repo root: /Users/nwariri/OTH=RCOD=.DEV/EXPERIMENTS/KANBN TEAMS. See map Notes.

## Required outcome
Resolution comment (in-ticket '## Resolution' section) + status: closed when done; map's Decisions so far gains one line.

## Resolution

Written: `docs/research/cal-diy-integration.md` (cited, both local paths and cal.com doc URLs).

- **Cal.diy side**: API v2, Bearer API key (`cal_`/`cal_live_`), 120 req/min; webhooks `BOOKING_CREATED/RESCHEDULED/CANCELLED/REJECTED/REQUESTED/PAID` (no generic `booking.updated`) with `{triggerEvent, createdAt, payload:{uid, title, startTime, endTime, organizer, attendees, location, metadata}}` envelope; HMAC secret verification; self-hosted instances allow HTTP/private-IP subscriber URLs.
- **Kan side**: real REST API exists — `/api/v1/*` via trpc-to-openapi (`apps/web/src/pages/api/v1/[...trpc].ts`), API-key auth (Bearer or `x-api-key`, better-auth apiKey plugin). `POST /api/v1/cards` is the ingest target. `packages/mcp` (stdio + hosted `/api/mcp`) is a wrapper over that same REST API — callable externally but pointless ceremony for webhooks. Kan's own webhooks are outbound-only. Direct DB writes would require replicating card.repo's transaction (index math, `workspaces.cardCounter`, `card_activities`).
- **Ranked**: (1) Cal webhook → ~40-line receiver → Kan REST `POST /api/v1/cards` — low effort, low fragility; (2) cron-poll Cal v2; (3) webhook→MCP (protocol ceremony, cloud plan-gated); (4) direct Postgres insert (rejected).
- **Recommendation**: Option 1, create-only first (BOOKING_CREATED), uid-based mapping later if cancel/reschedule sync is needed.
