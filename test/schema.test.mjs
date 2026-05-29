import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inferLayer, mergeConfig, normalizePlan } from '../src/schema.mjs';

const plan = {
  version: 1,
  rooms: [{ id: 'living', name: 'Living', x: 0, z: 0, width: 4, depth: 3 }],
  entities: [
    { entity: 'light.living', position: { x: 1, z: 1 } },
    { entity: 'climate.living', position: { x: 2, z: 1 } },
    { entity: 'cover.blinds', position: { x: 3, z: 1 } },
  ],
};

describe('plan schema helpers', () => {
  it('infers layers from entity domains', () => {
    assert.equal(inferLayer({ entity: 'light.kitchen' }), 'lights');
    assert.equal(inferLayer({ entity: 'climate.hall' }), 'climate');
    assert.equal(inferLayer({ entity: 'cover.bedroom' }), 'covers');
  });

  it('normalizes room defaults and entity positions', () => {
    const normalized = normalizePlan(plan);
    assert.equal(normalized.unit, 'm');
    assert.equal(normalized.rooms[0].height, 2.7);
    assert.deepEqual(normalized.entities.map((entity) => entity.layer), ['lights', 'climate', 'covers']);
    assert.equal(normalized.entities[0].position.y, 0.22);
  });

  it('rejects duplicate rooms and invalid dimensions', () => {
    assert.throws(() => normalizePlan({ ...plan, rooms: [{ id: 'x', name: 'A', x: 0, z: 0, width: 0, depth: 1 }] }), /positive width/);
    assert.throws(() => normalizePlan({ ...plan, rooms: [plan.rooms[0], plan.rooms[0]] }), /Duplicate/);
  });

  it('merges card defaults', () => {
    const config = mergeConfig({ type: 'custom:ha3d-floor-plan-card', height: '640px' });
    assert.equal(config.height, '640px');
    assert.equal(config.default_layer, 'lights');
    assert.equal(config.show_layer_buttons, true);
  });
});
