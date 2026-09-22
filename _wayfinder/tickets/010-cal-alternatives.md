---
type: wayfinder-ticket
status: closed
labels: [wayfinder:research]
blocked_by: []
---

# Cal.diy alternatives verdict

## Question
Which self-hosted scheduler should OTSICAL use for internal crew/room/resource booking with booking events bridged to Kan? Compare Cal.diy against Easy!Appointments, LibreBooking, MRBS, Rallly, Radicale/Baikal, Cal.com CE on: maintained prebuilt ARM64 image, resource booking, webhook/API for booking create/reschedule/cancel, local auth, footprint, license.

## Context
Verified baselines: docs/research/cal-diy-selfhost.md, cal-diy-integration.md. Third research attempt (deleg_fa700cf4) running. Only primary sources; unknowns marked, never invented.

## Required outcome
Cited docs/research/cal-alternatives.md replacing the placeholder, with a keep-or-switch verdict; close this ticket with the summary.


## Resolution
Verified comparison at `docs/research/cal-alternatives.md` (registry-arch checks re-verified live: cal.com `-arm` tags arm64-only as documented; Easy!Appointments and LibreBooking current tags multi-arch arm64; official MRBS GHCR image single-arch amd64; cal.diy Hub repo still 0 tags).
**Verdict: keep Cal.diy.** Push webhooks are the deciding criterion for the Kan bridge (ticket 002 architecture A) — every alternative forces polling or has no API. Cal.diy's ARM64 miss is a one-time 20–45 min source build. Documented fallback: Cal.com CE upstream `v6.2.0-arm` image (arm64, zero build, same webhooks) if the build cost becomes unacceptable. Revisit trigger: room-inventory conflict checking becomes a hard requirement → LibreBooking.
