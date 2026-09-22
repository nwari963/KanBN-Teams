# Cal.diy → Kan integration surface research

Ticket: `_wayfinder/tickets/002-integration-surface.md` · Date: 2026-09-21
"Cal.diy" = a self-hosted Cal.com instance (same API v2 + webhook system as Cal.com SaaS; self-host relaxes the HTTPS/public-IP webhook URL restriction — see §1.3).

---

## 1. Cal.com (Cal.diy) side

### 1.1 Auth — API keys (v2)

- 3 auth methods: OAuth, **API key**, Platform (deprecated; no new signups since 2025-12-15).
  Source: https://cal.com/docs/api-reference/v2/introduction
- Keys are created at **Settings → Security** (`/settings/developer/webhooks` is where webhook subscriptions live). Test keys are prefixed `cal_`, live keys `cal_live_`.
- Usage: `Authorization: Bearer <key>` header on every request; HTTPS only.
- Rate limit: **120 req/min** with an API key (raisable by contacting support).
- **Self-hosted base URL**: an API key hits `https://<your-cal-domain>/api/v2/...` — v2 is resource-oriented JSON with a `{ "status": "success"|"error", "data": ... }` envelope.
  Source: https://cal.com/docs/api-reference/v2/v1-v2-differences

### 1.2 Webhook events (server-side)

Available triggers relevant to bookings (full list is longer — meeting started/ended, recording ready, no-show, etc.):

| Trigger | Meaning |
|---|---|
| `BOOKING_CREATED` | New confirmed booking |
| `BOOKING_RESCHEDULED` | Time changed |
| `BOOKING_CANCELLED` | Cancelled (incl. `cancellationReason`) |
| `BOOKING_REJECTED` / `BOOKING_REQUESTED` | Approval flow states |
| `BOOKING_PAID`, `BOOKING_PAYMENT_INITIATED` | Paid events |

Sources: https://cal.com/docs/developing/guides/automation/webhooks (trigger list), https://mintlify.com/calcom/cal.com/api/webhooks (API shape)

Register a webhook via UI (`/settings/developer/webhooks`) or API:

```
POST /v2/webhooks            # user-level
POST /v2/event-types/:id/webhooks   # per event type
Body: { subscriberUrl, active, triggers: ["BOOKING_CREATED", ...], secret? }
```

There is **no separate `booking.updated`** trigger — updates arrive as `BOOKING_RESCHEDULED` (time change) or the specialised triggers above. `BOOKING_CREATED` is the primary ingest event.

### 1.3 Payload shapes

Envelope (all booking triggers except MEETING_STARTED/ENDED):

```json
{
  "triggerEvent": "BOOKING_CREATED",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "payload": {
    "type": "30min", "title": "30 Minute Meeting", "description": "...",
    "startTime": "2024-01-15T10:00:00.000Z", "endTime": "2024-01-15T10:30:00.000Z",
    "organizer": { "id": 123, "name": "...", "email": "...", "timeZone": "..." },
    "attendees": [{ "name": "...", "email": "...", "timeZone": "..." }],
    "location": "https://cal.com/video/abc123",
    "uid": "booking-uid-123", "bookingId": 31,
    "metadata": {}, "responses": { "name": "...", "email": "..." }
  }
}
```

- `BOOKING_CANCELLED` adds `cancellationReason`; `BOOKING_RESCHEDULED` carries the booking with new times (same `uid`).
- Source: https://cal.com/docs/developing/guides/automation/webhooks (payload reference)
- **Self-hosted nuance**: SaaS blocks HTTP/private-IP/localhost subscriber URLs; **self-hosted accepts HTTP and private IPs** — a listener on the LAN or in docker-compose works.
  Source: https://cal.com/docs/developing/guides/automation/webhooks (Subscriber URL section)
- Signature verification: supply a `secret` when registering; Cal sends a signature you verify with HMAC (hex digest of the JSON body).
  Source: https://cal.com/docs/developing/guides/automation/webhooks (Secret section)

---

## 2. Kan ingest paths (verified in repo)

