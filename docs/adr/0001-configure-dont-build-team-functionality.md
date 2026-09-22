# ADR-0001: No custom team functionality — configure, don't build

- **Status:** Accepted
- **Date:** 2026-09-21

## Context

The fork's purpose was assumed to be "add team functionality" for an internal PM tool. Research + code verification show upstream Kan already ships: `workspaceMembers` with admin/member/guest roles, granular permission tables, direct invites and invite links with full API (`packages/api/src/routers/member.ts`) and UI (`apps/web/src/views/members/components/InviteMemberForm.tsx`), public/private board visibility. No subscription gating found on any of it.

## Decision

Build nothing. Deploy self-hosted via docker-compose, onboard teammates via invite links (no SMTP), use admin/member roles. Cut code only when a concrete gap appears in actual use.

## Consequences

- Zero diff vs upstream → upstream pulls stay clean while we track them.
- Email-based invites unavailable until SMTP is configured; links shared via team chat instead.
- Stripe/subscription code remains dormant in the codebase.

## Notes

- Deployment: self-hosted, internal host, open signup + invite-gated workspaces.
- Team scale 6–20.
