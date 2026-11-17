# Shared map and political widget

`/map` opens the political layer. URLs support `layer=political|cameras|live|news|issues|polls`; political URLs can also select a district with `district=district-athens-a`.

`ExploreLocationsMap` is the shared client component. Embed a single layer anywhere using `initialLayer`, `showLayerControls={false}`, and `showMapLink`. The internal political layer name is `parliamentarians`. The homepage uses the compact `PoliticalMapWidget`, sharing the same boundaries, profile feeds and district assignments. It previews two MPs and two candidates together, with a full-map link preserving the selected district. On mobile, profiles precede an expandable map; map code is only loaded after expansion.

The widget resolves the saved home area using existing municipality-to-district mappings. Multiple districts require a visitor choice. Search supports municipalities and district names; a manual district selector remains available when mapping or search data is missing. A delayed area lookup cannot overwrite a manual selection.

The political layer reuses the existing electoral boundaries and parliamentary profile assignments. The candidates view loads the paginated public `/api/electoral-districts/candidates` feed and filters registrations by election cycle. Only approved parliamentary registrations with public, discoverable profiles are included. Campaign cards link to existing registration pages and show their proposals; approval is not an official ballot listing or a consultation pledge.

Registrations map to an exact electoral district, or to the sole electoral district directly within their registered location. Ambiguous registrations appear under “District not specified”. A candidate's residence is never used to infer their campaign district.

Candidates can add an optional `consultationCommitment` (up to 1,500 characters) on registration and edit it on their own campaign page. Edits return the registration to review through the existing moderation workflow. Plans are labelled as candidate statements, with a separate public-activity link. A plan is never presented as verified consultation or measured participation. Moderators can inspect it in the registration review. A missing plan is explicitly labelled.

The activity layers reuse `/api/locations/map-activity`. News requires published, approved stories linked to locations; its pins are approximate area coordinates. Live streams require approved, unexpired pins and open the source stream. Unlinked live pins are included at national scope. Private problems, inactive polls, unpublished cameras, draft news and pending streams remain excluded.

Run migration `20261117160000-add-candidate-consultation-commitment.js` before deploying the Express API and Next.js frontend together. No new dependency is required.
