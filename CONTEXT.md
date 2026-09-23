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
- Partial failure: board creation succeeds even if Outline is down; surface "wiki creation failed" with a retry that is idempotent (checks for an existing link/doc first).
- Identity: a proper shared directory is required (not static Dex config files).
- Identity backend: use LLDAP behind the existing Dex OIDC broker for Kan and Outline. Keep Kan password login during migration until every teammate verifies OIDC access; keep Cal.diy credentials separate because its OIDC path is enterprise-gated.

## References

- `docs/research/team-functionality.md` — functionality audit (tail section unreliable; code-verified facts in glossary above).
