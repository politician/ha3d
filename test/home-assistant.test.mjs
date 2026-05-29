import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { isOnState, serviceForEntity, activateEntity } from '../src/home-assistant.mjs';

describe('Home Assistant integration helpers', () => {
  it('detects active states across supported domains', () => {
    assert.equal(isOnState('on'), true);
    assert.equal(isOnState('open'), true);
    assert.equal(isOnState('heat'), true);
    assert.equal(isOnState('off'), false);
  });

  it('builds light and cover service calls', () => {
    const hass = { states: { 'cover.blinds': { state: 'open' } }, callService: mock.fn() };
    assert.deepEqual(serviceForEntity({ entity: 'light.lamp', position: { x: 0, z: 0 } }, hass), { domain: 'light', service: 'toggle', data: { entity_id: 'light.lamp' } });
    assert.deepEqual(serviceForEntity({ entity: 'cover.blinds', position: { x: 0, z: 0 } }, hass), { domain: 'cover', service: 'close_cover', data: { entity_id: 'cover.blinds' } });
  });

  it('honors service overrides', () => {
    assert.deepEqual(serviceForEntity({ entity: 'light.lamp', service: 'turn_on', service_data: { brightness_pct: 50 }, position: { x: 0, z: 0 } }), {
      domain: 'light',
      service: 'turn_on',
      data: { entity_id: 'light.lamp', brightness_pct: 50 },
    });
  });

  it('calls Home Assistant services for actionable entities', async () => {
    const hass = { states: {}, callService: mock.fn(async () => undefined) };
    await activateEntity({ entity: 'light.lamp', position: { x: 0, z: 0 } }, hass);
    assert.equal(hass.callService.mock.calls.length, 1);
    assert.deepEqual(hass.callService.mock.calls[0].arguments, ['light', 'toggle', { entity_id: 'light.lamp' }]);
  });
});
