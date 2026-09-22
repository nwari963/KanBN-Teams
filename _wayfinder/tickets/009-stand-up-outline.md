---
type: wayfinder-ticket
status: closed
labels: [wayfinder:task]
blocked_by: [008-outline-footprint]
---

# Stand up Outline service

## Question
Deploy Outline per footprint research as docker-compose.outline.yml (own Postgres, own port — suggest 3458), LAN-reachable, auth usable without internet (local email or OIDC-less flow per research).

## Context
Do NOT edit upstream docker-compose.yml. Same estate as Kan :3456 and Cal :3457. Verify health 200 on LAN IP.

## Required outcome
'## Resolution' comment: compose path, containers healthy, URL, auth mode chosen.

## Resolution
Outline is running at `http://192.168.1.125:3458`; Dex OIDC at `http://192.168.1.125:3459/dex`. Containers verified healthy: outline, postgres:16-alpine, redis, dex. Both HTTP endpoints returned 200. Secrets stay in ignored `.env.outline`; attachments use local named-volume storage. Initial Dex user is `nwari@otsical.local`; password is held only in the local setup context and should be rotated before teammate onboarding.
