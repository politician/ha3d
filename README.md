# HA3D Floorplan Card

HA3D is a HACS-ready Home Assistant Lovelace card that renders an AI-generated 3D floor plan with Three.js. It gives you clickable Home Assistant entity icons and fast layer switching for **Lights**, **Climate**, and **Covers**.

The project is inspired by excellent Home Assistant floor-plan work such as `home-assistant-floor-plan`, but it intentionally avoids Sweet Home 3D exports. Instead, you use the included assistant skill to generate lightweight plan YAML/JSON directly from photos, sketches, measurements, and entity IDs.

## Features

- Three.js renderer packaged as a custom Lovelace card: `custom:ha3d-floorplan-card`.
- Buttons above the model to switch visualisation/control layers: Lights, Climate, Covers.
- Clickable icons that call Home Assistant services or open more-info dialogs.
- AI-friendly schema for floor outlines, rooms, wall segments, materials, and markers.
- Browser-conscious defaults: capped pixel ratio, low-poly wall primitives, no heavy furniture assets.
- Reusable `ha3d-floorplan-generator` skill for Claude, GitHub Copilot Chat, ChatGPT, and similar assistants.

## Quick start

```bash
npm install
npm run validate
```

Install with HACS using the instructions in [`docs/INSTALLATION.md`](docs/INSTALLATION.md), then add a manual card using [`examples/demo-card.yaml`](examples/demo-card.yaml).

## Minimal card

```yaml
type: custom:ha3d-floorplan-card
title: Apartment 3D
plan:
  floors:
    - id: ground
      outline:
        - { x: 0, y: 0 }
        - { x: 8, y: 0 }
        - { x: 8, y: 5 }
        - { x: 0, y: 5 }
      walls:
        - { from: { x: 0, y: 0 }, to: { x: 8, y: 0 } }
  entities:
    - entity: light.living_room
      layer: lights
      icon: 💡
      position: [3, 1.15, 2.4]
```

## AI skill workflow

1. Add [`skills/ha3d-floorplan-generator/SKILL.md`](skills/ha3d-floorplan-generator/SKILL.md) to Claude, Copilot Chat, ChatGPT, or your preferred assistant.
2. Provide photos or a sketch, at least one measured dimension, and your `light.*`, `climate.*`, and `cover.*` entities.
3. Ask the assistant to produce Lovelace YAML for `custom:ha3d-floorplan-card`.
4. Paste the generated YAML into Home Assistant and iterate on marker positions.

## Documentation

- [Installation and HACS setup](docs/INSTALLATION.md)
- [Plan schema and performance guidance](docs/PLAN_SCHEMA.md)
- [Demo Lovelace card](examples/demo-card.yaml)
- [AI generation skill](skills/ha3d-floorplan-generator/SKILL.md)
