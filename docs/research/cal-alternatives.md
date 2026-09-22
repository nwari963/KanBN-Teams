# Self-hosted Cal.diy alternatives — verified comparison

Replaces the 2026-09-21 unverified drafts (16:25 placeholder + interim stub). All facts below re-checked 2026-09-21 via Docker Hub Registry API, GHCR Registry API, GitHub API (repo trees + latest releases), and project READMEs/docs. Unknowns are marked, never guessed.

Criteria (from OTSICAL context): **(1)** maintained prebuilt ARM64 image, **(2)** internal crew/room/resource booking, **(3)** webhook or API for booking create/reschedule/cancel (to bridge into Kan REST), **(4)** local auth (no internet OIDC), **(5)** ≤1 GB RAM, **(6)** license/maintenance.

## Comparison

| Candidate | ARM64 prebuilt (registry-verified) | Resource-booking fit | Booking webhook / API | Local auth | License | Maintenance (latest release) |
|---|---|---|---|---|---|---|
| **cal.diy** (incumbent) | ❌ none — Hub repo `calcom/cal.diy` has 0 tags (ticket [001](cal-diy-selfhost.md)); 20–45 min source build | ◑ people/time event types; rooms modeled as locations/users, no inventory conflict-check | ✅ webhooks `BOOKING_CREATED/RESCHEDULED/CANCELLED/…` + REST v2 (ticket [002](cal-diy-integration.md)) | ✅ credentials, first-user admin, signup lockout | MIT | v6.2.0 2026-03-01, active |
| **Cal.com CE** (upstream image) | ✅ `calcom/cal.com:v6.2.0-arm` = `linux/arm64` (Hub API, pushed 2026-03-02; 49 `-arm` tags) | ◑ same as cal.diy | ✅ same webhook/API surface | ✅ same | MIT + EE code gated by license key | v6.2.0 2026-03-01, active |
| **Easy!Appointments** | ✅ `alextselegidis/easyappointments:1.6.0`/`latest` incl. `linux/arm64` (Hub API, pushed 2026-05-27) | ◑ service×provider slots; no room/resource inventory | ◑ REST v1 CRUD (`application/controllers/api/v1/Appointments.php` in repo tree) but **no webhooks** (repo tree: zero webhook files) | ✅ local DB users (PHP/CodeIgniter) | GPLv3 | 1.6.0 2026-05-27, active |
| **LibreBooking** | ✅ `librebooking/librebooking:5.3.0` + `develop` incl. `linux/arm64` (Hub API, 2026-08-03 / 2026-09-21) | ✅✅ core purpose: multi-resource booking, waitlists, quotas, RBAC | ◑ full REST CRUD (`/Web/Services/index.php/Reservations/` POST/Update/Delete, session-token auth per [API.rst](https://librebooking.readthedocs.io/en/latest/API.html)) but **no webhooks** (repo tree: none) | ✅ native + LDAP/AD/SAML options | GPL-3.0 | v5.3.0 2026-08-03, active |
| **MRBS** | ❌ official GHCR `meeting-room-booking-system/mrbs:1.12.2` manifest is **amd64-only** (config blob: `linux/amd64`); community `dorianim/mrbs` has arm64 but last pushed 2025-02-07 | ✅✅ rooms/resources, conflict checking | ❌ no HTTP API, no webhooks (repo tree: only a vendored Slack Monolog handler; `README.sqlapi` is a DB abstraction doc, not an API) | ✅ default `db` auth ([docs](https://mrbs.sourceforge.io/)) | GPL | v1.12.2 2026-05-26, active |
| **Rallly** | ✅ `lukevella/rallly:4.15.2`/`latest` incl. `linux/arm64` (Hub API, 2026-09-21) | ❌ date/time **polls** (vote on options), not a booking system | ❌ none documented | ◑ NextAuth (OAuth/email) — self-host docs page unreachable during research, unverified | AGPLv3 | v4.15.2 2026-09-21, very active |
| **Radicale** | ✅ `kozea/radicale:latest` incl. `linux/arm64` (Hub API, 2026-09-22; [docs](https://radicale.org/v3.html) list amd64+arm64) | ❌ CalDAV server only — no booking UI at all | ❌ no webhooks/API push; consume via CalDAV polling | ✅ basic auth (htpasswd) | GPLv3 | v3.8.0 2026-09-03, active |
| **Baïkal** | ◑ no official image (sabre-io repo ships no Dockerfile); community `ckulka/baikal:latest` incl. `linux/arm64` (Hub API, 2026-09-20) | ❌ CalDAV/CardDAV server only | ❌ same as Radicale | ✅ local admin + basic auth (unverified detail) | GPLv3 | 0.12.1 2026-08-05, active |

**RAM (criterion 5):** no candidate publishes official numbers except the cal family's "lightweight at runtime" statement ([cal.diy installation docs](https://www.cal.diy/installation)). Labelled third-party measurements for the cal.com stack: app ~300–900 MB idle, ~1.4 GB peak (selfhosting.sh / use-apify, cited in ticket [001](cal-diy-selfhost.md)). PHP candidates (EA, LibreBooking, MRBS) are typically far smaller but **undocumented — unverified, not claimed**. Radicale/Baïkal: undocumented.

## Corrections vs. the drafts this file replaces

- Easy!Appointments **does** have a maintainer ARM64 image (`1.6.0`/`latest`, Hub-verified) — earlier draft said amd64-only.
- MRBS **has** an official image now, but it is **amd64-only** — earlier drafts didn't check it.
- Earlier draft cited `ghcr.io/cal/cal:latest` — wrong path (real image: Docker Hub `calcom/cal.com`, arm64 only on `-arm` tags) and a "Dex static password" Cal setup with a `docker pull` verification that ticket 001's live checks contradict (cal.diy Hub repo has zero tags). All of it superseded.
- Earlier draft said Rallly "no ARM64" — it has arm64; its real disqualifier is that it's a poll tool, not a booker.

## Verdict: **keep Cal.diy**

1. **Integration is the deciding criterion.** The Kan bridge (ticket 002, architecture A) is built on booking-event webhooks (`BOOKING_CREATED/RESCHEDULED/CANCELLED`, HMAC-signed, LAN receiver allowed). Cal.diy/Cal.com is the **only** candidate with push webhooks. Every alternative forces polling (EA, LibreBooking REST) or has no API at all (MRBS, Radicale, Baïkal, Rallly) — i.e. ticket 002's higher-effort/higher-fragility options C/D.
2. **Resource-booking fit is the one place Cal.diy is weaker** (LibreBooking/MRBS are true resource schedulers). Not enough to outweigh (1): the studio's need is crew/session booking bridged to Kan cards, which event types cover; revisit only if room-inventory conflict checking becomes a hard requirement.
3. **The ARM64 "hard pref" is Cal.diy's only miss, and it's a one-time 20–45 min build** (ticket 001), not an ongoing cost. If that ever becomes unbearable, the switch target is **Cal.com CE's upstream `-arm` image** (`calcom/cal.com:v6.2.0-arm`, arm64-verified, zero build) — same code family, same webhooks, at the cost of EE-gated features/license-key machinery and upstream telemetry.
4. Auth (local, offline) and MIT license (clean pairing with AGPLv3 Kan, per ticket 001 §5) hold for the cal family; GPL candidates are fine legally too but add nothing.

No switch. Fallback documented in (3).
