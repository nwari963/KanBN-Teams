---
type: wayfinder-map
status: active
owner: nwari
created: 2026-09-21
tags: [wayfinder, studio-ops]
---

# Wayfinder Map — OTSICAL studio stack (Kan + Cal.diy)

## Destination
A running, branded **OTSICAL** stack on the studio laptop: Kan, Cal.diy, and Outline (docs layer, docker-compose.outline.yml) in the same Docker estate — all LAN-reachable via the machine's mDNS hostname `http://MacBook-Pro-de-Angelo.local` (Kan `:3456`, Cal.diy `:3457`, Outline `:3458`) — teammates onboarded, with small localized tailoring diffs — ready to hand execution to /to-spec when tailoring exceeds config.

## Notes
- Domain: creative studio ops (OTH=RCODE: software + art), 6–20 teammates, host = user laptop, unstable internet, LAN-first.
- Skills to consult: grilling, domain-modeling, research. Ponytail full.
- Tracker: local markdown (fork's GitHub Issues are disabled — flip them on in repo Settings → Features to migrate the map; nothing else changes).
- Settled before charting: destination = running stack; Cal role = internal scheduling first, client booking later; Outline IN as docs layer (user reversed the earlier cut); rename = brand strings only (technical identifiers stay upstream — renames break builds & merges); fork DIVERGES from kanbn/kan (ADR-0002 to record, supersedes ADR-0001).
- In flight: Kan docker build (3rd attempt, OrbStack restarted).

## Decisions so far

- [Stand up Cal.diy service](./tickets/007-stand-up-cal.md): running via `docker-compose.cal.yml` on port 3457 with own Postgres, healthy (`caldiy:local` + postgres:16-alpine); first-run setup wizard serves 200. Env in ignored `0600` `.env.cal` with the estate mDNS hostname `http://MacBook-Pro-de-Angelo.local:3457`. See ticket Resolution.
- [Integration contract: bookings to boards](./tickets/006-integration-contract.md): create-only Cal webhook bridge to a dedicated Studio Schedule board; UID-idempotent create/update; reschedules preserve workflow, cancellations preserve history; REQUESTED/REJECTED/PAID ignored in v1.
- [Studio tailoring v1 scope](./tickets/004-tailoring-scope.md): three studio board templates; visible OTSICAL branding; manual DMG updates; colors use existing eight-color palette with soft-surface + strong-accent tokens; optional full-surface list/card colors are independent of labels and require `/to-spec`.
- [Verify Kan LAN stack and onboard first teammate](./tickets/003-verify-kan-onboard.md): Kan live + admin account created (verified in DB); invite-link onboarding deferred to tailoring (SMTP off, invite links upstream-gated).
- [Cal.diy alternatives verdict](./tickets/010-cal-alternatives.md): **keep Cal.diy** — only candidate with booking webhooks (bridge arch A); ARM64 miss is one-time build pain; fallback Cal.com CE `-arm` image; revisit → LibreBooking if room-inventory conflict checking becomes hard. See `docs/research/cal-alternatives.md`.
- [Stand up Outline service](./tickets/009-stand-up-outline.md): Outline live and healthy at `:3458`, Dex OIDC healthy at `:3459/dex`; Postgres 16 + Redis + local attachments; credentials remain local.
- Identity: LLDAP is the shared directory behind Dex for Kan and Outline; Kan passwords remain during migration, and Cal.diy keeps separate credentials.
- [Shared identity directory](./tickets/011-shared-identity-directory.md): LLDAP directory behind Dex; migration and rollback checks are specified, implementation pending.
- [Deliver the Project Wiki MVP](./tickets/012-project-wiki-mvp.md): implementation committed; Outline side configured (collection `Project Wiki`, key `kan-sync`, Kan env wired, `documents.list` verified 200 from the Kan container); three canonical templates created via Kan's `board.create` and the identity migration applied + report reviewed (3 classified, `pROJECT` skipped). Remaining: end-to-end flow + failure recovery checks and teammate sign-in.
- [Outline self-host footprint](./tickets/008-outline-footprint.md): 4 containers (outline+pg+redis+dex, port 3458), local file storage, no SMTP; Dex static-password OIDC is the only offline auth; ARM64 confirmed; ~550MB RAM idle.
- [002] Cal bookings → Kan: use Cal webhook → small receiver → Kan REST `POST /api/v1/cards` (API key). Skip MCP and direct DB writes. See `docs/research/cal-diy-integration.md`.
- [Cal.diy self-host footprint](./tickets/001-cal-diy-footprint.md): GO (conditional). Minimal 2 services: cal-diy-db + cal-diy on port 3050; MIT fork; no prebuilt images, so build once locally on arm64 (~20–45 min, 4–6 GB peak; ~1.5 GB steady). Detail: `docs/research/cal-diy-selfhost.md`.
- [Bundle OTSICAL desktop wrapper DMG](./tickets/005-wrapper-dmg.md): branded ARM64 DMG built, ad-hoc signature verified before and after mounting, targets `http://MacBook-Pro-de-Angelo.local:3456`; final SHA-256 in ticket.

## Live tickets
- [Cal.diy self-host footprint](./tickets/001-cal-diy-footprint.md)
- [Cal.diy-OTSICAL integration surface](./tickets/002-integration-surface.md)
- [Verify Kan LAN stack and onboard first teammate](./tickets/003-verify-kan-onboard.md)
- [Shared identity directory](./tickets/011-shared-identity-directory.md)
- [Deliver the Project Wiki MVP](./tickets/012-project-wiki-mvp.md)

## Not yet specified
- Client-facing booking flows (event types for clients, approvals) — after internal scheduling proves out.
- Hosting posture: laptop permanence vs Oracle Always Free VM (uptime, sleep, backups).
- Backup strategy for the Postgres volume once real team data lands.
- Mobile access quality (PWA vs wrapper) — observe first.
- Identity-directory deployment and OIDC migration — see ticket 011.

## Out of scope
- Offline sync engine (LAN covers same-network; capture-then-transfer elsewhere).
- Renaming technical identifiers (ghcr image names, @kan/* scopes) — breaks upstream merges.
- Building a custom calendar (Cal.diy IS the calendar).
- Deploying Outline in this effort.
