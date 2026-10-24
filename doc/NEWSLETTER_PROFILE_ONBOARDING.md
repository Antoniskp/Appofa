# Location onboarding and subscriber campaigns

Run the normal migration command (`npm run migrate`) before deploying the application code. Migration `20261024000000-newsletter-preferences-and-profile-reminders.js` adds nullable email preferences and reminder delivery timestamps to `NewsletterSubscribers`. Existing subscriptions keep general updates enabled; local and community activity campaigns require an explicit topic opt-in.

## User flow

- `/onboarding` starts with location when it is missing. `/onboarding?step=location` opens that step directly, including after login.
- Users can search for a location, indicate that they live abroad, save, or skip. Saving a location never subscribes them to emails or verifies voting eligibility.
- Email campaign preferences are optional and saved separately. They are also available in profile settings. Account/security emails and existing in-app/push notifications remain separate from campaign topics.

## Admin flow

- `/admin/newsletter` distinguishes registered accounts, missing locations, located accounts without subscriptions, subscribed accounts, and addresses with historical send failures. A send failure is not proof of a bounce or an invalid address.
- Subscriber lists and CSV exports support account segments. Campaigns additionally support topic and geographic targeting, including descendants of the chosen location.
- “Prepare location reminder draft” opens a Greek template. An English template is also available. Templates restrict by locale; review the locale filter deliberately for older subscribers without a saved locale.
- Save a campaign before reviewing its rendered email, eligible count, sample recipients and exclusions. Unsaved edits disable test/send/schedule actions. No campaign is created or sent by deploying this change.
- Location reminders require a subscribed address, the general topic, a verified registered account and a missing location. Selection and delivery both check current eligibility. Each address can receive at most one successful profile reminder across campaigns.
- A durable delivery claim prevents concurrent reminder campaigns from sending duplicates. Failed or interrupted attempts remain held for manual review, since SMTP failure can be ambiguous. Inspect the send log/provider before any manual recovery; never clear a claim automatically.
- The completion metric counts reminded profiles that currently have a location. It is not click tracking or proof that the campaign caused completion. No tracking pixels were added.

## Verification

Run the newsletter API tests, `newsletter-profile-reminders.test.js`, and `location-onboarding-ui.test.js`, plus `npm run lint`. On checkouts with multiple Next.js build directories, passing `--roots __tests__` to Jest avoids scanning those generated directories. API tests need permission to use a temporary local HTTP server; email delivery is mocked and tests use an in-memory database.
