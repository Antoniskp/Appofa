# Polygon Data for the Homepage Map

This document explains how polygon boundary data is sourced, structured, and used for the Appofa homepage map.

## Current implementation

The homepage `Εξερεύνησε Περιοχές` map renders **per-location `boundary_geojson` polygons** fetched from the API for Greek prefecture locations.  The map prefers the user-uploaded location boundaries and only falls back to the static simplified file when no location boundaries are available.

### Boundary source priority

| Priority | Source | When used |
|----------|--------|-----------|
| **1st — preferred** | `Location.boundary_geojson` from the database | When at least one prefecture in the API response has `boundary_geojson` set |
| **2nd — fallback** | `public/data/greece-regions.geojson` (static file) | When NO prefecture has `boundary_geojson` (e.g. fresh install) |

### How to add/update a prefecture boundary

1. Open the location's edit page (`/locations/<slug>` → Edit → Boundary GeoJSON field).
2. Paste or upload a `.geojson` / `.json` file with a `Polygon`, `MultiPolygon`, `Feature`, or `FeatureCollection` containing Polygon/MultiPolygon geometry.
3. Save.  The next homepage load uses the new boundary automatically.

The homepage fetches prefectures with `GET /api/locations?type=prefecture&limit=50`; the `boundary_geojson` column is included in the response via `l.*` (raw query path) or `toJSON()` (ORM path).

### Prefecture pills

Below the map a row of clickable pills renders for every prefecture in the API response.  Each pill shows `name_local || name` and links to `/locations/<slug>`.  Pills render regardless of whether a boundary is present.

## Static fallback GeoJSON schema

`public/data/greece-regions.geojson` is retained as a fallback and may be updated with higher-quality boundaries.  Each feature has:

```jsonc
{
  "type": "Feature",
  "id": "GR-A",                          // unique feature ID (ISO 3166-2 code)
  "properties": {
    "name": "Ανατολική Μακεδονία & Θράκη",   // Greek name (required)
    "name_en": "East Macedonia and Thrace",   // English name (optional)
    "code": "GR-A",                          // region code — used for joining vote/stats data
    "capital": "Κομοτηνή",                   // capital city (shown in tooltip/popup)
    "capital_en": "Komotini",
    "type": "periphery",                     // layer type key (used for filtering)
    "center": [25.3, 41.1]                   // [lng, lat] hint for label placement
  },
  "geometry": { ... }                        // Polygon or MultiPolygon
}
```

The `code` property is the join key for future choropleth coloring — map your vote or participation data to the same code and (in a future BaseMap extension) pass a `styleFeature(feature)` callback to the polygon layer.

### Root metadata fields

`public/data/greece-regions.geojson` currently includes root-level metadata keys (`_comment`, `_license`, `_source`) for attribution/provenance. These are **non-standard GeoJSON extensions** and may be stripped by strict processors; move them to a sidecar README if a downstream consumer requires strict RFC 7946-only root fields.

## Why peripheries, not electoral districts?

| Layer | Pros | Cons |
|-------|------|------|
| **Peripheries (13)** | Widely understood, stable since Kallikratis 2010, good administrative granularity, easy to find authoritative data | Not the same as electoral districts |
| **Electoral districts (56 single-seat + multi-seat)** | Directly maps to Parliament seats | More complex, change with redistricting, harder to source free/authoritative GeoJSON |
| **Municipalities (~330)** | Most local, aligns with location pages | Too many polygons at default zoom, file would be large |

**Recommendation**: use peripheries as the top-level layer, with municipalities as a drill-down layer (Phase 2). Electoral districts can be added as a parallel layer when needed — the architecture already supports multiple `polygonLayers`.

## How to add authoritative data (preferred path)

The preferred way to upgrade boundaries is through the admin UI:

1. Go to the location's edit page.
2. Use the **Boundary GeoJSON** field to paste or upload a `.geojson` / `.json` file.
3. The platform validates that the root type is `Polygon`, `MultiPolygon`, `Feature`, or `FeatureCollection` containing only Polygon/MultiPolygon geometries.
4. Save — the homepage map picks up the new boundary automatically.

## How to update the static fallback file

If you want to upgrade the fallback `public/data/greece-regions.geojson`:

### Option 1 — ELSTAT / geodata.gov.gr (recommended for Greece)

The Hellenic Statistical Authority (ΕΛΣΤΑΤ) publishes official administrative boundaries:

