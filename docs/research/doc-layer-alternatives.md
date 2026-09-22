# Dropbox Paper alternatives: doc/task layer syncable with self-hosted Kan

**Question.** A 6–20 person team tracks work in Dropbox Paper docs (one doc per project, tasks as `- [ ] [P1] Task — @owner — due`). They are standing up a self-hosted Kan instance (Trello-alternative, docker compose, Next.js + tRPC + Postgres) as the system of record. The doc layer must (1) support real-time co-editing for non-dev teammates on browser + mobile, (2) expose a programmatic API good enough for a sync bridge — granular read/write, webhooks or change events, structured data, not whole-file overwrite, (3) be free for 6–20 users, (4) allow data export/ownership.

**TL;DR recommendation.** Switch. Run **Kan as the single source of truth for tasks**, and replace Paper with **Outline self-hosted** as the doc layer for prose/specs/decisions, synced from Kan cards via Outline's RPC API. Dropbox Paper's API is whole-doc export/overwrite only with no webhooks, and Dropbox has already discontinued the Paper mobile/desktop apps — it is the weakest link on every axis that matters here. If standing up a second self-hosted service is unacceptable this quarter, the pragmatic interim is **Trello's own free API** as the sync surface (Kan is a Trello clone and imports Trello boards) with Paper kept only as an archive.

---

## The four criteria

1. **Real-time co-editing** for non-devs, browser + mobile, no git, no CLI.
2. **API quality for a sync bridge** — granular read/write (edit one task, not re-upload the doc), webhooks or change notifications, structured data model.
3. **Free tier fits 6–20 users.**
4. **Data ownership/export** — can you leave, and can scripts read everything back?

## Status quo: Dropbox Paper (and why it fails criterion 2)

- The legacy Paper API namespace is frozen; Dropbox has been migrating Paper docs to `.paper` files in the regular filesystem since 2019 and states the legacy `/paper/` endpoints "will be retired" once migration completes.[5] The supported path is the Dropbox **files** API: `files/export` (to `.md`/`.docx`) and `files/paper/update` (full-doc overwrite via import format/revision). There is no block-level or task-level edit endpoint and no webhook that fires on Paper content changes.
- The Paper **mobile and desktop apps were discontinued October 9, 2025**; Paper is browser-only going forward.[18] Docs can still be exported to markdown from the web UI.[17]
- Verdict per criteria: co-editing in-browser still works (criterion 1 ✓), API is whole-doc overwrite with polling-only change detection (criterion 2 ✗), free (✓), export to `.md` exists (✓, manual per-doc or via API export). **Paper is a dead end for a sync bridge.**

## Candidates evaluated

### Notion (cloud)

- **API.** Genuinely good: REST over pages/blocks/databases, granular block read/write, to-do blocks with checked state, database rows with properties — a sync bridge can read and write individual tasks. Rate limit is 3 req/sec average on non-Business plans (180/min per connection), 1,000 blocks and 500 KB per request, 2,000 chars per rich-text field.[7]
- **Free tier.** The killer: a Free workspace with 2+ members is capped at **1,000 lifetime blocks per workspace**; deleting blocks does not restore capacity, and the REST API now enforces this — block-creating writes fail with HTTP 403 `restricted_resource` once the cap is hit.[6][8] A 6–20 person team doing one doc per project plus task lists will hit 1,000 blocks in weeks. Unlimited blocks requires a paid plan (Plus, ~$10–12/member/mo). So criterion 3 **fails for a team** unless you pay.
- **Webhooks.** No native webhooks; integrations poll (commonly via `last_edited_time` filters). Acceptable for a slow bridge, not great.
- **Ownership.** Export to Markdown/CSV; API can read back most content. Mobile apps are first-class, offline support on all plans.[6]
- **Verdict.** Best-in-class API, but the 1,000-block free cap for multi-member workspaces makes it a paid product for this team size.[6][8]

### Outline (self-hosted; also cloud) — recommended

