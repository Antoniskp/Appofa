const express = require('express');
const request = require('supertest');
const { sequelize, Location, LocationSection } = require('../src/models');

const app = express();
app.get('/cameras', require('../src/controllers/locationSectionController').getAllCameras);
let area, child;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  area = await Location.create({ name: 'Area', slug: 'camera-area', type: 'prefecture', lat: 38, lng: 23 });
  child = await Location.create({ name: 'Town', slug: 'camera-town', type: 'municipality', parent_id: area.id, lat: 38.1, lng: 23.1 });
  const grandchild = await Location.create({ name: 'Village', slug: 'camera-village', type: 'municipality', parent_id: child.id });
  const elsewhere = await Location.create({ name: 'Elsewhere', slug: 'camera-elsewhere', type: 'municipality' });
  await LocationSection.bulkCreate([
    { locationId: area.id, label: 'Area camera' },
    { locationId: child.id, label: 'Town camera', lat: 38.12, lng: 23.12, isWorking: false },
    { locationId: grandchild.id, label: 'Unmapped village camera' },
    { locationId: elsewhere.id, label: 'Other camera' },
    { locationId: child.id, label: 'Draft camera', isPublished: false },
  ].map(({ locationId, isPublished = true, ...camera }) => ({
    locationId, isPublished, type: 'webcams', content: { webcams: [{ ...camera, url: 'https://camera.example/live' }] },
  })));
});

afterAll(async () => { await sequelize.close(); });

test('location camera feed includes all descendants and excludes drafts and other areas', async () => {
  const response = await request(app).get('/cameras').query({ locationId: area.id });
  expect(response.status).toBe(200);
  expect(response.body.cameras.map(camera => camera.label).sort()).toEqual(['Area camera', 'Town camera', 'Unmapped village camera']);
  const exact = response.body.cameras.find(camera => camera.label === 'Town camera');
  expect(exact).toMatchObject({ isWorking: false, mapLocationSource: 'camera', mapLocation: { lat: 38.12, lng: 23.12 } });
  const fallback = response.body.cameras.find(camera => camera.label === 'Area camera');
  expect(fallback).toMatchObject({ mapLocationSource: 'sourceLocation', mapLocation: { lat: 38, lng: 23 } });
});

test('child camera feed excludes ancestor cameras and keeps unmapped descendant cameras', async () => {
  const response = await request(app).get('/cameras').query({ locationId: child.id });
  expect(response.body.cameras.map(camera => camera.label).sort()).toEqual(['Town camera', 'Unmapped village camera']);
});

test('global camera feed remains available without a location filter', async () => {
  const response = await request(app).get('/cameras');
  expect(response.status).toBe(200);
  expect(response.body.cameras).toHaveLength(4);
});

test.each(['bad', '', '0', '-1', '1.5'])('rejects invalid camera location %j', async locationId => {
  expect((await request(app).get('/cameras').query({ locationId })).status).toBe(400);
});
