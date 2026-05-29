---
name: ha3d-floor-plan
description: Generate, review, or refine HA3D Home Assistant Three.js floor plan JSON from user photos, sketches, measurements, and Home Assistant entity lists. Use when Claude, Copilot, ChatGPT, or Codex needs to turn home photos into a HACS HA3D card configuration with clickable Lights, Climate, and Covers layers.
---

# HA3D Floor Plan Skill

Use this skill to create a lightweight JSON scene for the `custom:ha3d-floor-plan-card` Home Assistant card.

## Inputs to request

Ask for only the missing critical items:

1. Photos or a sketch of each room, preferably from opposite corners.
2. At least one known measurement per room or a reliable scale reference.
3. A Home Assistant entity list grouped by room, especially `light.*`, `climate.*`, and `cover.*` entities.
4. Preferred unit: `m` or `ft`.

## Workflow

1. Infer a simple top-down layout using rectangular rooms first; avoid over-modeling details that would slow the browser.
2. Normalize coordinates so the first room starts near `{ "x": 0, "z": 0 }`.
3. Create one room object per room with `id`, `name`, `x`, `z`, `width`, `depth`, and a subtle `color`.
4. Place entities at intuitive positions inside their rooms. Use `x` and `z`; omit `y` unless the marker should float higher.
5. Infer layers from Home Assistant domains:
   - `light.*` -> `lights`
   - `climate.*` -> `climate`
   - `cover.*` -> `covers`
6. Return strict JSON matching schema version `1`, followed by a Lovelace YAML snippet.
7. Keep the scene efficient: fewer than 80 rooms/entities per card, no textures unless explicitly requested, and no generated binary assets.

## Output template

```json
{
  "version": 1,
  "unit": "m",
  "name": "Ground floor",
  "rooms": [
    { "id": "living", "name": "Living room", "x": 0, "z": 0, "width": 5.2, "depth": 4.2, "color": "#d7c7ad" }
  ],
  "entities": [
    { "entity": "light.living_room", "name": "Living lamp", "room": "living", "position": { "x": 2.6, "z": 2.1 } }
  ]
}
```

```yaml
type: custom:ha3d-floor-plan-card
title: Ground floor
plan_url: /local/ha3d/ground-floor.json
height: 560px
default_layer: lights
show_layer_buttons: true
```

## Quality checks

- Ensure every room has positive `width` and `depth`.
- Ensure each entity id contains a domain prefix and a dot.
- Keep markers inside their assigned room bounds unless there is a clear reason.
- Prefer approximate but coherent geometry over visually complex geometry.
