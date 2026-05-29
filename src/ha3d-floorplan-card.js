const HA3D_LAYERS = ['lights', 'climate', 'covers'];

function assertConfig(config) {
  if (!config || typeof config !== 'object') throw new Error('HA3D requires a Lovelace card configuration object.');
  if (!config.plan || !Array.isArray(config.plan.floors) || config.plan.floors.length === 0) throw new Error('HA3D requires plan.floors with at least one floor.');
  if (!Array.isArray(config.plan.entities)) throw new Error('HA3D requires plan.entities, even if it is empty.');
  for (const marker of config.plan.entities) {
    if (!HA3D_LAYERS.includes(marker.layer)) throw new Error(`Unsupported HA3D layer "${marker.layer}" for ${marker.entity}.`);
    if (!marker.entity.includes('.')) throw new Error(`HA3D marker entity "${marker.entity}" must be a Home Assistant entity_id.`);
  }
}

function normalizePlan(plan) {
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

function markersForLayer(markers, layer) {
  return markers.filter((marker) => marker.layer === layer);
}

function domainForEntity(entityId) {
  return entityId.split('.')[0] ?? '';
}

function serviceForMarker(marker) {
  if (marker.action === 'none' || marker.action === 'more-info') return undefined;
  return { domain: domainForEntity(marker.entity), service: 'toggle' };
}

function layerLabel(layer) {
  return ({ lights: 'Lights', climate: 'Climate', covers: 'Covers' })[layer];
}

function layerIcon(layer) {
  return ({ lights: '💡', climate: '🌡️', covers: '🪟' })[layer];
}

const CARD_VERSION = '0.1.0';
const THREE_MODULE_URL = 'https://esm.sh/three@0.165.0';
const ORBIT_MODULE_URL = 'https://esm.sh/three@0.165.0/examples/jsm/controls/OrbitControls.js';
const DEFAULT_CAMERA = { position: [7, 8, 7], target: [0, 0, 0], fov: 45 };
const DEFAULT_PERFORMANCE = { pixel_ratio_cap: 1.5, shadows: true, antialias: true };

class Ha3dFloorplanCard extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    this.activeLayer = 'lights';
    this.projectedMarkers = new Map();
    this.animationFrame = 0;
  }

  setConfig(config) {
    assertConfig(config);
    this.config = config;
    this.activeLayer = config.default_layer ?? 'lights';
    this.normalized = normalizePlan(config.plan);
    this.renderShell();
    void this.buildScene();
  }

  set hass(hass) {
    this.hassValue = hass;
    this.updateMarkerStates();
  }

  getCardSize() { return 6; }

  disconnectedCallback() {
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver?.disconnect();
    this.controls?.dispose();
    this.renderer?.dispose();
  }

  renderShell() {
    const title = this.config?.title ?? this.config?.plan.name ?? 'HA3D Floorplan';
    this.root.innerHTML = `<style>${cardCss}</style><ha-card><header><div><p class="eyebrow">AI generated Three.js plan</p><h2>${escapeHtml(title)}</h2></div><span class="version">v${CARD_VERSION}</span></header><nav class="layers" aria-label="Floor plan layers">${['lights', 'climate', 'covers'].map((layer) => `<button type="button" data-layer="${layer}" class="${layer === this.activeLayer ? 'active' : ''}"><span aria-hidden="true">${layerIcon(layer)}</span>${layerLabel(layer)}</button>`).join('')}</nav><section class="stage" aria-label="3D Home Assistant floor plan"><div class="canvas-host"><p class="loading">Loading Three.js renderer…</p></div><div class="markers"></div><p class="hint">Drag to orbit, scroll to zoom, click icons.</p></section></ha-card>`;
    this.root.querySelectorAll('[data-layer]').forEach((button) => button.addEventListener('click', () => this.setActiveLayer(button.dataset.layer)));
    this.markerLayer = this.root.querySelector('.markers');
  }

  async buildScene() {
    const host = this.root.querySelector('.canvas-host');
    if (!host || !this.normalized || !this.config) return;
    const [{ default: THREE }, { OrbitControls }] = await Promise.all([import(THREE_MODULE_URL), import(ORBIT_MODULE_URL)]);
    this.THREE = THREE;
    host.innerHTML = '';
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf7fafc);
    this.scene.fog = new THREE.Fog(0xf7fafc, 30, 80);
    const performance = { ...DEFAULT_PERFORMANCE, ...this.config.performance };
    this.renderer = new THREE.WebGLRenderer({ antialias: performance.antialias, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, performance.pixel_ratio_cap));
    this.renderer.shadowMap.enabled = performance.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.append(this.renderer.domElement);
    const cameraConfig = { ...DEFAULT_CAMERA, ...this.config.camera };
    this.camera = new THREE.PerspectiveCamera(cameraConfig.fov, 1, 0.1, 200);
    this.camera.position.fromArray(cameraConfig.position);
    this.camera.lookAt(...cameraConfig.target);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.target.fromArray(cameraConfig.target);
    this.addLights();
    this.addPlanGeometry(this.normalized);
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
    this.renderMarkers();
    this.animate();
  }

  addLights() {
    const THREE = this.THREE;
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xa4b1c3, 2.1));
    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.set(6, 12, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    this.scene.add(sun);
  }

  addPlanGeometry({ plan }) {
    const THREE = this.THREE;
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72 });
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xe7edf5, roughness: 0.9 });
    const roomMaterials = new Map();
    plan.floors.forEach((floor) => {
      const elevation = floor.elevation ?? 0;
      this.scene.add(polygonMesh(THREE, floor.outline, elevation, floorMaterial));
      floor.rooms?.forEach((room) => {
        const materialKey = room.material ?? 'default-room';
        const material = roomMaterials.get(materialKey) ?? new THREE.MeshStandardMaterial({ color: plan.materials?.[materialKey]?.color ?? 0xdbeafe, transparent: true, opacity: plan.materials?.[materialKey]?.opacity ?? 0.72, roughness: plan.materials?.[materialKey]?.roughness ?? 0.84 });
        roomMaterials.set(materialKey, material);
        const mesh = polygonMesh(THREE, room.polygon, elevation + 0.012, material);
        mesh.name = room.name ?? room.id;
        this.scene.add(mesh);
      });
      floor.walls?.forEach((wall) => this.scene.add(wallMesh(THREE, wall.from.x, wall.from.y, wall.to.x, wall.to.y, wall.height ?? 2.7, wall.thickness ?? 0.12, elevation, wallMaterial)));
    });
  }

  renderMarkers() {
    if (!this.markerLayer || !this.config) return;
    this.markerLayer.innerHTML = '';
    this.projectedMarkers.clear();
    for (const marker of markersForLayer(this.config.plan.entities, this.activeLayer)) {
      const button = document.createElement('button');
      button.className = 'entity-marker';
      button.type = 'button';
      button.dataset.entity = marker.entity;
      button.textContent = marker.icon ?? layerIcon(marker.layer);
      button.title = marker.label ?? marker.entity;
      button.addEventListener('click', () => this.handleMarkerClick(marker));
      this.projectedMarkers.set(marker.entity, button);
      this.markerLayer.append(button);
    }
    this.updateMarkerStates();
    this.projectMarkers();
  }

  setActiveLayer(layer) {
    this.activeLayer = layer;
    this.root.querySelectorAll('[data-layer]').forEach((button) => button.classList.toggle('active', button.dataset.layer === layer));
    this.renderMarkers();
  }

  handleMarkerClick(marker) {
    if (marker.action === 'more-info') {
      this.dispatchEvent(new CustomEvent('hass-more-info', { bubbles: true, composed: true, detail: { entityId: marker.entity } }));
      return;
    }
    const service = serviceForMarker(marker);
    if (service) void this.hassValue?.callService(service.domain, service.service, { entity_id: marker.entity });
  }

  updateMarkerStates() {
    this.projectedMarkers.forEach((button, entityId) => {
      const state = this.hassValue?.states[entityId]?.state ?? 'unknown';
      button.dataset.state = state;
      button.setAttribute('aria-label', `${entityId}: ${state}`);
    });
  }

  resize() {
    const host = this.root.querySelector('.canvas-host');
    if (!host || !this.renderer || !this.camera) return;
    const width = Math.max(host.clientWidth, 320);
    const height = Math.max(host.clientHeight, 360);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  animate = () => {
    this.animationFrame = requestAnimationFrame(this.animate);
    this.controls?.update();
    this.renderer?.render(this.scene, this.camera);
    this.projectMarkers();
  };

  projectMarkers() {
    const THREE = this.THREE;
    if (!THREE || !this.camera || !this.renderer || !this.config) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    for (const marker of markersForLayer(this.config.plan.entities, this.activeLayer)) {
      const button = this.projectedMarkers.get(marker.entity);
      if (!button) continue;
      const vector = new THREE.Vector3(...marker.position).project(this.camera);
      button.style.transform = `translate(${((vector.x + 1) / 2) * rect.width}px, ${((-vector.y + 1) / 2) * rect.height}px)`;
      button.hidden = vector.z < -1 || vector.z > 1;
    }
  }
}

