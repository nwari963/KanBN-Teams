# Cal.diy self-hosting footprint — research

Date: 2026-09-21 · Ticket: [_wayfinder/tickets/001-cal-diy-footprint.md](../../_wayfinder/tickets/001-cal-diy-footprint.md)
Target host: studio laptop (Apple Silicon, 16 GB RAM, OrbStack docker), LAN-first, Kan already earmarked for :3456.

Primary sources (all fetched 2026-09-21):

- Repo: https://github.com/calcom/cal.diy — [`docker-compose.yml`](https://github.com/calcom/cal.diy/blob/main/docker-compose.yml), [`Dockerfile`](https://github.com/calcom/cal.diy/blob/main/Dockerfile), [`scripts/start.sh`](https://github.com/calcom/cal.diy/blob/main/scripts/start.sh), [`.env.example`](https://github.com/calcom/cal.diy/blob/main/.env.example), [README](https://github.com/calcom/cal.diy#readme), [LICENSE](https://github.com/calcom/cal.diy/blob/main/LICENSE)
- Docs: https://www.cal.diy/installation · https://docs.cal.com/self-hosting/installation
- Docker Hub API: https://hub.docker.com/v2/repositories/calcom/cal.diy/ · https://hub.docker.com/r/calcom/cal.com/tags/
- Archived upstream docker repo (reference only): https://github.com/calcom/docker
- Third-party measurements (labelled as such): selfhosting.sh/apps/cal-com, use-apify.com self-host guide, servorbit.com VPS guide

---

## 1) Docker compose services