- **API.** RPC-style `POST /api/:method`, "the main application is built on exactly the same API"; OpenAPI spec published; Bearer API keys or OAuth 2.0 with scoped keys (read-only keys possible); granular `documents.info`, `documents.update`, revisions, collections, and more — a bridge can fetch and patch individual documents programmatically.[1][20] No first-class webhook system, but `documents.info` returns `updatedAt` for cheap polling, and self-hosting means you can also watch Postgres directly if needed.
- **Co-editing.** Real-time collaborative markdown editor in the browser; widely regarded as the strongest self-hosted wiki editor; mobile web works (no dedicated mobile app).[2]
- **Free tier.** Self-hosting is free and unlimited users (BUSL-1.1 source-available license); cloud is $10/mo for 1–10 members, $79/mo for 11–100.[2] For a team already running Kan in docker compose, adding Outline is one more compose service (it does add its own Postgres/Redis + optional MinIO/S3).
- **Ownership.** Markdown-native, full export, and it's your database. Best-in-class on criterion 4.
- **Verdict.** The only candidate that scores well on all four criteria *for this specific team*, which is already committed to self-hosting. ✅

### HedgeDoc (self-hosted, free)

- **API.** Notes are raw markdown; the HTTP API covers create (`POST /new`), read (`/:id/download` returns raw markdown), metadata (`/info`), revisions — plus a full user-history set. Editing is **whole-note body replacement** (the API is note-granular, not block-granular); no task-level structure; no webhooks; change detection via revision timestamps.[3]
- **Co-editing.** Real-time collaborative markdown in browser, works on phones, guest editing possible — genuinely good for non-devs.[4]
- **Free/ownership.** AGPL, self-host, markdown export, zip export of all notes. Perfect on 3 and 4.
- **Verdict.** A lighter-weight Outline with a weaker API: note-level overwrite is exactly the Paper failure mode, just self-hosted. Viable if you only need "doc text in, doc text out" and poll revisions. Runner-up.

### AppFlowy (self-hosted cloud)

- **API.** Self-hosting means deploying AppFlowy-Cloud; the open-core model has consolidated codebases, with the self-host commercial edition carrying extra services (e.g. standalone search); a public REST API for third-party bridges is not a documented first-class surface the way Outline's is.[13]
- **Free tier.** Cloud free tier exists; self-host plans are separately priced; the self-host commercial fork is under a separate license.[13]
- **Verdict.** Notion-like UX, but the API story for an external sync bridge is murkier than Outline's, and the licensing split (open-source clients vs closed-source self-host fork) complicates ownership. Not recommended over Outline for this use case.

### AFFiNE (self-hosted)

- **Self-host.** Docker Compose is the official path; MIT-licensed editor, source-available backend, self-host positioned as free/open source with paid AI add-ons.[14]
- **Verdict.** Comparable self-host proposition to Outline but younger; docs/whiteboard focus; the public API surface for programmatic document CRUD is less mature/documented than Outline's RPC API. Watch, don't adopt.

### AnyType

- **Local-first, E2E-encrypted; free tier = unlimited local objects, 100 MB sync storage, 10 shared spaces; you can self-host an any-sync node.** But: **no web app, no API ecosystem** — browser access and programmatic bridges are explicitly absent.[12] Fails criteria 1 and 2 outright. Out.

### Google Docs / Google Sheets (cloud)

- **API.** Google Sheets API v4 is excellent for a sync bridge: `spreadsheets.batchUpdate` applies atomic batches of cell-level operations, values get/set, and Apps Script/Cloud Functions can react to edits; Docs has `documents.batchUpdate` with structural requests, but Docs is painful for structured tasks.[15][16] No general-purpose REST webhooks (change detection via push notification channels on Drive files or polling).
- **Free tier.** Free with a Google account, 6–20 users trivially fine.
- **Co-editing.** Best-in-class real-time editing, first-class mobile apps.
- **Ownership.** Takeout export; API read-back fine for Sheets.
- **Verdict.** If the "doc" is really a task table, **Google Sheets is the strongest cloud-hosted option** — cell-level API + familiar UX. It loses on data ownership (Google-hosted) and the Docs flavor is unsuitable for structured sync. Solid plan B for teams that refuse another self-hosted service.

