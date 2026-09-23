# CONTEXT

Project glossary and settled decisions. Single-context repo.

## Glossary

- **Workspace** — the team container. Members, roles, and boards live under it.
- **Member** — a user joined to a workspace via `workspaceMembers` (schema: `packages/db/src/schema/workspaces.ts`).
- **Role** — `admin | member | guest` (legacy enum) plus `workspaceRoles`/`workspace_member_permissions` for granular permissions (schema: `packages/db/src/schema/permissions.ts`).
- **Invite link** — shareable URL from `workspaceInviteLinks`; created/deactivated/accepted via `packages/api/src/routers/member.ts`. Preferred teammate onboarding (no SMTP configured).
- **Board** — a project. Visibility is public (workspace) or private (role-gated).
- **List color** — an optional color chosen from the shared studio palette; visually colors the full list column.
- **Card color** — an optional color chosen from the shared studio palette; visually colors the full card surface. It is independent of labels.
- **Guest** — restricted role; use for teammates limited to specific private boards.
- **OTSICAL** — the studio's self-hosted stack: Kan (project management) + Cal.diy (scheduling) + Outline (wiki/knowledge). LAN-first, one Docker estate, distinct ports, not a merged application.
- **Project Wiki** — the Outline document linked to a Kan board, serving as that project's shared Overview, Decisions, Notes, and References space.
- **Supported studio template** — one of the studio's approved workflow templates whose identity authorizes a derived project board to receive a Project Wiki. Its display name is a label, not its identity.
- **Template identity** — the durable workflow key stored on a template board and inherited by derived project boards; it is distinct from the board's editable display name.
- **Identity directory** — LLDAP is the shared user source of truth; Dex brokers OIDC for Kan and Outline without maintaining an independent user list.

## Settled decisions

- This fork is deployed **self-hosted** (docker-compose) as the studio's internal PM tool.
- Team scale 6–20. Roles used: **admin + member**; guests only if board isolation is needed.
- Signup open on the internal host; **workspace join by invite link only**.
- No code was needed for team functionality — upstream already ships members, roles, invites, board visibility. Build nothing until a concrete gap appears in use.
- Stripe/subscription code stays **dormant** (no gating found on team features).
- Upstream `kanbn/kan` tracked via `upstream` remote; pull updates for now, diverge later.
- OTSICAL's unified client is the existing Tauri desktop wrapper, expanded to fixed **Kan · Schedule · Wiki** navigation while services remain independently deployed.
- Dex is the shared identity provider for Kan and Outline. Kan keeps password login during migration; OIDC becomes exclusive only after every teammate verifies access. Cal.diy keeps separate credentials because its OIDC/SSO path is enterprise-gated; revisit if that constraint changes.
- Cross-wiki references are project-level: creating a studio board creates and links an Outline project document; the Outline document links back to its Kan board. Card-level documents are deferred.
- Wiki doc creation fires only for boards created from the three studio templates. The link lands as a **Project Wiki** card in the board's first list (no schema change). Docs live in one **OTSICAL Projects** Outline collection with Overview/Decisions/Notes/References sections.
- MVP Outline scope is the existing project-level integration: workspace members create a supported studio-template board, open its linked Project Wiki in Outline, edit the shared sections, and return to Kan through the board link. Standalone arbitrary workspace pages and card-level documents are out of scope.
- Supported studio templates are identified by stable workflow identity rather than display name; renaming a supported template does not revoke its eligibility. Renaming a derived project board does not automatically rename its Project Wiki in the MVP.
- Template identity belongs to the board domain as a persisted field, not deployment-specific configuration or a separate registry.
- The initial supported template identities are `art`, `software`, and `production`; they are assigned during studio-template creation/configuration and immutable for the MVP. Ordinary users can rename the display title but cannot change the identity.
- Existing studio templates are migrated by matching their current names to `Art`, `Software`, and `Production/Shoot`; unrelated templates remain unclassified and cannot create Project Wikis.
- If multiple existing templates match one supported name, only one canonical template receives the identity; duplicates remain unclassified and cannot create Project Wikis.
- The canonical duplicate is selected as the oldest non-deleted matching template; all newer matches remain unclassified.
- Existing project boards created before template-identity migration remain unchanged; migration classifies templates only and does not backfill or automatically create Project Wikis for prior projects.
- New project boards store both their source template reference and copied stable template identity; the reference preserves provenance while the copied identity preserves eligibility if the source is renamed or removed.
- A derived project remains eligible for Project Wiki creation or retry after its source template is deleted because eligibility follows the copied stable identity.
- Copied template identity is immutable for ordinary members; workspace admins may correct it when migration or template assignment was wrong.
- The admin correction mechanism is deferred beyond the MVP; the domain rule is recorded without adding an API or UI until a real correction need appears.
- The three approved studio template identities are assigned by hard-coded seed definitions; custom user-created templates cannot receive a supported identity or create a Project Wiki in the MVP.
- Stable template identity is introduced through a database migration that classifies the existing canonical studio templates, plus application constants used when future approved templates are seeded; custom templates remain unclassified.
- Existing templates are classified using both their current display name and expected workflow list structure, so a name match alone cannot grant supported studio-template identity.
- Expected workflow structure is an exact ordered list-name and list-count match:
  - Art: Sketch, Blockout, Render, Review, Done
  - Software: Backlog, Doing, Review, Done
  - Production/Shoot: Planned, Booked, Captured, Editing, Delivered
- List matching is case-insensitive with surrounding whitespace trimmed; list order and count remain exact.
- A name-matching template with the wrong list structure remains unclassified and emits a migration warning for administrators.
- Migration warnings are recorded in a migration result/report table so administrators can inspect classified, skipped, and rejected templates after the migration.
- Stable template identity, exact workflow-structure migration, duplicate resolution, and migration reporting are implemented as the first follow-up to the Project Wiki MVP; the migration must be applied before wider team use.
- The exact name-and-list-structure classifier is built and tested before persisted identity and migration data changes are introduced.
- If a template matches more than one supported identity, the classifier rejects it as ambiguous and leaves it unclassified rather than applying a priority rule.
- Partial failure: board creation succeeds even if Outline is down; surface "wiki creation failed" with a retry that is idempotent (checks for an existing link/doc first).
- Identity: a proper shared directory is required (not static Dex config files).
- Identity backend: use LLDAP behind the existing Dex OIDC broker for Kan and Outline. Keep Kan password login during migration until every teammate verifies OIDC access; keep Cal.diy credentials separate because its OIDC path is enterprise-gated.

## References

- `docs/research/team-functionality.md` — functionality audit (tail section unreliable; code-verified facts in glossary above).
