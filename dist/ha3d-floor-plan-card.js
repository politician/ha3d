/* HA3D Floor Plan Card v0.1.0 | MIT License | https://github.com/ */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const CARD_VERSION = '0.1.0';
const LAYERS = ['lights', 'climate', 'covers'];
const DOMAIN_TO_LAYER = { light: 'lights', climate: 'climate', cover: 'covers' };
const DEFAULT_PLAN = {
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

function inferDomain(entityId) { return String(entityId).split('.')[0] ?? ''; }
function inferLayer(entity) { return entity.layer || DOMAIN_TO_LAYER[entity.domain ?? inferDomain(entity.entity)] || 'lights'; }
function normalizeEntity(entity) {
  const domain = entity.domain ?? inferDomain(entity.entity);
  return { ...entity, domain, layer: inferLayer({ ...entity, domain }), position: { x: Number(entity.position.x), y: Number(entity.position.y ?? 0.22), z: Number(entity.position.z) } };
}
function normalizePlan(plan) {
  if (plan.version !== 1) throw new Error(`Unsupported HA3D plan version: ${String(plan.version)}`);
  const roomIds = new Set();
  return {
    ...plan,
    unit: plan.unit ?? 'm',
    rooms: plan.rooms.map((room) => {
      if (!room.id || roomIds.has(room.id)) throw new Error(`Duplicate or missing room id: ${room.id}`);
      if (room.width <= 0 || room.depth <= 0) throw new Error(`Room ${room.id} must have positive width and depth`);
      roomIds.add(room.id);
      return { height: 2.7, floorColor: room.color ?? '#d8d2c4', wallColor: '#f3eee5', ...room };
    }),
    entities: plan.entities.map(normalizeEntity),
  };
}
function mergeConfig(config) { return { height: '520px', default_layer: 'lights', show_layer_buttons: true, auto_rotate: false, ...config }; }
function getLayerLabel(layer) { return layer === 'lights' ? 'Lights' : layer === 'climate' ? 'Climate' : 'Covers'; }
function isOnState(state) { return state === 'on' || state === 'open' || state === 'opening' || state === 'heat' || state === 'cool' || state === 'heat_cool'; }
function serviceForEntity(entity, hass) {
  const domain = entity.domain ?? inferDomain(entity.entity);
  if (entity.service) {
    const [configuredDomain, configuredService] = entity.service.includes('.') ? entity.service.split('.', 2) : [domain, entity.service];
    return { domain: configuredDomain, service: configuredService, data: { entity_id: entity.entity, ...entity.service_data } };
  }
  if (domain === 'light') return { domain, service: 'toggle', data: { entity_id: entity.entity, ...entity.service_data } };
  if (domain === 'cover') return { domain, service: hass?.states?.[entity.entity]?.state === 'open' ? 'close_cover' : 'open_cover', data: { entity_id: entity.entity, ...entity.service_data } };
  return { domain: 'homeassistant', service: 'more_info', data: { entity_id: entity.entity } };
}
async function activateEntity(entity, hass, eventTarget = window) {
  if (!hass) return;
  const call = serviceForEntity(entity, hass);
  if (call.domain === 'homeassistant' && call.service === 'more_info') {
    eventTarget.dispatchEvent(new CustomEvent('hass-more-info', { bubbles: true, composed: true, detail: { entityId: entity.entity } }));
    return;
  }
  await hass.callService(call.domain, call.service, call.data);
}

class Ha3dFloorPlanCard extends HTMLElement {
  constructor() {
    super();
    this.config = mergeConfig({ type: 'custom:ha3d-floor-plan-card' });
    this.root = this.attachShadow({ mode: 'open' });
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.markers = [];
    this.activeLayer = 'lights';
    this.plan = normalizePlan(DEFAULT_PLAN);
    this.isDragging = false;
    this.lastPointer = { x: 0, y: 0 };
    this.yaw = -0.75;
    this.pitch = 0.82;
    this.radius = 11;
  }

  setConfig(config) {
    this.config = mergeConfig(config);
    this.activeLayer = this.config.default_layer;
    if (config.plan) this.plan = normalizePlan(config.plan);
    else if (!config.plan_url) this.plan = normalizePlan(DEFAULT_PLAN);
    this.renderShell();
    this.loadPlanUrl();
  }

  set hass(hass) {
    this.hassValue = hass;
    this.updateMarkerStates();
  }

  getCardSize() { return 6; }
  connectedCallback() { this.renderShell(); }
  disconnectedCallback() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    this.renderer?.dispose();
    this.markers = [];
  }

  async loadPlanUrl() {
    if (!this.config.plan_url) { this.rebuildScene(); return; }
    const response = await fetch(this.config.plan_url, { credentials: 'same-origin' });
    if (!response.ok) throw new Error(`Unable to fetch HA3D plan from ${this.config.plan_url}`);
    this.plan = normalizePlan(await response.json());
    this.rebuildScene();
  }

  renderShell() {
    if (!this.root.querySelector('.card')) {
      this.root.innerHTML = `
        <style>
          :host { display: block; --ha3d-accent: var(--primary-color, #03a9f4); }
          .card { background: var(--ha-card-background, var(--card-background-color, #fff)); border-radius: var(--ha-card-border-radius, 12px); box-shadow: var(--ha-card-box-shadow, none); border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, rgba(0,0,0,.12)); overflow: hidden; color: var(--primary-text-color, #1f2933); }
          header { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px 16px 8px; }
          h2 { margin: 0; font: inherit; font-size: 18px; font-weight: 600; }
          .layers { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 16px 12px; }
          button { border: 1px solid color-mix(in srgb, var(--ha3d-accent), transparent 50%); background: transparent; color: inherit; border-radius: 999px; padding: 6px 12px; cursor: pointer; font: inherit; transition: background .16s ease, transform .16s ease; }
          button:hover, button[aria-pressed="true"] { background: color-mix(in srgb, var(--ha3d-accent), transparent 82%); }
          button:focus-visible { outline: 2px solid var(--ha3d-accent); outline-offset: 2px; }
          .viewport { position: relative; width: 100%; min-height: 320px; background: radial-gradient(circle at 50% 0%, rgba(3,169,244,.18), transparent 42%), linear-gradient(180deg, rgba(120,144,156,.14), rgba(69,90,100,.08)); touch-action: none; }
          canvas { display: block; width: 100%; height: 100%; }
          .hint { position: absolute; right: 12px; bottom: 10px; padding: 5px 8px; border-radius: 999px; background: rgba(0,0,0,.42); color: white; font-size: 12px; pointer-events: none; }
        </style>
        <ha-card class="card">
          <header><h2></h2></header>
          <div class="layers" role="toolbar" aria-label="3D floor plan layers"></div>
          <div class="viewport" aria-label="Interactive 3D floor plan"><span class="hint">Drag to orbit · click icons</span></div>
        </ha-card>`;
    }
    this.root.querySelector('h2').textContent = this.config.title ?? this.plan.name ?? '3D floor plan';
    const layerBar = this.root.querySelector('.layers');
    layerBar.hidden = this.config.show_layer_buttons === false;
    layerBar.innerHTML = LAYERS.map((layer) => `<button type="button" data-layer="${layer}" aria-pressed="${String(layer === this.activeLayer)}">${getLayerLabel(layer)}</button>`).join('');
    layerBar.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => this.setLayer(button.dataset.layer)));
    const viewport = this.root.querySelector('.viewport');
    viewport.style.height = this.config.height;
    if (!this.renderer) this.initThree(viewport);
  }

  initThree(viewport) {
    this.scene = new THREE.Scene();
    this.scene.background = null;
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    viewport.append(this.renderer.domElement);
    viewport.addEventListener('pointerdown', this.onPointerDown.bind(this));
    viewport.addEventListener('pointermove', this.onPointerMove.bind(this));
    viewport.addEventListener('pointerup', this.onPointerUp.bind(this));
    viewport.addEventListener('pointerleave', this.onPointerUp.bind(this));
    viewport.addEventListener('click', this.onClick.bind(this));
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(viewport);
    this.rebuildScene();
    this.animate();
  }

  rebuildScene() {
    if (!this.scene) return;
    this.scene.clear();
    this.markers = [];
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.72));
    const sun = new THREE.DirectionalLight(0xffffff, 1.35);
    sun.position.set(5, 9, 6);
    sun.castShadow = true;
    this.scene.add(sun);
    const extents = this.getExtents();
    const base = new THREE.Mesh(new THREE.BoxGeometry(extents.width + 1.2, 0.08, extents.depth + 1.2), new THREE.MeshStandardMaterial({ color: '#a8b0b6', roughness: 0.9 }));
    base.position.set(extents.centerX, -0.07, extents.centerZ);
    base.receiveShadow = true;
    this.scene.add(base);
    for (const room of this.plan.rooms) {
      const floor = new THREE.Mesh(new THREE.BoxGeometry(room.width, 0.08, room.depth), new THREE.MeshStandardMaterial({ color: room.floorColor ?? room.color ?? '#d8d2c4', roughness: 0.82 }));
      floor.position.set(room.x + room.width / 2, 0, room.z + room.depth / 2);
      floor.receiveShadow = true;
      this.scene.add(floor);
      this.addWalls(room.x, room.z, room.width, room.depth, room.height ?? 2.7, room.wallColor ?? '#f3eee5');
    }
    for (const entity of this.plan.entities) this.addEntityMarker(entity);
    this.radius = Math.max(extents.width, extents.depth) * 1.25 + 3;
    this.updateCamera();
    this.updateLayerVisibility();
    this.updateMarkerStates();
    this.resize();
  }

  addWalls(x, z, width, depth, height, color) {
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.86, transparent: true, opacity: 0.92 });
    const wallSpecs = [[x + width / 2, z, width, 0.12], [x + width / 2, z + depth, width, 0.12], [x, z + depth / 2, 0.12, depth], [x + width, z + depth / 2, 0.12, depth]];
    for (const [wallX, wallZ, wallW, wallD] of wallSpecs) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(wallW, height, wallD), material);
      wall.position.set(wallX, height / 2, wallZ);
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.scene.add(wall);
    }
  }

  addEntityMarker(entity) {
    const color = entity.layer === 'lights' ? '#ffd166' : entity.layer === 'climate' ? '#4cc9f0' : '#80ed99';
    const group = new THREE.Group();
    group.position.set(entity.position.x, entity.position.y ?? 0.22, entity.position.z);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 12), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18 }));
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.35 }));
    body.userData.entity = entity.entity;
    group.add(halo, body);
    this.scene.add(group);
    this.markers.push({ entity, group, halo, body });
  }

  getExtents() {
    const minX = Math.min(...this.plan.rooms.map((room) => room.x));
    const minZ = Math.min(...this.plan.rooms.map((room) => room.z));
    const maxX = Math.max(...this.plan.rooms.map((room) => room.x + room.width));
    const maxZ = Math.max(...this.plan.rooms.map((room) => room.z + room.depth));
    return { centerX: (minX + maxX) / 2, centerZ: (minZ + maxZ) / 2, width: maxX - minX, depth: maxZ - minZ };
  }

  setLayer(layer) { this.activeLayer = layer; this.renderShell(); this.updateLayerVisibility(); }
  updateLayerVisibility() { for (const marker of this.markers) marker.group.visible = marker.entity.layer === this.activeLayer; }
  updateMarkerStates() {
    for (const marker of this.markers) {
      const enabled = isOnState(this.hassValue?.states?.[marker.entity.entity]?.state);
      marker.halo.material.opacity = enabled ? 0.34 : 0.1;
      marker.body.scale.setScalar(enabled ? 1.18 : 0.86);
    }
  }

  resize() {
    const viewport = this.root.querySelector('.viewport');
    if (!viewport || !this.renderer || !this.camera) return;
    const width = Math.max(viewport.clientWidth, 1);
    const height = Math.max(viewport.clientHeight, 1);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  updateCamera() {
    if (!this.camera) return;
    const extents = this.getExtents();
    const x = extents.centerX + Math.cos(this.yaw) * Math.cos(this.pitch) * this.radius;
    const y = Math.sin(this.pitch) * this.radius;
    const z = extents.centerZ + Math.sin(this.yaw) * Math.cos(this.pitch) * this.radius;
    this.camera.position.set(this.config.camera?.x ?? x, this.config.camera?.y ?? y, this.config.camera?.z ?? z);
    this.camera.lookAt(extents.centerX, 0, extents.centerZ);
  }

  animate() {
    this.frame = requestAnimationFrame(() => this.animate());
    if (this.config.auto_rotate) this.yaw += 0.002;
    this.updateCamera();
    if (this.renderer && this.scene && this.camera) this.renderer.render(this.scene, this.camera);
  }

  onPointerDown(event) { this.isDragging = true; this.lastPointer = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }
  onPointerMove(event) {
    if (!this.isDragging) return;
    const dx = event.clientX - this.lastPointer.x;
    const dy = event.clientY - this.lastPointer.y;
    this.lastPointer = { x: event.clientX, y: event.clientY };
    this.yaw -= dx * 0.006;
    this.pitch = Math.min(1.22, Math.max(0.35, this.pitch + dy * 0.004));
  }
  onPointerUp(event) { this.isDragging = false; if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }
  onClick(event) {
    if (!this.renderer || !this.camera) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.markers.filter((marker) => marker.group.visible).map((marker) => marker.body), false)[0];
    const entityId = hit?.object.userData.entity;
    const entity = this.markers.find((marker) => marker.entity.entity === entityId)?.entity;
    if (entity) activateEntity(entity, this.hassValue, this);
  }
}

customElements.define('ha3d-floor-plan-card', Ha3dFloorPlanCard);
window.customCards = window.customCards ?? [];
window.customCards.push({ type: 'ha3d-floor-plan-card', name: 'HA3D Floor Plan Card', description: 'AI-generated Three.js 3D floor plan with clickable Home Assistant entities.', preview: true });
console.info(`%c HA3D Floor Plan Card %c ${CARD_VERSION} `, 'color: #fff; background: #03a9f4; font-weight: 700;', 'color: #03a9f4; background: transparent;');