### Shared git repo + Obsidian

- Markdown files in git; devs happy; Obsidian is free for personal use but the app is per-device with no real multi-user real-time co-editing — collaboration happens via commits/PRs or third-party relay plugins, which is exactly what non-dev teammates won't do. Fails criterion 1 for the stated audience. The *files themselves* are the most sync-friendly format (a script can parse `- [ ] [P1]` lines trivially), so git+markdown is a great **export/archive target**, not the editing layer.

### Trello (cloud, free tier) — special case

- **API.** First-class REST API with self-serve keys/tokens, granular card/list/board CRUD, and **webhooks with retries** — POST callbacks on any model change, watchable at board/card level.[10]
- **Free tier.** Up to **10 collaborators per workspace and 10 open boards**, unlimited cards and Power-Ups, unlimited storage (10 MB/attachment).[9][19] A 6–10 person team fits free; 11–20 does not — you'd need Standard ($5/user/mo) for the extra collaborators, and more than 10 boards costs too.
- **The catch (per the brief).** The goal is self-hosted Kan as the interface; a Trello board as the doc layer duplicates the board, not the doc. Where Trello shines here: **Kan has built-in Trello import**, and Kan's data model is a Trello clone — so mirroring Kan → Trello (or importing Trello → Kan) is the lowest-friction programmatic path that exists. If the team is ≤10 people, a free Trello board used as the *sync representation* that teammates can also open in the good mobile app is a legitimate interim architecture. Beyond 10 collaborators it stops being free.[9][19]

### GitHub Projects (cloud, free)

- **Free** for unlimited collaborators on public/private repos; **GraphQL API** manages Projects v2: add items, update custom fields via `updateProjectV2ItemFieldValue`, built-in automation workflows.[11] Structured, webhooks on repo events exist.
- But the UX is issue-tracker-shaped: fine for devs, hostile to non-dev teammates on mobile. Fails criterion 1 for the stated audience. Good as a dev-facing mirror, not the doc layer.

---

## Comparison table

| Candidate | Real-time co-edit (browser+mobile) | Bridge API (granular + events) | Free for 6–20 | Ownership/export | Fit |
|---|---|---|---|---|---|
| Dropbox Paper (status quo) | ✅ browser (apps discontinued)[18] | ❌ whole-doc export/overwrite, no webhooks[5] | ✅ | ✅ `.md` export[17] | Dead end for sync |
| **Outline self-hosted** | ✅ real-time, mobile web[2] | ✅ granular RPC API, scoped keys, OpenAPI[1][20] | ✅ unlimited users self-hosted[2] | ✅ markdown, your DB | **Recommended** |
| HedgeDoc self-hosted | ✅ real-time, phones, guests[4] | ⚠️ note-level overwrite, no webhooks, revision polling[3] | ✅ | ✅ markdown/zip | Runner-up (lighter) |
| Notion | ✅ + native apps | ✅ blocks/databases, but poll-only | ❌ 1,000-block lifetime cap for multi-member free workspaces, API-enforced[6][8] | ✅ md/csv | Paid product at this size |
| Google Sheets | ✅ best-in-class | ✅ cell-level `batchUpdate`, push channels[16] | ✅ | ⚠️ Google-hosted | Best cloud plan B |
| Trello | ✅ native apps | ✅ granular REST + webhooks with retries[10] | ⚠️ ≤10 collaborators & 10 boards free[9][19] | ✅ JSON export | Sync representation / interim |
| GitHub Projects | ❌ for non-devs | ✅ GraphQL[11] | ✅ | ✅ | Dev mirror only |
| Obsidian + git | ❌ no real-time multi-user | ✅ (plain files) | ✅ | ✅✅ | Archive target |
| AppFlowy | ✅ | ⚠️ not a documented first-class bridge API[13] | ⚠️ open-core licensing split[13] | ⚠️ | Not over Outline |
| AFFiNE | ✅ | ⚠️ young public API[14] | ✅ self-host[14] | ✅ | Watch |
| AnyType | ❌ no web app | ❌ no API ecosystem[12] | ✅ | ✅ local-first | Out |

