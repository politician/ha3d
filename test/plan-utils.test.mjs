import test from 'node:test';
import assert from 'node:assert/strict';
import { assertConfig, domainForEntity, markersForLayer, normalizePlan, serviceForMarker } from '../src/plan-utils.js';

const plan = {
  name: 'Demo apartment',
  floors: [{ id: 'ground', outline: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 5 }, { x: 0, y: 5 }], walls: [{ from: { x: 0, y: 0 }, to: { x: 8, y: 0 } }] }],
  entities: [
    { entity: 'light.kitchen', layer: 'lights', position: [2, 1.1, 2] },
    { entity: 'climate.living_room', layer: 'climate', position: [4, 1.1, 2], action: 'more-info' },
    { entity: 'cover.patio', layer: 'covers', position: [7, 1.1, 4] }
  ]
};

test('validates a complete card configuration', () => {
  assert.doesNotThrow(() => assertConfig({ type: 'custom:ha3d-floorplan-card', plan }));
});

test('rejects malformed entity ids and unsupported layers', () => {
  assert.throws(() => assertConfig({ type: 'custom:ha3d-floorplan-card', plan: { ...plan, entities: [{ entity: 'kitchen', layer: 'lights', position: [0, 0, 0] }] } }), /entity_id/);
  assert.throws(() => assertConfig({ type: 'custom:ha3d-floorplan-card', plan: { ...plan, entities: [{ entity: 'fan.office', layer: 'fans', position: [0, 0, 0] }] } }), /Unsupported/);
});

test('calculates stable bounds for camera framing', () => {
  assert.deepEqual(normalizePlan(plan).bounds, { minX: 0, maxX: 8, minY: 0, maxY: 5, width: 8, depth: 5, center: [4, 0, 2.5] });
});

test('filters markers by visualisation layer', () => {
  assert.equal(markersForLayer(plan.entities, 'lights').length, 1);
  assert.equal(markersForLayer(plan.entities, 'climate')[0].entity, 'climate.living_room');
});

test('maps entity domains to lightweight Home Assistant service calls', () => {
  assert.equal(domainForEntity('light.kitchen'), 'light');
  assert.deepEqual(serviceForMarker(plan.entities[0]), { domain: 'light', service: 'toggle' });
  assert.equal(serviceForMarker(plan.entities[1]), undefined);
});
