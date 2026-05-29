# HA3D Floor Plan Card

HA3D is a HACS-ready Home Assistant Lovelace card that renders an AI-generated 3D floor plan with Three.js. It is inspired by the excellent Sweet Home 3D based Home Assistant floor-plan workflows, but HA3D intentionally skips Sweet Home 3D and pre-rendered image stacks: an assistant such as Claude, Copilot, ChatGPT, or Codex generates a small JSON scene from your photos, sketches, measurements, and Home Assistant entity list, then the browser renders it live.

## Highlights

- **HACS frontend plugin**: install as a custom repository and add one Lovelace resource.
- **Three.js rendering**: compact geometry, capped pixel ratio, no heavy textures by default, and a single browser module.
- **Clickable Home Assistant icons**: lights toggle, covers open/close, and climate markers open the entity details dialog.
- **Layer buttons above the plan**: switch between **Lights**, **Climate**, and **Covers** controls without changing dashboards.
- **AI skill included**: `skills/ha3d-floor-plan/SKILL.md` gives Claude/Copilot/ChatGPT/Codex a repeatable workflow for producing valid HA3D JSON.

## Installation with HACS

1. In Home Assistant, open **HACS → Frontend → ⋮ → Custom repositories**.
2. Add this repository URL and choose category **Lovelace**.
3. Install **HA3D Floor Plan Card**.
4. Add the resource if HACS does not add it automatically:

   ```yaml
   url: /hacsfiles/ha3d/ha3d-floor-plan-card.js
   type: module
   ```

5. Refresh the browser cache.

## Quick start

Copy a generated or example plan to Home Assistant:

```text
/config/www/ha3d/ground-floor.json
```

Add the card to a dashboard:

```yaml
type: custom:ha3d-floor-plan-card
title: Ground floor
plan_url: /local/ha3d/ground-floor.json
height: 560px
default_layer: lights
show_layer_buttons: true
auto_rotate: false
```

You can also inline the plan with a `plan:` object if you prefer to keep everything in dashboard YAML.

## Using the AI skill

The repo contains a portable skill at [`skills/ha3d-floor-plan/SKILL.md`](skills/ha3d-floor-plan/SKILL.md). Use it with your assistant of choice:

### Claude

1. Create a Claude Project.
2. Add `skills/ha3d-floor-plan/SKILL.md` to the project instructions or knowledge.
3. Upload room photos/sketches and paste your Home Assistant entity list.
4. Ask: “Generate a HA3D plan JSON and Lovelace YAML.”

### GitHub Copilot / VS Code

1. Copy `skills/ha3d-floor-plan/SKILL.md` into your workspace docs or prompt file.
2. Add photos/sketches as references and paste entity lists into the chat.
3. Ask Copilot to create `/config/www/ha3d/ground-floor.json` from the skill.

### ChatGPT / Codex

1. Paste the skill instructions or attach the skill file.
2. Upload photos/sketches and measurements.
3. Ask for strict JSON that matches `docs/plan-schema.md` plus the Lovelace YAML snippet.

## Plan JSON

See [`docs/plan-schema.md`](docs/plan-schema.md) and [`examples/simple-plan.json`](examples/simple-plan.json). Minimal example:

```json
{
  "version": 1,
  "unit": "m",
  "name": "Ground floor",
  "rooms": [
    { "id": "living", "name": "Living room", "x": 0, "z": 0, "width": 5.2, "depth": 4.2, "color": "#d7c7ad" }
  ],
  "entities": [
    { "entity": "light.living_room", "name": "Living lamp", "position": { "x": 2.6, "z": 2.1 } }
  ]
}
```

## Card options

| Option | Required | Default | Description |
| --- | --- | --- | --- |
| `type` | Yes | — | `custom:ha3d-floor-plan-card` |
| `title` | No | Plan name | Card title. |
| `plan_url` | No | — | URL to a JSON plan, for example `/local/ha3d/ground-floor.json`. |
| `plan` | No | Demo plan | Inline plan object. |
| `height` | No | `520px` | Viewport height. |
| `default_layer` | No | `lights` | One of `lights`, `climate`, `covers`. |
| `show_layer_buttons` | No | `true` | Show the layer toolbar above the 3D view. |
| `auto_rotate` | No | `false` | Slowly orbit the camera when idle. |
| `camera` | No | Auto | Optional fixed `{ x, y, z }` camera override. |

## Performance notes

- The card loads Three.js as an ES module and renders simple geometry rather than many static images.
- Pixel ratio is capped at `2` to protect mobile browsers.
- Plans should remain simple: rectangular rooms, lightweight colors, and only meaningful clickable entities.
- Split very large homes into one card per floor to keep interaction smooth.

## Development

```bash
npm test
npm run lint
npm run build
```

The production bundle is written to `dist/ha3d-floor-plan-card.js` for HACS.
