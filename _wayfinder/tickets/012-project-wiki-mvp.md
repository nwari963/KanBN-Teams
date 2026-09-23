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
- [ ] Database migration not yet applied; its classification report has not been reviewed.
- [ ] Runtime Kan/Outline flow and teammate access not yet verified for this release.

## Build and release plan

### 1. Prepare the target environment

- [x] Confirm the local Kan target (`kan_db`) and service state; Kan responds on `:3456` and Outline responds on `:3458` after being recreated from the current compose file.
- [x] Create owner-only local backups of the Kan and Outline databases before migration or Outline startup.
- [ ] Confirm Kan has valid `OUTLINE_URL`, `OUTLINE_API_KEY`, and `OUTLINE_COLLECTION_ID` values. Verify presence and access without recording secrets in this ticket.
- [ ] Confirm the intended teammate can sign in to both Kan and Outline.

**Exit check:** Kan can reach the configured Outline instance and the target database is recoverable.

### 2. Apply and review template identity migration

- [x] Apply `packages/db/migrations/20260923145321_AddBoardTemplateIdentity.sql` to a development/test clone first.
- [x] Review `board_template_identity_migration_report`: the clone found one active template, skipped as `unsupported-name`, and classified none of the supported identities.
- [x] Stop before migrating the studio database because the canonical Art, Software, and Production templates are not present in the current Kan database.
- [ ] Apply the migration to the studio database and review its report using the same checks.

**Exit check:** the studio database has one intended canonical template for each supported identity, and all rejected/skipped records are understood.

## Progress log

### 2026-09-23 — Environment preflight

- Kan and its local Postgres database are running. A local backup was created and restored to `kan_db_template_identity_test`; the new migration applied successfully to that clone.
- The test report classified no supported identities. The current database has one unrelated active template, so the migration was not applied to the studio database.
- The disposable test clone was removed after report review; the owner-only local backup remains available for the next migration attempt.
- The Outline container had an obsolete broken bind mount. It was recreated from `docker-compose.outline.yml` after backing up its database; `http://localhost:3458` now returns HTTP 200.
- The running Kan container is missing `OUTLINE_URL`, `OUTLINE_API_KEY`, and `OUTLINE_COLLECTION_ID`. The Outline application also still needs its collection and API key configured for Kan.
- No teammate sign-in or Project Wiki end-to-end test has been completed.

## Human handoff — next actions

The implementation is ready for environment setup; release verification is waiting on these operator steps:

1. In Kan, create the three canonical templates through the normal app interface:
   - `Art`: Sketch → Blockout → Render → Review → Done
   - `Software`: Backlog → Doing → Review → Done
   - `Production`: Planned → Booked → Captured → Editing → Delivered
2. In Outline, create/select the Project Wiki collection and generate an API key for Kan.
3. Set `OUTLINE_URL`, `OUTLINE_API_KEY`, and `OUTLINE_COLLECTION_ID` in the local Kan environment, then restart Kan. Keep secret values in ignored local config; do not paste them into this ticket or commit them.
4. Confirm the intended teammate can sign in to Kan and Outline.

Resume here when the templates exist and Kan has the three integration settings. First take a fresh Kan database backup, apply the migration, and inspect its report; continue to end-to-end verification only if each supported identity is classified as expected. The disposable-clone check passed, but the clone predates the canonical templates. Avoid direct SQL seeding of live templates.

### 3. Verify the end-to-end Project Wiki flow

Run the flow from Kan as the intended teammate, once for each supported template identity:

- [ ] Create a project board from the canonical Art template.
- [ ] Create a project board from the canonical Software template.
- [ ] Create a project board from the canonical Production template.
- [ ] Confirm each derived board receives its template identity and a Project Wiki card in its first list.
- [ ] Confirm each card opens the matching Outline document in the configured collection.
- [ ] Confirm the document contains Overview, Decisions, Notes, and References sections plus a backlink to the same Kan board.
- [ ] Edit a section in Outline and confirm the edit persists after reload.

**Exit check:** all three supported workflows pass for a real teammate account.

### 4. Verify failure recovery and provenance

- [ ] In a safe test environment, make Outline unavailable during board creation; confirm the Kan board still exists and wiki creation reports failure.
- [ ] Restore Outline and retry; confirm one document and one Project Wiki card exist after retrying again.
- [ ] In a safe test environment, rename and then soft-delete the source template; confirm the already-derived project remains eligible for wiki retry from its copied identity.

**Exit check:** retries are idempotent, board creation survives Outline failure, and derived-board eligibility does not depend on the source template's current name or existence.

### 5. Handoff

- [ ] Record the migration date, reviewed report outcome, and runtime acceptance results here without adding credentials.
- [ ] Give the intended teammate the Kan board entry point and verify they can open and edit the Project Wiki.
- [ ] Set status to `closed` only after all release checks pass.

## Release boundary

Included: supported-template project boards, linked Outline project documents, the four shared sections, Kan backlink, and retry after partial failure.

Deferred: arbitrary workspace documents, card-level documents, automatic wiki renaming when a project board is renamed, and the admin identity-correction UI.
