---
type: wayfinder-ticket
status: in-progress
labels: [wayfinder:security, wayfinder:task]
blocked_by: []
---

# Shared identity directory

## Decision

Use **LLDAP as the single user directory** and keep **Dex as the OIDC broker** for Kan and Outline. Cal.diy remains on separate credentials.

## Current state

- Dex runs in `docker-compose.outline.yml` with SQLite storage and a static password user.
- Outline already uses Dex OIDC.
- Kan supports generic OIDC through `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, and `OIDC_DISCOVERY_URL`.
- Kan password login remains enabled during migration.

The repository now includes the pinned LLDAP service, Dex LDAP connector, Kan client registration, and `.env.outline.example`. The existing static Dex user remains as the rollback path until live account migration is verified. The host has not started LLDAP yet because the Docker image pull is currently stalling.

## Implementation plan

1. Add a pinned ARM64-capable LLDAP service to the OTSICAL compose estate with persistent storage and LAN-only exposure.
2. Configure Dex's LDAP connector to read users from LLDAP; keep the existing Outline client and add/verify the Kan client and redirect URI.
3. Create the initial administrator and teammate accounts in LLDAP; do not duplicate them in Dex static passwords.
4. Configure Kan's generic OIDC discovery URL and identity claims (`sub`, email, name, preferred username).
5. Verify one teammate end-to-end in both Kan and Outline before changing any account policy.
6. Keep Kan password login until every teammate confirms OIDC access; then remove Dex `staticPasswords` and retain a tested admin recovery path.

## Safety boundaries

- Never commit LLDAP passwords, bcrypt hashes, client secrets, or recovery credentials.
- Back up the LLDAP data volume and Dex configuration before migration.
- A failed OIDC rollout must be reversible by restoring the prior Dex config and using Kan password login.
- Do not route Cal.diy through this directory in v1.

## Acceptance checks

- A directory user can sign into Kan through Dex OIDC.
- The same user can sign into Outline through Dex OIDC.
- The Kan account maps to the existing workspace member without creating a duplicate unexpectedly.
- Password login still works during migration.
- Removing a user from LLDAP prevents new OIDC sign-ins without deleting Kan or Outline content.
