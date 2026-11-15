const express = require('express');
const request = require('supertest');
const districts = require('../config/map-data/electoral-districts.metadata.json').electoralDistricts;

const app = express();
// Exercise the real backend registry: production nginx bypasses Next API routes.
require('../src/routes')(app);

test('the backend serves every electoral boundary to signed-out visitors', async () => {
  const response = await request(app).get('/api/electoral-districts').expect(200);
  expect(response.headers['content-type']).toMatch(/^application\/geo\+json/);
  expect(response.headers['cache-control']).toContain('public, max-age=3600');
  const geojson = JSON.parse(response.text);
  expect(geojson.type).toBe('FeatureCollection');
  expect(geojson.features.map(feature => feature.properties.id).sort()).toEqual(districts.map(district => district.id).sort());
  expect(geojson.features.every(feature => ['Polygon', 'MultiPolygon'].includes(feature.geometry.type))).toBe(true);
});

test('the backend supports conditional requests for electoral boundaries', async () => {
  const initial = await request(app).get('/api/electoral-districts').expect(200);
  expect(initial.headers.etag).toBeTruthy();
  await request(app).get('/api/electoral-districts').set('If-None-Match', initial.headers.etag).expect(304);
});
