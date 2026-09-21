# Team Collaboration & Workspace Management: Functionality Audit

## Workspace Members
- **Multiple users per workspace:**
  - `workspaceMembers` table explicitly supports multiple users linked via `userId`.
  - Roles (`admin`, `member`, `guest`), statuses (`active`, `invited`, etc.), and permissions.
- **Relations:** Users, workspaces, roles, permissions. Enables RFC-compliant isolation.

## Roles & Permissions
- **Defined roles:** Admin, Member, Guest. Hierarchy `admin > member > guest` (configurable).
- **Granular permissions:**
  - `workspace_role_permissions` for role-level settings.
  - `workspace_member_permissions` for overrides.
- **Resources:** Boards, Workspace, and detailed action permissions for CRUD/manage boards/cards.
- **Roles enforced/workspace-scoped.** `getMemberEffectivePermissions` combines these.

## Invites
- **Schema:**
  - `workspaceInviteLinks` supports link-sharing: active/inactive + expiration.
  - Typical invite `status` from spec-UI integration field.
- **Database Integrity:** Enforced cascade `workspaceId->invites`.

-**Implementation/UI linked:**

  Found `<InviteMemberForm.tsx`:

InviteMembers hooks: Supported UI for InviteMemberClicked-state.js: ; Found reusable helpers inc replay hooks 
 through build Panels/UX on frontendSU-case extracted project upgrades through node-layer ref"
  "destinationId-for.. Field-col config
**Cloud notes subscription  ; BadAtNodeCells-ejs visibilityScopes for-prem EMS isolated REF MemberNodesClient JS:**