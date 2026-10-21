# Shared calendar and location events

The shared `/calendar` page and each location's Events tab consume `/api/calendar`.
Entries are projections of source records. There is deliberately no duplicate
calendar-entry table: changing an event changes its next calendar response.

## Extending the calendar

Register source adapters in `src/services/calendarService.js`. The first adapter
is `calendarSources/locationEvents.js`. Each adapter accepts a date range,
optional location/category, view, limit/offset, and authenticated user. It must
enforce its own visibility rules **before** counting or returning entries.
Private reminders must never be returned by an adapter for another user.

Return `{ data, total, canManage }`. Each entry has a source-qualified `id`,
`source`, `sourceId`, `title`, `start`, `end`, `allDay`, `timezone`, and `href`.
Location, category and status are optional source metadata. Keep source-specific
editing and moderation in that source's routes and detail page.
The aggregator merges source results in start order and paginates them.
Polls and elections should project their existing dates rather than create events.

## Date semantics

Timed events store UTC instants and an IANA timezone. The form converts local
date/time in the selected zone, rejecting nonexistent/ambiguous DST times.
Calendar dates and times display in each event's zone and the selected language. All-day events use UTC
midnight as a floating date encoding, with an exclusive end. The form accepts
an inclusive final day and converts it. Queries use interval overlap, so
multi-day events appear on every relevant calendar day. The client requests a
one-day buffer at month edges for timezones and filters by the displayed dates.
Month requests use `complete=true`, restricted to a maximum 34-day window,
and return all matching entries. There is no 100-entry truncation in month views.
The mobile grid displays day counts and opens a full agenda for the selected day.
The default list shows upcoming/ongoing events in the next 12 months, with
separate past (newest first) and selected-month views. Lists retain pagination.
All-day events are checked against the cutoff date in their own timezone before
counting and paginating upcoming/past results. Those bounded queries currently
filter lightweight candidate records in memory; consider a database projection
if very large annual datasets become common.

## Publishing

Members submit pending events. Administrators and moderators assigned to the
location or an ancestor may publish directly and review pending submissions.
An author's edits return the event to pending. Published events can be cancelled
by the author or authorized moderator; cancelled events remain publicly visible.
Updates use revisions to reject stale edits. Pending/rejected detail pages are
restricted to the author and authorized moderators. Calendar responses are not
publicly cached. `.ics` exports carry stable IDs and revision numbers.
Rejection requires feedback. The review note is visible only to the author and
authorized moderators and clears on resubmission. Successful moderator approval,
rejection, or cancellation notifies the author using the existing notification
service (respecting preferences, without self-notifications). The notification
links to the event; private feedback is not included in push payloads. Delivery
is best-effort after commit and failures are logged without undoing the decision.

## Rollout and verification

Run the normal migration command (`npm run migrate:up`) against the intended
database before restarting/deploying the backend and frontend. Migration
`20261012100000-create-location-events.js` creates the event table and indexes.
For installations that already deployed events, the additive migration
`20261012200000-add-event-review-note.js` adds an empty review note to existing
records. Run it before the updated backend starts. No existing events need backfilling. Do not roll back the creation migration after accepting submissions
without preserving the table first; the down migration drops it.

Tests: `npx jest __tests__/calendar.test.js __tests__/calendar-dates.test.js
__tests__/calendar-ical.test.js --runInBand` and
`npx playwright test e2e/calendar.spec.js` (disposable database, desktop/mobile).

Recurring events, attendance, reminder delivery, external calendar subscriptions,
and additional sources are future work. Calendar messages live in
`messages/calendar/{en,el,ro}.json` and are merged into the app's next-intl messages.
The timezone picker searches the runtime's supported IANA zones and preserves
the event's existing zone. Upcoming/past lists use pages of 100 entries.

The shared calendar keeps its browsing context in the URL (`mode`, `period`,
`month`, `location`, `category`, `view`, `descendants`, `day`, and `page`). Native
history updates preserve refresh, sharing, and Back/Forward navigation. Embedded
location calendars keep their controls local so they do not overwrite location
page query parameters. The My area shortcut uses the signed-in member's saved
home location, and includes sublocations explicitly. Advanced filters are
collapsible; the agenda groups entries by their start date in the event timezone.