Cal.diy ships its **own** `docker-compose.yml` at the repo root ([source](https://github.com/calcom/cal.diy/blob/main/docker-compose.yml)) with exactly five services:

| Service | Image | Purpose | Needed? |
|---|---|---|---|
| `database` | `postgres` | Cal.diy's Postgres | **Yes** |
| `calcom` | `calcom.docker.scarf.sh/calcom/cal.diy` (build: local `Dockerfile`) | Next.js web app, port 3000 | **Yes** |
| `redis` | `redis:latest` | Used by the API v2 service | No — only if running `calcom-api` |
| `calcom-api` | build `apps/api/v2/Dockerfile` | REST API v2 | No — optional; add only if the Kan integration wants REST |
| `studio` | same cal.diy image, `npx prisma studio` :5555 | DB GUI; compose file itself marks it "Optional … comment out … in production" | On-demand only |

- **`.cal.com` avatar service: does not exist** in cal.diy's compose. Avatar prefill is just two env vars (`AVATARAPI_USERNAME`/`AVATARAPI_PASSWORD`, [.env.example L179–181](https://github.com/calcom/cal.diy/blob/main/.env.example)). Avatars are stored in the DB/filesystem.
- **App store: not a service.** `scripts/start.sh` runs `npx ts-node scripts/seed-app-store.ts` inside the web container on every boot — app-store apps are seeded into Postgres automatically ([start.sh](https://github.com/calcom/cal.diy/blob/main/scripts/start.sh)). The [installation docs](https://www.cal.diy/installation) recommend the admin UI/wizard over the seeder for enabling apps.
- **Prisma Studio**: optional service as above; for a laptop, run it on-demand (`docker compose run` / a compose `profiles:` block), not `restart: always`.
- **Migrations** also run automatically in the web container: `start.sh` = wait-for-db → `npx prisma migrate deploy` → seed-app-store → `yarn start`. No separate migration step or service needed.

**Minimum viable stack: 2 services** (`database` + `calcom`). The old [calcom/docker](https://github.com/calcom/docker) repo is **archived** ("Docker resources … moved into the main monorepo") — don't base anything on it; cal.diy's in-repo files are authoritative.

## 2) Mandatory env vars

From [.env.example](https://github.com/calcom/cal.diy/blob/main/.env.example), the [README Docker section](https://github.com/calcom/cal.diy#docker), and the [Dockerfile ARGs](https://github.com/calcom/cal.diy/blob/main/Dockerfile):

**Required:**

| Var | Value for us | Notes |
|---|---|---|
| `NEXT_PUBLIC_WEBAPP_URL` | `http://192.168.1.125:<port>` | Build-arg **and** runtime var; `start.sh` find/replaces the baked-in value at container start, so it's runtime-changeable |
| `NEXTAUTH_URL` | same as above | NextAuth; defaults to `{WEBAPP_URL}/api/auth` per [docker .env.example](https://github.com/calcom/docker/blob/main/.env.example) — set explicitly for LAN IP access |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | README: "highly recommended … very unique" |
| `CALENDSO_ENCRYPTION_KEY` | `openssl rand -base64 24` | Encrypts stored calendar credentials; **never rotate after first run** or stored integrations are corrupted (third-party corabo/servorbit runbooks warn the same) |
| `DATABASE_URL` / `DATABASE_DIRECT_URL` | `postgresql://…@cal-diy-db:5432/calendso` | `DATABASE_DIRECT_URL` = same as `DATABASE_URL` when no pooler (per .env.example) |
| `CALCOM_TELEMETRY_DISABLED=1` | `1` | .env.example: "Set this to '1' if you don't want Cal to collect anonymous usage" |
| `POSTGRES_USER/PASSWORD/DB` + `DATABASE_HOST` | e.g. `cal-diy-db:5432` | Used by compose |
| `ALLOWED_HOSTNAMES` | add `"192.168.1.125:<port>"` | Default is only `"cal.local:3000","localhost:3000"` — **without the LAN entry, LAN requests fail** |
| `NODE_ENV=production` | | compose sets it |

**License key: NOT needed.** Cal.diy is the MIT-licensed community fork with EE code stripped out — its `.env.example` states verbatim: *"Cal.diy is fully open source — no license key is required."* The `CALCOM_LICENSE_KEY` var only appears in the optional `calcom-api` service block (upstream remnant); leave empty. `NEXT_PUBLIC_LICENSE_CONSENT` (an AGPL-era consent flag from the archived docker repo) can stay empty under MIT.

**Optional but relevant:** `EMAIL_*` SMTP vars (booking confirmations — point at studio SMTP or a local catcher), `AVATARAPI_USERNAME/PASSWORD` (signup avatar prefill), `CSP_POLICY`, `NEXT_PUBLIC_API_V2_URL` (only with the api service). All app-store integration keys live in `.env.appStore` ([example](https://github.com/calcom/cal.diy/blob/main/.env.appStore.example)) and are optional.

## 3) ARM64 / Apple Silicon

- **Upstream cal.com publishes ARM images**: 74 `*-arm` tags on Docker Hub; `v6.2.0-arm` verified `linux/arm64` via the Hub API ([tags](https://hub.docker.com/r/calcom/cal.com/tags/)). But that's the EE codebase — needs a license key for team features; not our target.
- **Cal.diy has NO published images.** Docker Hub API for `calcom/cal.diy`: `pull_count: 0`, zero tags, repo created 2026-04-14, status "initialized"; registry manifest for `:latest` returns 404. The README's claim that images (incl. `{version}-arm` tags like `v5.6.19-arm`) exist on Docker Hub is **stale — none are actually pushed**.
- Therefore on Apple Silicon: **build from source** with the in-repo `Dockerfile`. It uses plain `node:20` base images (multi-arch), so it builds natively on arm64 — no emulation. Build args exist for everything; `MAX_OLD_SPACE_SIZE` defaults to **6144 MB** Node heap — on our ~8 GB Docker VM that's the pinch point; pass `MAX_OLD_SPACE_SIZE=3072`.
- **Build cost (estimate, honest):** full monorepo — turbo prune → `yarn install` (the Dockerfile sets a 20-minute HTTP timeout, a hint about how big it is) → Next.js production build of the web app. Realistically 20–45 min on an M-series Mac, ~4–6 GB peak RAM, and a large download (~2–3 GB node modules) — fragile on unstable internet; expect at least one retry. Mitigation: build once, `docker tag caldiy:local`, never rebuild unless upgrading. The [cal.diy docs](https://www.cal.diy/installation) agree: "The most intensive part … is when you actually build the software, but once it's running it's relatively lightweight."

## 4) RAM/CPU footprint alongside Kan + Postgres

- Official cal.diy docs: minimal hardware at runtime; build is the heavy part ([cal.diy/installation](https://www.cal.diy/installation)). No official GB numbers published.
- Third-party measurements of the equivalent cal.com stack (same codebase family): app idle ~300–900 MB, ~1.4 GB peak under load; whole stack (app+postgres+redis) comfortable at 2 GB (selfhosting.sh, use-apify guides).
- **Measured on THIS laptop today** (`docker stats`): 16 GB host, Docker VM capped at ~7.8 GB, 6 containers already running using ~1.7 GB (hindsight 1.1 GB, open-notebook ~0.4 GB, ideon ~0.2 GB).
- Budget: Cal.diy web ~0.8–1.2 GB + its Postgres ~0.2 GB ≈ **1.5 GB steady**, plus Kan's stack (TBD — Kan not up yet; assume similar ~1–1.5 GB for a Next+Postgres app). Total ≈ 4.5 GB of the 7.8 GB VM → fits, with the **image build** (not runtime) as the only tight window: build with `MAX_OLD_SPACE_SIZE=3072` while nothing heavy runs, or temporarily raise OrbStack's memory limit.
- **Port conflict found (verified live):** `ideon-app` already publishes `0.0.0.0:3000->3000`, and `freellmapi` holds 127.0.0.1:3001. Cal.diy's compose defaults to `3000:3000` — must remap (using **3050** below). Kan on 3456 is clear. Cal's Redis defaults to publishing 6379 (currently free, but bind it to localhost or drop it — we're not running the api service anyway).

## 5) Licensing: pairing with AGPLv3 Kan

- **Cal.diy is MIT, not AGPL.** Verified directly: [cal.diy LICENSE](https://github.com/calcom/cal.diy/blob/main/LICENSE) = "MIT License, Copyright (c) 2020-present Cal.com, Inc." Upstream [cal.com LICENSE](https://github.com/calcom/cal.com/blob/main/LICENSE) is MIT today too. (Many third-party guides still say "AGPLv3" — stale; the LICENSE file is authoritative.) Kan's local `LICENSE` is **AGPLv3** (verified in this repo).
- **Pairing implication: none material.** Two separate programs in separate containers/processes communicating at arm's length over HTTP — no combined/derivative work. Even if they later share code, MIT code can live inside an AGPL project (one-way compatibility).
- **AGPLv3 side (Kan only):** §13's source-offer duty triggers on *network interaction by users* with a modified version. All users here are the studio's own teammates on a LAN (internal use), and the Kan fork is public anyway (divergent fork per ADR-0002 decision) — obligation satisfied either way. Internal LAN deployment ≠ conveyance/distribution.
- **Attribution/trademark:** MIT requires only retaining the copyright notice + license text when distributing copies — keep the `LICENSE` file and Cal.com copyright line intact in the fork; internal use doesn't even require more. The "Cal.com"/"Cal.diy" **names and logos are trademarks of Cal.com, Inc. and are not licensed by MIT** — the settled OTSICAL plan (brand-string rename, technical identifiers untouched) sidesteps this cleanly. Don't market the studio service as "Cal.com". No trademark policy page is published for cal.diy; the README's Acknowledgements section is courtesy, not obligation.

## 6) Initial admin bootstrap

Documented in the [README "Setting up your first user"](https://github.com/calcom/cal.diy#setting-up-your-first-user) — two official approaches:

1. **Prisma Studio insert (the docker-native path):** the compose `studio` service (same image, port 5555) → `User` model → new record with `email`, `username`, bcrypt-hashed `password`, `metadata` = `{}`. Note: new users default to `TRIAL` plan; flip role to `ADMIN` in the same row.
2. **Seed script:** `cd packages/prisma && yarn db-seed` — populates known test users incl. `admin@example.com` / `ADMINadmin2022!` (full table in README "Quick start with yarn dx"). **Dev-only credentials — change immediately or skip on a LAN-exposed instance.**
3. Third-party cal.com runbooks (selfhosting.sh, use-apify) report the simplest path works on current builds: open the site, "Create Account" — the **first registered user becomes admin**; then close open signup via Settings → Admin → Feature flags (`disable-signup`). Try this first on boot; fall back to approach 1 (studio) if signup is locked by default.

After first start (migrations + app-store seed run automatically via `start.sh`): log in, complete onboarding, create event types. Cron-dependent features (reminder emails etc.) need cron hits on `/apps/web/app/api/cron/*` ([cal.diy docs, Cron Jobs](https://www.cal.diy/installation)) — on a laptop, a host-level cron curl or skipping reminders is fine for v1.

---

## Verdict: **GO** (conditional)

Co-hosting Cal.diy next to Kan on the 16 GB laptop fits: ~1.5 GB steady for Cal.diy + its Postgres, inside a 7.8 GB VM that's under half used. Three conditions:

1. **Remap the host port** — 3000 is taken by `ideon-app` (verified live). Use 3050.
2. **Build the image once, locally** — no prebuilt cal.diy images exist (Hub has zero tags); build with `MAX_OLD_SPACE_SIZE=3072` during a quiet window; unstable internet ⇒ budget retries.
3. **Keep the stack minimal** — no `redis`, no `calcom-api`, no always-on `studio` until a ticket demands them.

### `docker-compose.cal.yml` — minimal service list

```yaml
services:
  cal-diy-db:            # postgres:16-alpine, volume cal-db-data, NO host port
  cal-diy:               # image: caldiy:local (built once from cal.diy Dockerfile)
                         # ports: "3050:3000", env_file: .env.cal, depends_on: cal-diy-db
  # optional, on-demand only (profiles: ["debug"]): cal-studio — same image,
  #   command: npx prisma studio, port 5555 — create first admin, then shut down
```

Env file `.env.cal` (mandatory set): `NEXT_PUBLIC_WEBAPP_URL=http://192.168.1.125:3050`, `NEXTAUTH_URL` (same), `NEXTAUTH_SECRET`, `CALENDSO_ENCRYPTION_KEY`, `CALCOM_TELEMETRY_DISABLED=1`, `DATABASE_URL`/`DATABASE_DIRECT_URL` (→ `cal-diy-db:5432/calendso`), `POSTGRES_*`, `ALLOWED_HOSTNAMES` incl. `"192.168.1.125:3050"`, `NODE_ENV=production`.

Not included, and why: `redis` + `calcom-api` (REST v2 — only if ticket 006 picks REST over webhooks), always-on `studio` (security + RAM), any avatar service (doesn't exist), any migration service (`start.sh` migrates on boot).
