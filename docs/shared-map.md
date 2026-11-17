# Shared map and political widget

`/map` opens the political layer. URLs support `layer=political|cameras|live|news|issues|polls`; political URLs can also select a district with `district=district-athens-a`.

`ExploreLocationsMap` is the shared client component. Embed a single layer anywhere using `initialLayer`, `showLayerControls={false}`, and `showMapLink`. The internal political layer name is `parliamentarians`. The homepage uses these props to show the political widget immediately after the hero, with a link preserving the selected district.

The political layer reuses the existing electoral boundaries and parliamentary profile assignments. The candidates view loads the paginated public `/api/electoral-districts/candidates` feed and filters registrations by election cycle. Only approved parliamentary registrations with public, discoverable profiles are included. Campaign cards link to existing registration pages and show their proposals; approval is not an official ballot listing or a consultation pledge.

Registrations map to an exact electoral district, or to the sole electoral district directly within their registered location. Ambiguous registrations appear under “District not specified”. A candidate's residence is never used to infer their campaign district. The existing registration workflow and moderation remain unchanged.

The activity layers reuse `/api/locations/map-activity`. News requires published, approved stories linked to locations; its pins are approximate area coordinates. Live streams require approved, unexpired pins and open the source stream. Unlinked live pins are included at national scope. Private problems, inactive polls, unpublished cameras, draft news and pending streams remain excluded.

No schema migration or new dependency is required. Deploy the Express API and Next.js frontend together.
