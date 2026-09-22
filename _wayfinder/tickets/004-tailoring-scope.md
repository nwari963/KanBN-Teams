---
type: wayfinder-ticket
status: closed
labels: [wayfinder:grilling]
blocked_by: ['003-verify-kan-onboard']
---

# Studio tailoring v1 scope

## Question
HITL. Choose first small tailoring diffs: UI branding strings, studio board templates (Art: Sketch/Blockout/Render/Review; Software: Backlog/Doing/Review), observed real-use gaps. Constraint: small localized diffs; anything structural -> /to-spec. ADR-0002 records divergence.

## Context
Repo root: /Users/nwariri/OTH=RCOD=.DEV/EXPERIMENTS/KANBN TEAMS. See map Notes.

## Required outcome
Resolution comment (in-ticket '## Resolution' section) + status: closed when done; map's Decisions so far gains one line.

## Resolution
User accepted the recommended v1 tailoring scope:

1. Ship three studio board templates:
   - Art: Sketch → Blockout → Render → Review → Done
   - Software: Backlog → Doing → Review → Done
   - Production/shoot: Planned → Booked → Captured → Editing → Delivered
2. Replace visible Kan/kan.bn branding with OTSICAL and hide “Powered by”; keep upstream technical identifiers unchanged.
3. Fix plain-HTTP clipboard failures as reported, not via a speculative global sweep.
4. Do not pre-seed priority labels; teams create labels from observed use.
5. Distribute DMGs manually; defer auto-updater infrastructure.
6. Add optional **list color** and **card color** fields, independent of labels. Use the existing eight-color studio palette, not free-form colors.
7. Each palette token has two presentation values: a readable soft surface and a strong accent. The selected color fills the full card/list surface; the strong hue is retained for border/header emphasis and accessibility.

This color change is structural (schema + migration + repository/API + UI), so it must move to `/to-spec` rather than be implemented inside the wayfinder ticket.