### 2.1 Kan has a real REST API (`/api/v1`), not just tRPC

`packages/api/src/routers/*.ts` procedures carry `openapi` meta and are served by `trpc-to-openapi`:

- Handler: `apps/web/src/pages/api/v1/[...trpc].ts` (CORS + 600 req/min rate limit) — mounts the same `appRouter` used by the UI, exposed as REST under `/api/v1`.
- Spec: `packages/api/src/openapi.ts` — `baseUrl: ${NEXT_PUBLIC_BASE_URL}/api/v1`, tags include Cards, Boards, Lists, Webhooks, Health.
- Machine-readable doc: `apps/web/src/pages/api/v1/openapi.json.ts`.
- Example — card create is `POST /api/v1/cards`: `packages/api/src/routers/card.ts:39-59` (openapi meta `method: "POST", path: "/cards"`; input `{ title, description, listPublicId, labelPublicIds, memberPublicIds, position: "start"|"end", dueDate }`).

**Auth for REST**: API-key auth via better-auth `apiKey` plugin (`packages/auth/src/plugins.ts:198-201`, `enableSessionForAPIKeys: true`) — accepts `Authorization: Bearer <key>` **or** `x-api-key: <key>` (`packages/auth/src/plugins.ts:21-29`). The REST context resolves a session from the key (`packages/api/src/trpc-context.ts:113-143`).

### 2.2 packages/mcp — externally callable, two ways

`packages/mcp` is a thin MCP wrapper over that same REST API (not over the DB):

- Stdio entrypoint: `packages/mcp/src/index.ts` (`StdioServerTransport`, config from `KAN_BASE_URL` + `KAN_API_TOKEN`).
- Tools: `packages/mcp/src/tools/card.ts` — `create_card`, `get_card`, `update_card`, `delete_card`, `duplicate_card` (+ board/list/label/member/checklist/workspace tools). `create_card` → `POST /api/v1/cards` (`packages/mcp/src/tools/card.ts:40`).
- HTTP transport: `apps/web/src/pages/api/mcp.ts` — hosted **StreamableHTTP MCP server at `/api/mcp`**, auth `Bearer <API key>`, `POST` only (gated on paid plan when `NEXT_PUBLIC_KAN_ENV=cloud`).

So yes — card creation is callable externally either as plain REST (`POST /api/v1/cards`) or MCP-over-HTTP (`/api/mcp`, `tools/call create_card`). The stdio MCP server is just a local convenience wrapper.

### 2.3 Non-tRPC HTTP surface (inbound)

- `/api/v1/*` REST (above) — the only generic inbound surface; API-key auth, zod-validated.
- `/api/mcp` — MCP StreamableHTTP (above).
- `apps/web/src/pages/api/partner/webhook.ts` — LemonSqueezy licensing webhook (HMAC-verified), **not** a generic ingest endpoint.
- `apps/web/src/pages/api/stripe/webhook.ts` — Stripe billing webhook, not generic ingest.
- **Kan's own webhook system is outbound only**: `workspace_webhooks` table + `webhookEvents = ["card.created","card.updated","card.moved","card.deleted"]` (`packages/db/src/schema/webhooks.ts:17-22`) — Kan POSTs to *your* URL on card changes (`packages/api/src/utils/webhook.ts` via `sendWebhooksForWorkspace`, called from `card.ts` router). No inbound webhook receiver exists.

### 2.4 What direct DB writes would require

`cardRepo.create` (`packages/db/src/repository/card.repo.ts:38-124`) does more than an INSERT, all inside one transaction:

1. Resolve list index (`position: start|end`, re-index conflicts via `UPDATE card SET index = index + 1 ...`).
2. `UPDATE workspaces SET cardCounter = cardCounter + 1` → `cardNumber` (the human-visible `#N`).
3. `INSERT INTO cards` (publicId via `generateUID()`, 12-char).
4. `INSERT INTO card_activities` (`card.created`).
5. Post-transaction the tRPC layer adds labels/members, sends mention emails, and fires outbound webhooks.

