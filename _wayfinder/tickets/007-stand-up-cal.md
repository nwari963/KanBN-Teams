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
Cal.diy is running via `docker-compose.cal.yml` (compose project `caltest`, own Postgres volume `cal-db-data`). Both containers are healthy: `caltest-cal-diy-1` (locally built `caldiy:local` from calcom/cal.diy @ 54343aa) and `caltest-cal-diy-db-1` (postgres:16-alpine, db `calendso`). Port `3457` publishes to the host and serves 200: `curl -L http://127.0.0.1:3457` → `/auth/setup?step=1` returns 200 (fresh first-run setup wizard; no admin user yet, which is the expected healthy state for a new instance). Env comes from ignored, `0600` `.env.cal`: `NEXT_PUBLIC_WEBAPP_URL`/`NEXTAUTH_URL` = `http://192.168.1.125:3457`, telemetry disabled, `NODE_ENV=production`.

Two build-time notes: the arm64 image build hit Disk-full/ghost-container issues during startup, resolved by freeing disk plus a daemon restart; and the host's current LAN IP is `192.168.0.101` — the `192.168.1.125` env was written for the earlier studio subnet, which is not currently assigned to this machine. The container binds `0.0.0.0` so it follows whatever IP the host has; if the studio moves back to `192.168.1.x` the env stays correct, otherwise the URL should be updated (Cal uses it to build booking links).
