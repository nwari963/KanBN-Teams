---
type: wayfinder-ticket
status: in-progress
owner: nwari
labels: [wayfinder:task]
blocked_by: []
---

# Deliver the Project Wiki MVP

## Goal

Hand the OTSICAL team a working Kan-to-Outline Project Wiki flow. A teammate can create a project board from each supported studio template, open and edit its Project Wiki, and return to the same board through the wiki backlink.

**Target:** the configured OTSICAL studio stack and its intended teammate account. No delivery date is set yet.

## Current status

- [x] Project Wiki integration implemented in `1db7c637` (`feat: add Outline project wiki MVP integration`).
- [x] Stable template identity, migration report, and identity propagation implemented and pushed in `f01d590a` (`feat: persist studio template identity for project wikis`).
- [x] Classifier tests, shared/DB typechecks, Drizzle check, formatting, and diff checks passed. API typecheck passed with `--jsx react-jsx`; the standard API typecheck and lint still have previously recorded workspace issues.
- [x] Database migration applied to the studio database; classification report reviewed (Art/Software/Production classified, legacy `pROJECT` skipped as `unsupported-name`).
- [ ] Runtime Kan/Outline flow and teammate access not yet verified for this release.

## Build and release plan

### 1. Prepare the target environment

- [x] Confirm the local Kan target (`kan_db`) and service state; Kan responds on `:3456` and Outline responds on `:3458` after being recreated from the current compose file.
- [x] Create owner-only local backups of the Kan and Outline databases before migration or Outline startup.
- [x] Confirm Kan has valid `OUTLINE_URL`, `OUTLINE_API_KEY`, and `OUTLINE_COLLECTION_ID` values. Verify presence and access without recording secrets in this ticket.
- [ ] Confirm the intended teammate can sign in to both Kan and Outline.

**Exit check:** Kan can reach the configured Outline instance and the target database is recoverable.

### 2. Apply and review template identity migration

- [x] Apply `packages/db/migrations/20260923145321_AddBoardTemplateIdentity.sql` to a development/test clone first.
- [x] Review `board_template_identity_migration_report`: the clone found one active template, skipped as `unsupported-name`, and classified none of the supported identities.
- [x] Stop before migrating the studio database because the canonical Art, Software, and Production templates are not present in the current Kan database.
- [x] Apply the migration to the studio database and review its report using the same checks (2026-09-25 — see progress log; 3 classified, 1 skipped).

**Exit check:** the studio database has one intended canonical template for each supported identity, and all rejected/skipped records are understood.

## Progress log

### 2026-09-25 — Section 4 failure recovery and provenance passed (isolated env)

Ran all three checks in a **fully isolated** environment so the live studio DB, live templates, and the real Outline instance were never touched:

- Cloned the Kan DB to a disposable `kan_s4_test` (pg_dump/restore) and ran a second `kan-web` container (`kan-s4-web`, port 3466) on the Kan compose network against that clone, with a real admin session.
- Stood up a **fake Outline** (minimal Node server, port 3499) implementing `documents.list/create/info/update` with faithful response shapes (relative `url`, title, `publish` semantics) plus a `/_state` endpoint to count documents and create calls. This let "Outline down/up" be toggled deterministically without touching the live Outline.
- Retry path: `board.ensureProjectWiki` mutation (re-runs `attachProjectWiki` for a regular board carrying a `templateIdentity`).

Results:
- **Outline down during create:** `board.create` returned 200, the board persisted with `templateIdentity=art`, wiki reported `{status:"failed", message:"fetch failed"}`, and no Project Wiki card was created.
- **Restore + retry (idempotency):** after bringing Outline up, three `ensureProjectWiki` calls each returned `{status:"created"}` with a stable URL; the fake Outline held exactly **1** document (found by title on `documents.list`, so `documents.create` was never called again) and the board had exactly **1** Project Wiki card.
- **Provenance independence:** derived a `software` board while Outline was down (wiki pending, identity copied from source), then **renamed** the source template to `Zzz Unknown Source` and **soft-deleted** it. With Outline back up, `ensureProjectWiki` on the derived board still returned `{status:"created"}`, created the doc, and added the card — proving eligibility comes from the board's **copied identity**, not the source's name or existence.
- **Guard check:** calling `ensureProjectWiki` on the Art **template** board itself returned 404 / created no card — templates are not eligible, only derived project boards.

Teardown verified: fake Outline stopped, `kan-s4-web` removed, `kan_s4_test` dropped, live `kan_db` untouched (all E2E/test boards soft-deleted; the 4 canonical templates intact; Kan :3456 and Outline :3458 healthy).

### 2026-09-25 — Section 3 E2E passed; two implementation bugs fixed

The end-to-end run initially failed and exposed two real defects, both now fixed and re-verified:

