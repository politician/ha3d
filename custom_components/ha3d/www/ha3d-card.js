import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";
import { SUPPORTED_LAYERS, getDefaultControlAction, getEntityVisibility, validatePlanData } from "./plan-utils.js";

const ROOM_COLOR = 0x223248;
const WALL_COLOR = 0xced8e2;
const LAYER_COLOR = {
  lights: 0xf9d849,
  climate: 0x42c5f5,
  covers: 0x6fd39d,
};

class Ha3dCard extends HTMLElement {
  setConfig(config) {
    if (!config.plan && !config.plan_url) {
      throw new Error("Provide 'plan' or 'plan_url' in card config.");
    }

    this._config = config;
    this._layerVisibility = { lights: true, climate: true, covers: true };
    this._mode = "visualize";

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
      this._renderBase();
      this._setupThree();
      this._wireToolbar();
    }
  }

  set hass(hass) {
    this._hass = hass;
    this._loadPlan();
    this._syncEntityStateStyles();
  }

  connectedCallback() {
    this._resizeObserver = new ResizeObserver(() => this._resizeRenderer());
    this._resizeObserver.observe(this);
  }

  disconnectedCallback() {
    this._resizeObserver?.disconnect();
    cancelAnimationFrame(this._raf);
  }

  _renderBase() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; }
        .toolbar { display:flex; gap:8px; align-items:center; margin-bottom:8px; flex-wrap: wrap; }
        .toolbar button { border:1px solid #6f7b88; border-radius:999px; background:#1f2730; color:#d8e5f2; padding:6px 12px; cursor:pointer; }
        .toolbar button.active { background:#2489ff; border-color:#2489ff; }
        #scene { width:100%; height:420px; border-radius:12px; overflow:hidden; background:#0f151d; }
      </style>
      <div class="toolbar">
        <button data-mode="visualize" class="active">Visualize</button>
        <button data-mode="control">Control</button>
        <button data-layer="lights" class="active">Lights</button>
        <button data-layer="climate" class="active">Climate</button>
        <button data-layer="covers" class="active">Covers</button>
      </div>
      <div id="scene"></div>
    `;
  }

  _setupThree() {
    this._container = this.shadowRoot.querySelector("#scene");
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0x0f151d);

    this._camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
    this._camera.position.set(10, 9, 10);

    this._renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    this._renderer.setSize(this._container.clientWidth || 640, this._container.clientHeight || 420);
    this._container.appendChild(this._renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    this._scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(4, 8, 6);
    this._scene.add(dir);

    this._target = new THREE.Vector3(0, 0, 0);
    this._markerGroup = new THREE.Group();
    this._structureGroup = new THREE.Group();
    this._geometryCache = {
      marker: new THREE.SphereGeometry(0.18, 12, 12),
      room: new THREE.BufferGeometry(),
      wall: new THREE.BoxGeometry(1, 1, 1),
    };
    this._scene.add(this._structureGroup);
    this._scene.add(this._markerGroup);

    this._raycaster = new THREE.Raycaster();
    this._pointer = new THREE.Vector2();
    this._container.addEventListener("click", (event) => this._onSceneClick(event));

    this._animate();
  }

  _wireToolbar() {
    this.shadowRoot.querySelectorAll("button[data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this._mode = btn.dataset.mode;
        this.shadowRoot.querySelectorAll("button[data-mode]").forEach((el) => {
          el.classList.toggle("active", el.dataset.mode === this._mode);
        });
      });
    });

    this.shadowRoot.querySelectorAll("button[data-layer]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const layer = btn.dataset.layer;
        this._layerVisibility[layer] = !this._layerVisibility[layer];
        btn.classList.toggle("active", this._layerVisibility[layer]);
        this._applyLayerVisibility();
      });
    });
  }

  async _loadPlan() {
    if (this._loadedOnce && !this._config?.refresh_on_state_change) return;
    this._loadedOnce = true;

    let plan = this._config.plan;
    if (!plan && this._config.plan_url) {
      const response = await fetch(this._config.plan_url);
      if (!response.ok) throw new Error(`Failed to load plan_url: ${this._config.plan_url}`);
      plan = await response.json();
    }

    const errors = validatePlanData(plan);
    if (errors.length) {
      throw new Error(`HA3D schema error: ${errors.join("; ")}`);
    }

    this._plan = plan;
    this._rebuildScene();
  }

  _rebuildScene() {
    this._structureGroup.clear();

    this._buildRooms(this._plan.rooms || []);
    this._buildWalls(this._plan.walls || []);
    this._buildMarkers(this._plan.entities || []);

    const [cx, cy, cz] = this._plan.camera.target;
    const [px, py, pz] = this._plan.camera.position;
    this._target.set(cx, cy, cz);
    this._camera.position.set(px, py, pz);
    this._camera.lookAt(this._target);
    this._applyLayerVisibility();
  }

  _buildRooms(rooms) {
    for (const room of rooms) {
      const shape = new THREE.Shape(room.polygon.map(([x, z]) => new THREE.Vector2(x, z)));
      const geometry = new THREE.ShapeGeometry(shape);
      const material = new THREE.MeshStandardMaterial({ color: ROOM_COLOR, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0;
      this._structureGroup.add(mesh);
    }
  }

  _buildWalls(walls) {
    for (const wall of walls) {
      const [x1, z1] = wall.from;
      const [x2, z2] = wall.to;
      const dx = x2 - x1;
      const dz = z2 - z1;
      const length = Math.sqrt(dx * dx + dz * dz);
      const thickness = wall.thickness || 0.12;
      const height = wall.height || 2.6;

      const wallMesh = new THREE.Mesh(
        new THREE.BoxGeometry(length, height, thickness),
        new THREE.MeshStandardMaterial({ color: WALL_COLOR })
      );
      wallMesh.position.set((x1 + x2) / 2, height / 2, (z1 + z2) / 2);
      wallMesh.rotation.y = Math.atan2(dz, dx);
      this._structureGroup.add(wallMesh);
    }
  }

  _buildMarkers(entities) {
    this._markerGroup.clear();
    this._markers = [];

    for (const entity of entities) {
      const marker = new THREE.Mesh(
        this._geometryCache.marker,
        new THREE.MeshStandardMaterial({ color: LAYER_COLOR[entity.layer] || 0xffffff })
      );
      marker.position.set(entity.position[0], entity.position[1], entity.position[2]);
      marker.userData = { entity };
      this._markerGroup.add(marker);
      this._markers.push(marker);
    }
  }

  _applyLayerVisibility() {
    for (const marker of this._markers || []) {
      marker.visible = getEntityVisibility(marker.userData.entity, this._layerVisibility);
    }
  }

  _syncEntityStateStyles() {
    if (!this._hass || !this._markers) return;

    for (const marker of this._markers) {
      const entityId = marker.userData.entity.entity_id;
      const state = this._hass.states[entityId];
      const layer = marker.userData.entity.layer;
      const isOn = state && !["off", "unavailable", "unknown", "closed"].includes(state.state);
      marker.material.emissive = new THREE.Color(isOn ? LAYER_COLOR[layer] : 0x111111);
      marker.material.emissiveIntensity = isOn ? 0.7 : 0.1;
    }
  }

  _onSceneClick(event) {
    const rect = this._renderer.domElement.getBoundingClientRect();
    this._pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this._pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this._raycaster.setFromCamera(this._pointer, this._camera);

    const hits = this._raycaster.intersectObjects(this._markers || [], false);
    if (!hits.length || !this._hass) return;

    const entity = hits[0].object.userData.entity;
    if (this._mode === "visualize") {
      this.dispatchEvent(
        new CustomEvent("hass-more-info", {
          bubbles: true,
          composed: true,
          detail: { entityId: entity.entity_id },
        })
      );
      return;
    }

    const action = entity.control || getDefaultControlAction(entity.entity_id);
    if (!action) return;

    const data = { ...(action.data || {}), entity_id: entity.entity_id };
    this._hass.callService(action.domain, action.service, data);
  }

  _resizeRenderer() {
    if (!this._renderer || !this._container) return;
    const width = this._container.clientWidth || 640;
    const height = this._container.clientHeight || 420;
    this._renderer.setSize(width, height, false);
    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();
  }

  _animate() {
    this._raf = requestAnimationFrame(() => this._animate());
    this._camera.lookAt(this._target);
    this._renderer.render(this._scene, this._camera);
  }

  static getStubConfig() {
    return {
      type: "custom:ha3d-card",
      plan_url: "/local/community/ha3d/examples/sample_plan.json",
    };
  }

  getCardSize() {
    return 5;
  }
}

customElements.define("ha3d-card", Ha3dCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "ha3d-card",
  name: "HA3D",
  description: "AI-assisted 3D floor plan with entity controls",
});
