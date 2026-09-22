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

## Settled decisions

- This fork is deployed **self-hosted** (docker-compose) as the studio's internal PM tool.
- Team scale 6–20. Roles used: **admin + member**; guests only if board isolation is needed.
- Signup open on the internal host; **workspace join by invite link only**.
- No code was needed for team functionality — upstream already ships members, roles, invites, board visibility. Build nothing until a concrete gap appears in use.
- Stripe/subscription code stays **dormant** (no gating found on team features).
- Upstream `kanbn/kan` tracked via `upstream` remote; pull updates for now, diverge later.

## References

- `docs/research/team-functionality.md` — functionality audit (tail section unreliable; code-verified facts in glossary above).