1. Go to [geodata.gov.gr](https://geodata.gov.gr) (Greek open government data portal).
2. Search for "Καλλικρατικοί Δήμοι" or "Περιφέρειες".
3. Download the Shapefile (`.shp`) or GeoJSON for the layer you want.
4. If you downloaded a Shapefile, convert to GeoJSON (requires [GDAL](https://gdal.org); install with `brew install gdal` on macOS or `apt-get install gdal-bin` on Debian/Ubuntu):
   ```bash
   ogr2ogr -f GeoJSON output.geojson input.shp -t_srs EPSG:4326
   ```
5. Simplify the geometry to reduce file size (optional but recommended; [mapshaper](https://mapshaper.org) will be downloaded automatically via `npx` on first run, or install globally with `npm i -g mapshaper`):
   ```bash
   npx mapshaper output.geojson -simplify 2% -o public/data/greece-regions.geojson
   ```
6. Map the attribute columns to the schema above (rename or add `name`, `code`, `capital` etc.).
7. Validate the result:
   ```bash
   node -e "const d=require('./public/data/greece-regions.geojson'); console.log(d.features.length,'features')"
   ```

### Option 2 — GADM

[GADM](https://gadm.org) provides ready-made country administrative boundaries:

1. Download [Greece level-1 (regions)](https://gadm.org/download_country.html) as GeoJSON.
2. The file is pre-simplified and available for non-commercial use under GADM's license.
3. Map GADM column `NAME_1` → `name_en` and add the `code` column from ISO 3166-2.
4. Drop the file in `public/data/greece-regions.geojson`.

> ⚠️ GADM license: non-commercial use only; requires attribution.

### Option 3 — OpenStreetMap / Overpass

For electoral districts or other ad-hoc boundaries not in GADM/ELSTAT:

```overpass
[out:json][timeout:60];
rel["admin_level"="4"]["ISO3166-2"~"GR"]({{bbox}});
out geom;
```

Use [overpass-turbo.eu](https://overpass-turbo.eu) to run the query, export as GeoJSON.

### Option 4 — Hand-craft with geojson.io

For small corrections or single regions:
1. Open [geojson.io](https://geojson.io).
2. Draw the polygon visually.
3. Copy the GeoJSON feature and paste into `greece-regions.geojson`.

## How to add electoral districts (future)

1. Create `public/data/greece-electoral-districts.geojson` with the same schema (use `type: "electoral_district"` and Greek NUTS codes or your own `code` values).
2. In `components/map/GreeceBoundaryMap.js`, add a second entry to `polygonLayers`:
   ```js
   {
     id: 'greece-electoral-districts',
     geojson: electoralData,
     style: { color: '#7c3aed', weight: 1.5, fillOpacity: 0.06, ... },
     hoverStyle: { ... },
     getTooltip: (props) => props.name,
     fitBoundsOnClick: true,
   }
   ```
3. Add a toggle button to switch between layers (or show both simultaneously).

## How to add choropleth coloring (future)

Replace the static `style` in the `polygonLayers` entry with a `styleFeature` function (to be added to `BaseMap`'s `polygonLayers` spec):

```js
// Example: color regions by participation rate
styleFeature: (feature) => {
  const rate = voteData[feature.properties.code] ?? 0;
  return {
    fillColor: choroplethColor(rate),   // your color scale fn
    fillOpacity: 0.5,
    color: '#fff',
    weight: 1,
  };
},
```

The `code` property in the GeoJSON is the join key — map your backend data to the same code values.

## How to add municipality drill-down (future)

1. Create `public/data/greece-municipalities.geojson` (ELSTAT/GADM level-3 data, simplified).
2. In `GreeceBoundaryMap`, listen for zoom events:
   ```js
   const [zoomLevel, setZoomLevel] = useState(GREECE_ZOOM);
   // Inside the BaseMap ref or a new onZoomChange prop, set zoomLevel.
   // Then switch polygonLayers based on zoomLevel:
   const polygonLayers = zoomLevel >= 9 ? municipalityLayers : peripheryLayers;
   ```

## File locations

| File | Purpose |
|------|---------|
| `public/data/greece-regions.geojson` | Fallback simplified polygon data (13 peripheries) — used only when no location `boundary_geojson` is set |
| `config/map-data/regions.metadata.json` | Political region metadata (stable `id`, `capital`, `totalSeats`, district joins, location link hints) |
| `config/map-data/electoral-districts.metadata.json` | Electoral district metadata (`id`, `regionId`, `seats`, location link hints) |
| `config/map-data/regions.geojson` | Region polygon FeatureCollection for political explorer (join key `id`) |
| `config/map-data/electoral-districts.geojson` | Electoral district placeholder polygon FeatureCollection (join keys `id` + `regionId`) |
| `components/map/BaseMap.js` | Core Leaflet wrapper; `polygonLayers` prop drives interactivity |
| `components/map/GreeceBoundaryMap.js` | Homepage boundary map — prefers per-location `boundary_geojson`, falls back to static file |
| `components/locations/ExploreLocationsMap.js` | Wrapper used by `app/page.js`; renders `GreeceBoundaryMap` + prefecture pills |
| `components/political/AnalyticalMappingExplorer.js` | Reusable map+detail political explorer used by `/citizen-help/regions-electoral-map` |