1. **Stale image (environment, not code).** The first attempt returned 200 but produced boards with `templateIdentity = NULL` and no wiki at all: the running `ghcr.io/kanbn/kan:latest` was built 2026-09-22 and contained none of the Project Wiki code (`attachProjectWiki` absent). Same 3-day-stale-image trap already seen with the `migrate` stage. Rebuilt `web` from the repo and recreated the container.
2. **Relative wiki URL → 500 (code).** After the rebuild, `board.create` returned 500 `Output validation failed: wiki.url "Invalid url"`. Outline's `documents.create` returns document URLs as **relative** paths (`/doc/<id>`), but `boardCreateResponseSchema` requires `z.string().url()`. Fixed by absolutizing in `packages/api/src/utils/outline.ts` via a new `toAbsoluteDocumentUrl` helper.
3. **Untitled unpublished drafts (code).** The Outline DB inspection showed the "created" docs had **empty titles** and `publishedAt = NULL` — `documents.create` was sent `name` (Outline uses `title`) and no `publish: true`, so Outline created *drafts* named `untitled-…` that never appeared in `documents.list`. Fixed by sending `title` + `publish: true`; the idempotency lookup was also corrected to match on `document.title` (not `name`).
4. **Client-reachable wiki links.** Wiki URLs are absolutized against a new `OUTLINE_PUBLIC_URL` (falls back to `OUTLINE_URL`). In the studio this is the mDNS name `http://MacBook-Pro-de-Angelo.local:3458`; using the container-local `host.docker.internal` would have produced links teammates cannot open.

Environment/config changes made: `OUTLINE_PUBLIC_URL` added to `apps/web/src/env.ts`, `turbo.json` (globalEnv), `docker-compose.yml` + `cloud/docker-compose.yml` env passthrough, `.env.example`, and the `README.md` env table; local ignored `.env` sets `OUTLINE_PUBLIC_URL=http://MacBook-Pro-de-Angelo.local:3458`.

Verification after the fix (rebuilt + recreated `web`), one board per identity:
- `board.create` returns 200 with `wiki.status = "created"` and an absolute mDNS URL for all three (art / software / production).
- DB confirms each derived board carries `templateIdentity` = `art` / `software` / `production` (lowercase) and `sourceBoardId` set.
- Each first list contains a `Project Wiki` card whose description links to the Outline doc.
- All three docs are now **published** in the Project Wiki collection, contain Overview/Decisions/Notes/References, and each backlinks to its Kan board (`http://MacBook-Pro-de-Angelo.local:3456/drsbwigeybcj/<slug>`).
- `documents.update` of the Notes section persisted across a re-read (`documents.info`); the edit was then reverted to leave the doc pristine.

Unit tests: `packages/api/src/utils/outline.test.ts` extended to cover the title/publish fields, relative-URL absolutization (server vs public URL), and title-based idempotency — 5/5 pass. Outline typecheck clean (remaining `@kan/api` and `@kan/web` type errors are pre-existing and unrelated: `@kan/email` `--jsx`, missing `~/assets/logos/*.svg`, bootstrap.cjs).

Note for the record: the very first web-image rebuild failed at `@kan/api#build` because editing `turbo.json` (globalEnv) invalidated turbo's cache, exposing a latent build-ordering issue where `@kan/api` `tsc` resolved `@kan/email` through the `exports` fallback to `src/index.tsx` before `@kan/email`'s `dist` was built (TS6142, `--jsx` not set). Building `@kan/email` first (producing `dist`) makes `@kan/api build` pass; the second build produced 9/9 successful tasks.

Section 3 exit check: **all three supported workflows pass** (run as the admin account, the only Kan user; teammate sign-in confirmation remains a separate operator step).

### 2026-09-25 — Canonical templates created; identity migration applied

- Created the three canonical templates through Kan's own tRPC `board.create` (the same code path the app UI uses; no direct SQL), authenticated as the admin via the app's email/password flow:
  - `Art` (`t9me4j7rzlg9`): Sketch · Blockout · Render · Review · Done
  - `Software` (`gqvmyuoep8ny`): Backlog · Doing · Review · Done
  - `Production` (`1qknivt817j1`): Planned · Booked · Captured · Editing · Delivered
