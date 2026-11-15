# Map explorer

The homepage explorer appears directly after the opening participation section.
It loads Leaflet and public activity when it approaches the viewport. Area search
includes municipalities and handles Greek accents; saved locations can be selected
with “My area”. Map and list selection share a preview and an explicit area link.

`GET /api/locations/map-activity` is public regardless of authentication. It scopes
to Greece and descendants, aggregates counts by location, and rolls them up into
immediate child areas. Counts mean current public pinned issues in open/review
states, public active votes before their deadline, and published cameras with safe
stream URLs. They do not measure registered members or imply a recent time window.
Gray indicates zero activity; unavailable counts use placeholders and a retry.

At local scale (a latitude span below 1.5 degrees), the selected layer requests
only pins inside the visible bounds, in pages of 100. Markers cluster in dense
views. Votes use the associated area's coordinates and are labeled approximate.
Camera pins use exact coordinates when supplied and otherwise source coordinates;
unavailable cameras remain visible with gray markers. Counts cover the whole
selected area, while the list/pins cover the viewport. Responses can be cached
publicly for 30 seconds. Private and locals-only content never enters this feed.

Location pages use one explorer for public geolocated issues, cameras and child areas. The
map API includes descendant locations, applies category/status/date/text/bounds
filters before pagination, and returns 100 issues per page. “Load more” adds the
next page to the map and list. The normal suggestions feed is independent.

Cameras load from `/api/locations/cameras?locationId=…`, including published
webcams in descendant locations. Camera pins use exact coordinates when available
and otherwise the source location's coordinates. The Cameras tab includes working
status and stream links; cameras without coordinates remain in the list. Text and
viewport searches filter cameras, while issue category/status/date filters apply
only to issues. Selecting a camera opens its card; “Show on map” focuses its pin.

Selecting a card or marker opens its details without changing the camera. “Show
on map”, area selection, address selection and reset are explicit camera actions.
Mobile results can be dragged or resized with the keyboard. Reporting is an
explicit mode; ordinary map clicks cannot create draft pins.

The existing OpenStreetMap tiles retain their attribution and browser caching.
CSS quiets the background. Satellite tiles retain Esri attribution. No new map
SDK, key or paid tile service is required.

## Homepage electoral mode

The homepage's MPs mode loads independently of public activity. It uses the 59
existing electoral district polygons via the public Express `/api/electoral-districts`
route and all pages of `/api/persons?position=parliamentary`. Production nginx
forwards API requests directly to Express; local Next.js uses its API proxy.
District selection
zooms the map and lists representatives with party names and profile links.
Search matches district names, MP names and parties without requiring accents.
Nationwide-list MPs are available in the selector and list without a polygon.

The map and parliamentarian directory share `lib/parliamentary-districts.js`:
curated parliamentary assignments take precedence over profile constituencies.
Failed requests show a retry action and do not display incomplete MP counts.
Boundary attribution links to the existing electoral mapping page.

## Address lookup

Address searches run only when submitted, through `/api/geo/search`. The default
provider is public Nominatim. Its [usage policy](https://operations.osmfoundation.org/policies/nominatim/)
requires an identifying User-Agent, cached results, no autocomplete, and an
application-wide maximum of one upstream request per second. The proxy caches
up to 300 queries for 24 hours and rejects uncached requests within 1.1 seconds
of the last upstream request. Location editing shares this proxy.

`MAP_GEOCODING_URL` can point to another Nominatim-compatible provider without a
frontend change. `MAP_GEOCODING_USER_AGENT` overrides the application identity.
The default in-memory limiter/cache is for a single backend process. Deployments
with multiple processes must use a shared gateway/limiter for the public service,
or configure a provider with sufficient capacity. Provider failures leave map
browsing and manual pin placement available.
