---
type: wayfinder-ticket
status: closed
labels: [wayfinder:task]
blocked_by: ['001-cal-diy-footprint']
---

# Stand up Cal.diy service

## Question
Add Cal.diy per footprint research as docker-compose.cal.yml (do NOT edit upstream docker-compose.yml), own Postgres, port 3457, LAN env (NEXT_PUBLIC_WEBAPP_URL=http://192.168.1.125:3457). Verify health 200.

## Context
Repo root: /Users/nwariri/OTH=RCOD=.DEV/EXPERIMENTS/KANBN TEAMS. See map Notes.

## Required outcome
Resolution comment (in-ticket '## Resolution' section) + status: closed when done; map's Decisions so far gains one line.

## Resolution
Cal.diy is running via `docker-compose.cal.yml` (compose project `caltest`, own Postgres volume `cal-db-data`). Both containers are healthy: `caltest-cal-diy-1` (locally built `caldiy:local` from calcom/cal.diy @ 54343aa) and `caltest-cal-diy-db-1` (postgres:16-alpine, db `calendso`). Port `3457` publishes to the host and serves 200: `/` → `/auth/setup?step=1` returns 200 via mDNS hostname, LAN IP, and loopback (fresh first-run setup wizard; no admin user yet, which is the expected healthy state for a new instance). Env comes from ignored, `0600` `.env.cal`: `NEXT_PUBLIC_WEBAPP_URL`/`NEXTAUTH_URL` = `http://MacBook-Pro-de-Angelo.local:3457`, `ALLOWED_HOSTNAMES` incl. that hostname, telemetry disabled, `NODE_ENV=production`.

### LAN identity
Cal uses the estate-standard mDNS hostname (like Kan and Outline) rather than a static IP, because the laptop's LAN IP changes by subnet: it was `192.168.0.101` when this ticket was closed out and `192.168.1.125` (the studio subnet, matching the original host-config research) shortly after — mDNS keeps booking links valid on whichever subnet the host is on. The original static-IP `192.168.1.125` config was correct *while* the machine is on the studio subnet; the hostname survives the roams. Verified 200 on `MacBook-Pro-de-Angelo.local:3457`, `192.168.1.125:3457`, and `127.0.0.1:3457`.

Build-time note: the arm64 image build hit Disk-full/ghost-container issues during startup, resolved by freeing disk plus a daemon restart (stale `caltest2-*`/`kanbnteams-*` containers and empty volumes from failed starts were removed).
