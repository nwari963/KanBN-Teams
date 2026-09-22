# ADR-0002: OTSICAL — fork diverges from kanbn/kan

- **Status:** Accepted
- **Date:** 2026-09-21
- **Supersedes:** ADR-0001 (configure-don-build posture)

## Context

The fork is repositioned as **OTSICAL**, a creative-studio-tailored PM stack (project management via Kan + scheduling via Cal.diy), self-hosted LAN-first on the studio laptop. ADR-0001's "configure, don't build" posture assumed pure upstream usage; studio tailoring and Cal.diy integration now require code changes.

## Decision

The fork **diverges** from `kanbn/kan`. Rules to keep divergence cheap:

1. Brand-only renames in user-facing strings; technical identifiers (ghcr image names, `@kan/*` package scopes, db names) stay upstream-identical.
2. New services (Cal.diy, wrapper) land as **new files** (`docker-compose.cal.yml`, `desktop-wrapper/`) — upstream's `docker-compose.yml` is never edited.
3. Tailoring happens as small localized diffs; anything structural goes through `/to-spec` first.
4. Upstream merges remain opportunistic, not blocking.

## Consequences

- Upstream features keep arriving via `git fetch upstream && git merge upstream/main` with shrinking cleanliness over time.
- AGPLv3 obligations apply to any distribution of modified Kan (internal LAN use does not trigger them).
- Wayfinder map at `_wayfinder/map.md` governs scoping until handoff to `/to-spec`.
