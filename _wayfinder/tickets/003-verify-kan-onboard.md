---
type: wayfinder-ticket
status: open
labels: [wayfinder:task]
blocked_by: []
---

# Verify Kan LAN stack and onboard first teammate

## Question
Confirm containers healthy, curl http://localhost:3456 = 200, signup works, create workspace, generate invite link. .env: WEB_PORT=3456, DISABLE_EMAIL=true, LAN IP 192.168.1.125. Record container status + HTTP result + where the invite link lives (never paste the secret link into the map).

## Context
Repo root: /Users/nwariri/OTH=RCOD=.DEV/EXPERIMENTS/KANBN TEAMS. See map Notes.

## Required outcome
Resolution comment (in-ticket '## Resolution' section) + status: closed when done; map's Decisions so far gains one line.


## Progress note (2026-09-21)
- kan-db healthy, kan-web up; HTTP 307 on :3456 (localhost AND 192.168.1.125), /auth/sign-up returns 200, 31 tables migrated, Next.js "Ready in 363ms".
- REMAINING (HITL): user signs up at http://192.168.1.125:3456, creates workspace, generates invite link (Members -> Invite). Ticket closes when a teammate account exists.


## Verification update
Kan is healthy at `http://MacBook-Pro-de-Angelo.local:3456`; database migrations completed; password signup/sign-in API verified. The temporary verification user was removed, leaving zero users so the human can create the canonical first admin. Remaining: user creates first account/workspace and onboards one teammate.
