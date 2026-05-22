# Polygon Data for the Homepage Map

This document explains how polygon boundary data is sourced, structured, and replaced for the Appofa homepage map.

## Current implementation

The homepage `Εξερεύνησε Περιοχές` map uses **simplified polygon outlines for the 13 Greek peripheries** (administrative regions / περιφέρειες), stored in:

```
public/data/greece-regions.geojson
```

These polygons are:
- **Approximate**: hand-crafted approximations, not survey-grade boundaries.
- **Sufficient for discovery**: recognisable at the default zoom level (6) and clearly interactive.
- **Designed to be replaced**: the schema is stable so authoritative data can be dropped in without changing any component code.

## GeoJSON schema

Each feature has:

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

The `code` property is the join key for future choropleth coloring — map your vote or participation data to the same code and pass a `styleFeature(feature)` function to the polygon layer.

## Why peripheries, not electoral districts?

| Layer | Pros | Cons |
|-------|------|------|
| **Peripheries (13)** | Widely understood, stable since Kallikratis 2010, good administrative granularity, easy to find authoritative data | Not the same as electoral districts |
| **Electoral districts (56 single-seat + multi-seat)** | Directly maps to Parliament seats | More complex, change with redistricting, harder to source free/authoritative GeoJSON |
| **Municipalities (~330)** | Most local, aligns with location pages | Too many polygons at default zoom, file would be large |

**Recommendation**: use peripheries as the top-level layer, with municipalities as a drill-down layer (Phase 2). Electoral districts can be added as a parallel layer when needed — the architecture already supports multiple `polygonLayers`.

## How to replace with authoritative data

### Option 1 — ELSTAT / geodata.gov.gr (recommended for Greece)

The Hellenic Statistical Authority (ΕΛΣΤΑΤ) publishes official administrative boundaries:

1. Go to [geodata.gov.gr](https://geodata.gov.gr) (Greek open government data portal).
2. Search for "Καλλικρατικοί Δήμοι" or "Περιφέρειες".
3. Download the Shapefile (`.shp`) or GeoJSON for the layer you want.
4. If you downloaded a Shapefile, convert to GeoJSON:
   ```bash
   ogr2ogr -f GeoJSON output.geojson input.shp -t_srs EPSG:4326
   ```
5. Simplify the geometry to reduce file size (optional but recommended):
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
2. The file is pre-simplified and license-free for non-commercial use.
3. Map GADM column `NAME_1` → `name_en` and add the `code` column from ISO 3166-2.
4. Drop the file in `public/data/greece-regions.geojson`.

> ⚠️ GADM license: non-commercial use only.

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
| `public/data/greece-regions.geojson` | Starter simplified polygon data (13 peripheries) |
| `components/map/BaseMap.js` | Core Leaflet wrapper; `polygonLayers` prop drives interactivity |
| `components/map/GreeceBoundaryMap.js` | Homepage boundary map — loads GeoJSON, builds layers, renders info card |
| `components/locations/ExploreLocationsMap.js` | Thin wrapper used by `app/page.js`; delegates to `GreeceBoundaryMap` |
