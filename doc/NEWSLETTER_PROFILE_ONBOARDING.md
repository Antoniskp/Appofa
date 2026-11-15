# Location onboarding and subscriber campaigns

Run the normal migration command (`npm run migrate`) before deploying the application code. Migration `20261024000000-newsletter-preferences-and-profile-reminders.js` adds nullable email preferences and reminder delivery timestamps to `NewsletterSubscribers`. Existing subscriptions keep general updates enabled; local and community activity campaigns require an explicit topic opt-in.

Migration `20261115000000-newsletter-test-review.js` adds successful test-send records to campaigns. All campaigns, including older drafts and schedules, need a successful test of their current saved content and audience before subscriber delivery. Existing schedules without a current test cannot deliver.

## User flow

- `/onboarding` starts with location when it is missing. `/onboarding?step=location` opens that step directly, including after login.
- Users can search for a location, indicate that they live abroad, save, or skip. Saving a location never subscribes them to emails or verifies voting eligibility.
- Email campaign preferences are optional and saved separately. They are also available in profile settings. Account/security emails and existing in-app/push notifications remain separate from campaign topics.

## Admin flow

- `/admin/newsletter` distinguishes registered accounts, missing locations, located accounts without subscriptions, subscribed accounts, and addresses with historical send failures. A send failure is not proof of a bounce or an invalid address.
- Subscriber lists and CSV exports support account segments. Campaigns additionally support topic and geographic targeting, including descendants of the chosen location.
- The newsletter dashboard separates "Emails for registered users" from subscriber management. It offers profile completion, popular polls, new parliament questions, and locations/events/problem reporting follow-ups. Each has Greek and English draft shortcuts. Templates restrict by locale; review the locale filter deliberately for older subscribers without a saved locale.
- Use “Find polls” in the campaign editor to select an active public poll ordered by participation, optionally searching its title/topic. Local-only voting and expired polls are omitted. “Insert poll card” saves the title and link in both HTML and text; it is an editable snapshot, not a changing recommendation. Check its deadline before scheduling far ahead.
- Use “Find questions” to choose a recent open public parliament question. Private questions, local-only voting, other source types and expired questions are excluded. The card links to the detail page with source context and explains that participation is advisory. This also saves an editable snapshot in both email versions. New questions do not trigger automatic mail delivery.
- Save a campaign before reviewing its rendered email, eligible count, sample recipients and exclusions. Unsaved edits disable test/send/schedule actions. No campaign is created or sent by deploying this change.
- “Send to your inbox” defaults to the signed-in admin's email. Test sends only deliver to the entered address, use a `[TEST]` subject, never change subscription or reminder state, and do not issue a live unsubscribe token. The test record appears after successful SMTP delivery. Content, subject, preview, text, audience, or frontend URL changes require a new test. Content/audience edits cancel scheduled delivery and return the campaign to draft.
- After checking the received email, tick “I checked the email in my inbox and reviewed the audience”, then send or explicitly schedule. Creating or saving a draft never schedules delivery. The server checks the current test for direct API sends and scheduled jobs as well. The campaign list links to review instead of offering an immediate bulk send. “Cancel scheduled delivery” returns a schedule to draft.
- Location reminders require a subscribed address, the general topic, a verified registered account and a missing location. Selection and delivery both check current eligibility. Each address can receive at most one successful profile reminder across campaigns.
- A durable delivery claim prevents concurrent reminder campaigns from sending duplicates. Failed or interrupted attempts remain held for manual review, since SMTP failure can be ambiguous. Inspect the send log/provider before any manual recovery; never clear a claim automatically.
- The completion metric counts reminded profiles that currently have a location. It is not click tracking or proof that the campaign caused completion. No tracking pixels were added.

## Verification

Run the newsletter API tests, `newsletter-profile-reminders.test.js`, `newsletter-review-ui.test.js`, `newsletter-user-campaigns.test.js`, and `location-onboarding-ui.test.js`, plus `npm run lint`. On checkouts with multiple Next.js build directories, passing `--roots __tests__` to Jest avoids scanning those generated directories. API tests need permission to use a temporary local HTTP server; email delivery is mocked and tests use an in-memory database.
