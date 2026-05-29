const DOMAIN_TO_LAYER = {
  light: 'lights',
  climate: 'climate',
  cover: 'covers',
};

export const DEFAULT_PLAN = {
  version: 1,
  unit: 'm',
  name: 'Demo home',
  rooms: [
    { id: 'living', name: 'Living room', x: 0, z: 0, width: 5.2, depth: 4.2, color: '#d7c7ad' },
    { id: 'kitchen', name: 'Kitchen', x: 5.4, z: 0, width: 3.4, depth: 4.2, color: '#c7d3da' },
    { id: 'bedroom', name: 'Bedroom', x: 0, z: 4.4, width: 4.2, depth: 3.6, color: '#d8c4d8' },
  ],
  entities: [
    { entity: 'light.living_room', name: 'Living lamp', position: { x: 2.6, z: 2.1 } },
    { entity: 'climate.living_room', name: 'Thermostat', position: { x: 4.6, z: 3.4 } },
    { entity: 'cover.kitchen_blinds', name: 'Kitchen blinds', position: { x: 7.8, z: 0.4 } },
  ],
};

export function inferDomain(entityId) {
  return String(entityId).split('.')[0] ?? '';
}

export function inferLayer(entity) {
  if (entity.layer) return entity.layer;
  const domain = entity.domain ?? inferDomain(entity.entity);
  return DOMAIN_TO_LAYER[domain] ?? 'lights';
}

export function normalizeEntity(entity) {
  const domain = entity.domain ?? inferDomain(entity.entity);
  return {
    ...entity,
    domain,
    layer: inferLayer({ ...entity, domain }),
    position: {
      x: Number(entity.position.x),
      y: Number(entity.position.y ?? 0.22),
      z: Number(entity.position.z),
    },
  };
}

export function normalizePlan(plan) {
  if (plan.version !== 1) throw new Error(`Unsupported HA3D plan version: ${String(plan.version)}`);
  const roomIds = new Set();
  const rooms = plan.rooms.map((room) => {
    if (!room.id || roomIds.has(room.id)) throw new Error(`Duplicate or missing room id: ${room.id}`);
    if (room.width <= 0 || room.depth <= 0) throw new Error(`Room ${room.id} must have positive width and depth`);
    roomIds.add(room.id);
    return {
      height: 2.7,
      floorColor: room.color ?? '#d8d2c4',
      wallColor: '#f3eee5',
      ...room,
    };
  });
  return { ...plan, unit: plan.unit ?? 'm', rooms, entities: plan.entities.map(normalizeEntity) };
}

export function mergeConfig(config) {
  return {
    height: '520px',
    default_layer: 'lights',
    show_layer_buttons: true,
    auto_rotate: false,
    ...config,
  };
}

export function getLayerLabel(layer) {
  return layer === 'lights' ? 'Lights' : layer === 'climate' ? 'Climate' : 'Covers';
}