- Rotated the Kan admin password for `kunwari.kunwari@gmail.com` (approved): generated a Better Auth 1.4.6-compatible hash using the app's own `hashPassword` (scrypt N=16384 r=16 p=1 dkLen=64, `salt:key` hex) and updated the `account` row; sign-in verified. New value recorded only in ignored local `.env` as `KAN_ADMIN_PASSWORD`.
- Fresh owner-only backup `kan_db_pre_migration_20260924_200221.dump` in `~/otsical-backups/` (0600).
- Applied `20260923145321_AddBoardTemplateIdentity.sql` to the studio DB via the compose `migrate` stage. First attempt falsely reported success: the `kanbn/kan-migrate:latest` image was 3 days old and its baked-in journal predated the migration file (36 entries vs the DB's 36 applied → nothing pending). Rebuilt the `migrate` stage and re-ran; this time it applied and recorded tracking row 37 (previous rows 36 remained).
- Report reviewed: `Art`→classified/art, `Software`→classified/software, `Production`→classified/production, legacy `pROJECT`→skipped/unsupported-name. Board `templateIdentity` values backfilled accordingly. Kan serves 200 after the schema change.

### 2026-09-25 — Outline side configured, Kan env wired

- Outline: rotated the Dex static-password hash for `nwari@otsical.local` to bcrypt **cost 10** (Dex rejects hashes below cost 10 with `given hash cost = 5 does not meet minimum cost requirement = 10`). The new password value is stored only in ignored `0600`.env.outline` as `DEX_USER_PASSWORD`; the old static password is no longer valid.
- Outline: created collection **Project Wiki** (id `76c644ed-dd29-46e0-b2fc-fc6ff47b6eef`, url `/collection/project-wiki-rlyO7xgnUw`) and minted API key **kan-sync** for Kan. Key value exists only in the local environment, not in this ticket.
- Kan: added `OUTLINE_URL=http://host.docker.internal:3458` (Kan's web container cannot resolve mDNS or the Outline service name — the two stacks are on separate compose networks — but `host.docker.internal:3458` reaches Outline), `OUTLINE_API_KEY`, and `OUTLINE_COLLECTION_ID` to the local `.env` (ignored) and recreated `web`. Verified from inside the container with its own env: `POST /api/documents.list` against the configured collection returns 200 (currently 0 documents).
- Still missing for migration + E2E: the three canonical Kan templates (operator step below) and teammate sign-in confirmation.

### 2026-09-23 — Environment preflight

- Kan and its local Postgres database are running. A local backup was created and restored to `kan_db_template_identity_test`; the new migration applied successfully to that clone.
- The test report classified no supported identities. The current database has one unrelated active template, so the migration was not applied to the studio database.
- The disposable test clone was removed after report review; the owner-only local backup remains available for the next migration attempt.
- The Outline container had an obsolete broken bind mount. It was recreated from `docker-compose.outline.yml` after backing up its database; `http://localhost:3458` now returns HTTP 200.
- The running Kan container is missing `OUTLINE_URL`, `OUTLINE_API_KEY`, and `OUTLINE_COLLECTION_ID`. The Outline application also still needs its collection and API key configured for Kan.
- No teammate sign-in or Project Wiki end-to-end test has been completed.

## Human handoff — next actions

The implementation is ready for environment setup; release verification is waiting on these operator steps:

1. **Done (2026-09-25):** created the three canonical templates through Kan's own `board.create` API (same code path as the UI):
   - `Art`: Sketch → Blockout → Render → Review → Done
   - `Software`: Backlog → Doing → Review → Done
   - `Production`: Planned → Booked → Captured → Editing → Delivered
2. **Done (2026-09-25):** Outline collection `Project Wiki` + API key `kan-sync` exist; Kan env (`OUTLINE_URL` via `host.docker.internal`, `OUTLINE_API_KEY`, `OUTLINE_COLLECTION_ID`) is set in the local `.env` and Kan `web` was recreated; verified `documents.list` returns 200 from inside the Kan container.
3. Confirm the intended teammate can sign in to both Kan and Outline.

Resume here when the templates exist and Kan has the three integration settings. First take a fresh Kan database backup, apply the migration, and inspect its report; continue to end-to-end verification only if each supported identity is classified as expected. The disposable-clone check passed, but the clone predates the canonical templates. Avoid direct SQL seeding of live templates.

### 3. Verify the end-to-end Project Wiki flow

Run the flow from Kan as the intended teammate, once for each supported template identity:

- [x] Create a project board from the canonical Art template.
- [x] Create a project board from the canonical Software template.
- [x] Create a project board from the canonical Production template.
- [x] Confirm each derived board receives its template identity and a Project Wiki card in its first list.
- [x] Confirm each card opens the matching Outline document in the configured collection.
- [x] Confirm the document contains Overview, Decisions, Notes, and References sections plus a backlink to the same Kan board.
- [x] Edit a section in Outline and confirm the edit persists after reload.

**Exit check:** all three supported workflows pass for a real teammate account.

### 4. Verify failure recovery and provenance

- [x] In a safe test environment, make Outline unavailable during board creation; confirm the Kan board still exists and wiki creation reports failure.
- [x] Restore Outline and retry; confirm one document and one Project Wiki card exist after retrying again.
- [x] In a safe test environment, rename and then soft-delete the source template; confirm the already-derived project remains eligible for wiki retry from its copied identity.

**Exit check:** retries are idempotent, board creation survives Outline failure, and derived-board eligibility does not depend on the source template's current name or existence.

### 5. Handoff

- [ ] Record the migration date, reviewed report outcome, and runtime acceptance results here without adding credentials.
- [ ] Give the intended teammate the Kan board entry point and verify they can open and edit the Project Wiki.
- [ ] Set status to `closed` only after all release checks pass.

## Release boundary

Included: supported-template project boards, linked Outline project documents, the four shared sections, Kan backlink, and retry after partial failure.

Deferred: arbitrary workspace documents, card-level documents, automatic wiki renaming when a project board is renamed, and the admin identity-correction UI.
