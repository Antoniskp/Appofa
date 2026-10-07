# Proposals addressed to public offices

Users can select an optional recipient on the new/edit suggestion forms after selecting a location. The location defaults to the user's home or the location page they came from. Existing community proposals remain valid without a recipient.

Recipients are offices, not people: mayor for a municipality, regional/prefectural authority for a prefecture, and active `GovernmentPosition` records serving the selected location. National offices are matched using the country ancestor's code; jurisdiction-specific offices must belong to the location ancestry. No officeholder is inferred from a user profile. Regional/prefectural labels deliberately describe an authority rather than claiming that a prefecture is a modern Greek administrative region.

`GET /api/suggestions/recipients?locationId=…` returns available recipients. Create/edit accepts `recipientKey` (`mayor:ID`, `regional:ID`, `position:ID`); the server resolves and stores a canonical `recipient` JSON snapshot. Client-supplied recipient labels are ignored. Changing the proposal's location revalidates its office; the UI clears the selection so the author can choose again. Ordinary edits preserve historical addresses even if an office is later deactivated. Send `recipientKey: null` to remove the address.

`GET /api/suggestions?recipientKey=…` filters by office across proposal locations; `addressed=true` excludes community-only proposals. Existing visibility, voting and author-edit rules still apply. Cards and detail pages link to the office feed. Proposals remain attached to an office when its holder changes. There is no external email, automatic delivery, official acknowledgement, or additional access granted to officeholders.

Deploy migration `20261007000000-add-suggestion-recipient.js` before starting the updated backend. It adds nullable `recipientKey`/`recipient` columns and an index without changing existing data. National offices use the existing government-position administration and seeds; local office choices do not require new seeds.

Validation: `__tests__/suggestion-recipients.test.js`, `__tests__/suggestion-recipient-selector.test.js`, and existing suggestion/location/translation regressions. UI strings are under `suggestionRecipients` in EL/EN/RO.
