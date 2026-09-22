---
type: wayfinder-ticket
status: closed
labels: [wayfinder:research]
blocked_by: []
---

# Cal.diy self-host footprint

## Question
What does running Cal.diy locally require: compose services, mandatory env vars, minimum resources, image availability (ARM64?), AGPL implications of pairing with AGPL Kan?
Docs: cal.com self-hosting guide. Outcome: cited markdown at docs/research/cal-diy-selfhost.md, go/no-go resource verdict, exact service list.

## Context
Repo root: /Users/nwariri/OTH=RCOD=.DEV/EXPERIMENTS/KANBN TEAMS. See map Notes.

## Required outcome
Resolution comment (in-ticket '## Resolution' section) + status: closed when done; map's Decisions so far gains one line.

## Resolution

**Done — cited doc at [docs/research/cal-diy-selfhost.md](../../docs/research/cal-diy-selfhost.md). Verdict: GO (conditional).**

- **Services**: cal.diy's own compose has 5 (database, redis, calcom, calcom-api, studio). Minimal = **2**: `cal-diy-db` (postgres) + `cal-diy` (web). Migrations + app-store seed run in-container on boot via `scripts/start.sh` — no extra services. Redis/api only if REST v2 wanted (ticket 006); studio on-demand only. No `.cal.com` avatar service exists (just optional env vars).
- **Env**: mandatory = `NEXT_PUBLIC_WEBAPP_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `CALENDSO_ENCRYPTION_KEY` (never rotate), `DATABASE_URL`(+`_DIRECT_URL`), `CALCOM_TELEMETRY_DISABLED=1`, `ALLOWED_HOSTNAMES` incl. LAN IP:port, `POSTGRES_*`. **No license key** — cal.diy is the MIT fork with EE stripped; `.env.example` states "no license key is required".
- **ARM64**: cal.com upstream publishes `-arm` (arm64) images, but **cal.diy has ZERO published images** (Hub API: pull_count 0, manifest 404 — README's Docker Hub section is stale). Build from source on arm64: native `node:20` base, est. 20–45 min / 4–6 GB peak / ~2–3 GB downloads (retry-friendly on flaky internet), pass `MAX_OLD_SPACE_SIZE=3072`.
- **Footprint**: ~1.5 GB steady (web ~1 GB + pg ~0.2–0.5 GB). Measured live: Docker VM 7.8 GB of 16 GB host, 1.7 GB already used by 6 containers → fits. **Port 3000 already taken by ideon-app** → remap to 3050. Build window is the only RAM-tight moment, not runtime.
- **Licensing**: cal.diy = **MIT** (LICENSE verified), upstream cal.com = MIT today (AGPL claims in 3rd-party guides are stale). Kan = AGPLv3. Separate containers talking over HTTP = no combined work; MIT→AGPL one-way compatible anyway. Keep LICENSE + Cal.com copyright in fork (MIT §​ ); names/logos are trademarks — OTSICAL brand-string rename plan already sidesteps. Kan AGPL §13 satisfied: LAN internal use + fork is public.
- **Admin bootstrap**: try first-user-signup-becomes-admin on boot; fallback = compose `studio` service (Prisma Studio :5555) → insert User (bcrypt pw, `metadata:{}`, set role ADMIN; new users default TRIAL). Seed script's `admin@example.com`/`ADMINadmin2022!` is dev-only — change or skip on LAN-exposed instance.

**docker-compose.cal.yml minimal**: `cal-diy-db` (postgres, no host port) + `cal-diy` (caldiy:local, 3050:3000, `.env.cal`); optional `profiles:["debug"]` studio. Full env list + citations in the doc.