function polygonMesh(THREE, points, elevation, material) {
  const shape = new THREE.Shape(points.map((point) => new THREE.Vector2(point.x, point.y)));
  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, elevation, 0);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

function wallMesh(THREE, x1, y1, x2, y2, height, thickness, elevation, material) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const geometry = new THREE.BoxGeometry(length, height, thickness);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set((x1 + x2) / 2, elevation + height / 2, (y1 + y2) / 2);
  mesh.rotation.y = -Math.atan2(y2 - y1, x2 - x1);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

const cardCss = `:host{display:block}ha-card{overflow:hidden;background:linear-gradient(180deg,var(--ha-card-background,#fff),#f8fafc)}header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px 10px}h2{margin:0;font-size:1.25rem;line-height:1.2;color:var(--primary-text-color,#0f172a)}.eyebrow{margin:0 0 4px;text-transform:uppercase;letter-spacing:.08em;font-size:.68rem;color:var(--secondary-text-color,#64748b)}.version{font-size:.75rem;color:var(--secondary-text-color,#64748b)}.layers{display:flex;gap:8px;padding:0 20px 14px;overflow-x:auto}.layers button{border:1px solid rgba(148,163,184,.36);border-radius:999px;padding:8px 12px;background:rgba(255,255,255,.72);color:var(--primary-text-color,#0f172a);cursor:pointer;font-weight:650}.layers button.active{background:var(--primary-color,#2563eb);color:var(--text-primary-color,#fff);border-color:transparent;box-shadow:0 8px 22px rgba(37,99,235,.25)}.stage{position:relative;min-height:420px;border-top:1px solid rgba(148,163,184,.24)}.canvas-host{position:absolute;inset:0}.loading{display:grid;place-items:center;height:100%;margin:0;color:var(--secondary-text-color,#64748b)}canvas{display:block;width:100%;height:100%}.markers{position:absolute;inset:0;pointer-events:none}.entity-marker{position:absolute;left:0;top:0;width:38px;height:38px;margin:-19px;border:0;border-radius:999px;pointer-events:auto;cursor:pointer;background:var(--card-background-color,#fff);box-shadow:0 10px 26px rgba(15,23,42,.23);font-size:19px;transition:transform .12s ease,filter .12s ease,opacity .12s ease}.entity-marker:hover{filter:brightness(1.06)}.entity-marker[data-state="on"],.entity-marker[data-state="open"],.entity-marker[data-state="heat"],.entity-marker[data-state="cool"]{outline:3px solid rgba(34,197,94,.42)}.hint{position:absolute;right:12px;bottom:10px;margin:0;padding:6px 9px;border-radius:999px;background:rgba(15,23,42,.62);color:#fff;font-size:.72rem}`;

customElements.define('ha3d-floorplan-card', Ha3dFloorplanCard);
window.customCards = [...(window.customCards ?? []), { type: 'ha3d-floorplan-card', name: 'HA3D Floorplan Card', description: 'AI-generated Three.js floor plan with clickable Home Assistant layers.' }];

export { Ha3dFloorplanCard };
