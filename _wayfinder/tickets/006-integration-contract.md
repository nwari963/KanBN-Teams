---
type: wayfinder-ticket
status: closed
labels: [wayfinder:grilling]
blocked_by: ['002-integration-surface', '003-verify-kan-onboard']
---

# Integration contract: bookings to boards

## Question
HITL grilling. Decide v1 contract: which Cal event types, what a booking creates in Kan (card? list? activity only), what stays manual. Needs research + running Kan to react against. Folds into /to-spec.

## Context
Repo root: /Users/nwariri/OTH=RCOD=.DEV/EXPERIMENTS/KANBN TEAMS. See map Notes.

## Required outcome
Resolution comment (in-ticket '## Resolution' section) + status: closed when done; map's Decisions so far gains one line.

## Resolution
V1 contract accepted:

- `BOOKING_CREATED` creates exactly one card on a dedicated **Studio Schedule** board in **Booked**.
- Board lists: Booked → Preparing → Completed → Cancelled.
- Card title: `<event title> — <client/team name>`.
- Due date: booking start time.
- Description stores booking UID, start/end, organizer, attendees, location, and source link.
- Apply a `Booking` label.
- Booking UID is the stable idempotency key. Duplicate deliveries update the existing card; never create duplicates. If Cal exposes an event ID, use it; otherwise fingerprint booking UID + event type + timestamp.
- `BOOKING_RESCHEDULED` updates due date/date text, records old→new time as activity/comment, and preserves the current workflow list.
- `BOOKING_CANCELLED` moves the card to Cancelled, prefixes title with `CANCELLED —`, preserves history, and never deletes automatically.
- Ignore REQUESTED, REJECTED, and PAID in v1.
- Architecture remains Cal webhook → small HMAC-verifying receiver → authenticated Kan REST API. No MCP or direct database writes.