A direct SQL insert must reproduce steps 1–4 atomically (wrong `cardCounter` → duplicate card numbers; missing activity row → broken history feed), and would skip emails/webhooks/label attachment. It also bypasses `assertPermission`. Only worth it if the REST path is unusable.

---

## 3. Candidate architectures (Cal booking → Kan card)

### A. Cal webhook → ~40-line HTTP receiver → Kan REST API — **recommended**

```
Cal.diy (BOOKING_CREATED/CANCELLED/RESCHEDULED webhook)
  → tiny receiver (Node/Express or even a Next API route in apps/web)
     · verify HMAC secret
     · map payload → POST {KAN_BASE_URL}/api/v1/cards
       { title: `${payload.title} — ${attendees[0].name}`,
         description: markdown w/ time, attendee email, location, uid,
         listPublicId: <fixed "Bookings" list>, position: "end",
         dueDate: payload.startTime }
  → card appears in Kan (activity, webhooks, counter all correct)
```

- **Effort**: low. One small file + 2 secrets (Cal webhook secret, Kan API key). Cancel/reschedule map to `PUT /api/v1/cards/:id` / delete — store the Cal `uid` ↔ Kan card publicId mapping in the card description or a tiny KV/table if updates matter.
- **Fragility**: low. Uses only documented surfaces on both sides (Cal webhook payload reference; Kan's own `/api/v1` the MCP client itself uses). Cal webhook retries give at-least-once; dedupe on `uid` if it matters.
- Self-hosted Cal.diy even allows an HTTP/LAN receiver URL, so it can run next to Kan in the same docker-compose with no tunnel.

### B. Cal webhook → MCP (`/api/mcp` or stdio) → card

- Same receiver, but calls MCP `tools/call create_card` instead of REST.
- **Effort**: medium — MCP StreamableHTTP client handshake (initialize → tools/call) is more ceremony than one `fetch`; stdio variant means running the MCP server as a subprocess.
- **Fragility**: medium-high. Extra protocol layer that adds nothing here (MCP is for LLM agents, not webhooks); `/api/mcp` is additionally plan-gated on cloud (`apps/web/src/pages/api/mcp.ts:66-80`). The MCP tools are literally a wrapper over the REST calls in A.

### C. Poll Cal API v2 on a cron → Kan REST (or manual re-entry)

- `GET /v2/bookings?status=accepted` with Bearer key on a schedule; diff locally; create/update cards.
- **Effort**: medium (need state/dedupe store).
- **Fragility**: medium — polling lag, rate limit headroom fine (120/min), but you own change-detection logic that webhooks give you for free.
- Manual re-entry: zero code, but doesn't scale past a few bookings/week and silently drops data. Fine only as a stopgap.

### D. Direct Postgres insert into `cards`

- **Effort/fragility**: worst. Must replicate index math, `workspaces.cardCounter` increment, `card_activities` insert (see §2.4); breaks silently when schema drifts. Only defensible if Kan's REST were unavailable — it isn't.

### Ranking

| Rank | Option | Effort | Fragility | Why |
|---|---|---|---|---|
| 1 | **A — webhook → script → Kan REST** | Low | Low | Documented surfaces both sides; no state needed for create-only |
| 2 | C — cron poll Cal v2 | Medium | Medium | Works without inbound URL, but you own change detection |
| 3 | B — webhook → MCP | Medium | Med-High | Protocol ceremony + cloud plan gate; zero functional gain |
| 4 | D — direct DB insert | High | High | Reimplements repo transaction; schema-coupled |

---

## 4. Recommendation

**Build A**: one small webhook receiver that verifies Cal's HMAC and POSTs to Kan's existing `/api/v1/cards` with a Kan API key (`Bearer` or `x-api-key`). Create-only first (BOOKING_CREATED → new card); add cancel/reschedule handling (match on Cal `uid` stored in description or a small mapping) only if needed. Skip MCP for this (it's an LLM-agent surface, not an integration surface), skip DB writes (the REST path already runs the full transactional create with activities and counter). If an inbound URL is ever impossible, fall back to C (polling), never D.
