# Map explorer

Location pages use one explorer for public geolocated issues and child areas. The
map API includes descendant locations, applies category/status/date/text/bounds
filters before pagination, and returns 100 issues per page. “Load more” adds the
next page to the map and list. The normal suggestions feed is independent.

Selecting a card or marker opens its details without changing the camera. “Show
on map”, area selection, address selection and reset are explicit camera actions.
Mobile results can be dragged or resized with the keyboard. Reporting is an
explicit mode; ordinary map clicks cannot create draft pins.

The existing OpenStreetMap tiles retain their attribution and browser caching.
CSS quiets the background. Satellite tiles retain Esri attribution. No new map
SDK, key or paid tile service is required.

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
