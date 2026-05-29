import { inferDomain } from './schema.mjs';

export function isOnState(state) {
  return state === 'on' || state === 'open' || state === 'opening' || state === 'heat' || state === 'cool' || state === 'heat_cool';
}

export function serviceForEntity(entity, hass) {
  const domain = entity.domain ?? inferDomain(entity.entity);
  if (entity.service) {
    const [configuredDomain, configuredService] = entity.service.includes('.') ? entity.service.split('.', 2) : [domain, entity.service];
    return { domain: configuredDomain, service: configuredService, data: { entity_id: entity.entity, ...entity.service_data } };
  }
  if (domain === 'light') return { domain, service: 'toggle', data: { entity_id: entity.entity, ...entity.service_data } };
  if (domain === 'cover') {
    const current = hass?.states?.[entity.entity]?.state;
    return { domain, service: current === 'open' ? 'close_cover' : 'open_cover', data: { entity_id: entity.entity, ...entity.service_data } };
  }
  return { domain: 'homeassistant', service: 'more_info', data: { entity_id: entity.entity } };
}

export async function activateEntity(entity, hass, eventTarget = globalThis.window) {
  if (!hass) return;
  const call = serviceForEntity(entity, hass);
  if (call.domain === 'homeassistant' && call.service === 'more_info') {
    eventTarget?.dispatchEvent?.(new CustomEvent('hass-more-info', { bubbles: true, composed: true, detail: { entityId: entity.entity } }));
    return;
  }
  await hass.callService(call.domain, call.service, call.data);
}
