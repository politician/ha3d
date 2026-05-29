export const HA3D_LAYERS = ['lights', 'climate', 'covers'];

export function assertConfig(config) {
  if (!config || typeof config !== 'object') throw new Error('HA3D requires a Lovelace card configuration object.');
  if (!config.plan || !Array.isArray(config.plan.floors) || config.plan.floors.length === 0) throw new Error('HA3D requires plan.floors with at least one floor.');
  if (!Array.isArray(config.plan.entities)) throw new Error('HA3D requires plan.entities, even if it is empty.');
  for (const marker of config.plan.entities) {
    if (!HA3D_LAYERS.includes(marker.layer)) throw new Error(`Unsupported HA3D layer "${marker.layer}" for ${marker.entity}.`);
    if (!marker.entity.includes('.')) throw new Error(`HA3D marker entity "${marker.entity}" must be a Home Assistant entity_id.`);
  }
}

export function normalizePlan(plan) {
  const points = plan.floors.flatMap((floor) => [
    ...floor.outline,
    ...(floor.rooms ?? []).flatMap((room) => room.polygon),
    ...(floor.walls ?? []).flatMap((wall) => [wall.from, wall.to])
  ]);
  if (points.length === 0) throw new Error('HA3D plan needs at least one outline, room, or wall point.');
  const bounds = points.reduce((acc, point) => {
    acc.minX = Math.min(acc.minX, point.x);
    acc.maxX = Math.max(acc.maxX, point.x);
    acc.minY = Math.min(acc.minY, point.y);
    acc.maxY = Math.max(acc.maxY, point.y);
    return acc;
  }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, width: 0, depth: 0, center: [0, 0, 0] });
  bounds.width = bounds.maxX - bounds.minX;
  bounds.depth = bounds.maxY - bounds.minY;
  bounds.center = [bounds.minX + bounds.width / 2, 0, bounds.minY + bounds.depth / 2];
  return { plan, bounds };
}

export function markersForLayer(markers, layer) {
  return markers.filter((marker) => marker.layer === layer);
}

export function domainForEntity(entityId) {
  return entityId.split('.')[0] ?? '';
}

export function serviceForMarker(marker) {
  if (marker.action === 'none' || marker.action === 'more-info') return undefined;
  return { domain: domainForEntity(marker.entity), service: 'toggle' };
}

export function layerLabel(layer) {
  return ({ lights: 'Lights', climate: 'Climate', covers: 'Covers' })[layer];
}

export function layerIcon(layer) {
  return ({ lights: '💡', climate: '🌡️', covers: '🪟' })[layer];
}
