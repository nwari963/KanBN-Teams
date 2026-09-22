---
type: wayfinder-ticket
status: closed
labels: [wayfinder:research]
blocked_by: []
---

# Outline self-host footprint

## Question
What does running Outline (getoutline.com, self-hosted) on the laptop require: docker compose services (outline + its own postgres + redis?), mandatory env (SECRET_KEY, UTILS_SECRET, URL, database/redis URLs), auth setup for email-less LAN use, ARM64 image availability, RAM footprint alongside Kan+Cal?

## Context
Earlier research at docs/research/doc-layer-alternatives.md ranked Outline the winner (granular API, unlimited self-hosted users). Primary sources: outline docs (docs.getoutline.com/s/hosting), docker hub getoutline/outline. Cite URLs.

## Required outcome
Cited markdown at docs/research/outline-selfhost.md + '## Resolution' section here; exact service list for docker-compose.outline.yml and auth recommendation for LAN-only use.

## Resolution
Research complete → docs/research/outline-selfhost.md (all claims cited to docs.getoutline.com, .env.sample, Docker Hub registry API, Outline OpenAPI spec).

- **Services (4):** outline + postgres + redis + dex. No https-portal, no MinIO, no SMTP. Port 3458.
- **Auth:** Outline has NO native email+password login — an external provider is mandatory. For offline LAN: **Dex OIDC with static password DB (sqlite)**, ~30-50 MB RAM. First dex login becomes Outline admin; email is just a profile claim, nothing sent; SMTP unset is fine. Cloud SSO (Slack/Google) needs internet — out.
- **Env minimum:** URL, DATABASE_URL, REDIS_URL, SECRET_KEY, UTILS_SECRET + FILE_STORAGE=local w/ FILE_STORAGE_LOCAL_ROOT_DIR, PGSSLMODE=disable, FORCE_HTTPS=false, WEB_CONCURRENCY=1. Migrations auto-run at start.
- **ARM64:** yes — verified via Docker Hub registry API: outlinewiki/outline and dexidp/dex both multi-arch amd64+arm64; native on OrbStack.
- **RAM:** ~550 MB idle / ~900 MB peak measured (outline ~300, pg ~150, redis ~50, dex ~50). Fine next to Kan+Cal.
- **API for Kan sync:** base `http://192.168.1.125:3458/api`, RPC-style `POST /api/<method>` (documents.create etc.), `Authorization: Bearer ol_api_...`; mint key in Settings → API & Apps or `POST /api/apiKeys.create` (value shown once).