## Recommendation

1. **Make Kan the system of record for tasks.** Every `- [ ] [P1] Task — @owner — due` line becomes a Kan card (label=P1, member=owner, dueDate=due). One-time import: Paper → markdown export → script → Kan's Postgres/tRPC, or via Kan's built-in Trello import if you stage cards in Trello first.
2. **Switch the doc layer from Paper to Outline (self-hosted), in the same docker-compose estate as Kan.** Teammates get real-time co-editing in any browser including mobile; the bridge talks to Outline's RPC API (`documents.list`/`documents.info`/`documents.update`) with a scoped API key; docs are markdown in your own Postgres, so ownership is total.[1][2][20] Keep docs prose-first — meeting notes, specs, decisions — with an auto-generated "Tasks" section per project doc rendered from Kan cards (one-way Kan → doc), and task *edits* happen in Kan, not the doc. One-way rendering avoids the two-way sync problem entirely; the doc's task section is always a view, never an input.
3. **If a second self-hosted service is vetoed this quarter:** interim bridge = free Trello board (≤10 collaborators) as the machine-readable mirror, synced Kan ↔ Trello via Trello's REST API + webhooks[10], and keep Paper only as a read-only archive. For an 11–20 person team, use Google Sheets as the teammate-facing task table (cell-level API, familiar mobile UX)[16] instead of Trello.

**Why not keep Paper:** its API cannot express "toggle task 7" without rewriting the whole doc, has no change events, and Dropbox has already killed the Paper apps — every integration you build against it is on borrowed time.[5][18]

## Sources

[1] https://www.getoutline.com/developers — Outline API documentation
[2] https://www.getoutline.com/pricing — Outline pricing (cloud plans; self-host free under BUSL)
[3] https://docs.hedgedoc.org/dev/api — HedgeDoc API documentation
[4] https://hedgedoc.org — HedgeDoc homepage
[5] https://developers.dropbox.com/paper-migration-guide — Dropbox Paper migration guide
[6] https://www.notion.com/help/understanding-block-usage — Notion block usage (free plan limit)
[7] https://developers.notion.com/reference/request-limits — Notion API request limits
[8] https://developers.notion.com/reference/workspace-block-limits — Notion API workspace block limits
[9] https://trello.com/pricing — Trello pricing
[10] https://developer.atlassian.com/cloud/trello/guides/rest-api/webhooks — Trello webhooks guide
[11] https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects — GitHub Projects API
[12] https://freealternatives.to/anytype/review — Anytype review: free tier, no web app/API
[13] https://appflowy.com/docs/Self-hosted-Plans-and-Pricing — AppFlowy self-hosted plans and pricing
[14] https://affine.pro/pricing — AFFiNE pricing / self-host
[15] https://developers.google.com/workspace/docs/api/reference/rest/v1/documents/batchUpdate — Google Docs API batchUpdate
[16] https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/batchUpdate — Google Sheets API batchUpdate
[17] https://help.dropbox.com/view-edit/paper-export-docs — Dropbox Paper export formats
[18] https://alternativeto.net/news/2025/9/dropbox-will-discontinue-its-paper-mobile-app-for-ios-and-android-next-month — Dropbox Paper mobile app discontinuation
[19] https://usecarly.com/blog/trello-free-plan-limits — Trello free plan limits (10 boards/10 collaborators)
[20] https://github.com/outline/openapi/blob/main/spec3.yml — Outline OpenAPI spec
