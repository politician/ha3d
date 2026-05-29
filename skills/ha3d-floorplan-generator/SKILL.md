---
name: ha3d-floorplan-generator
description: Convert homeowner photos, sketches, measurements, and Home Assistant entity lists into an HA3D Floorplan Card plan JSON/YAML for Claude, GitHub Copilot Chat, ChatGPT, or any assistant that supports reusable skills/prompts.
---

# HA3D Floorplan Generator Skill

Use this skill when a user wants an AI assistant to create or refine a 3D floor plan for the `custom:ha3d-floorplan-card` Lovelace card.

## Inputs to request

1. Room photos or a sketch, preferably one wide-angle photo per room plus any hallway or exterior openings.
2. At least one known dimension per room or wall so the model can scale the plan.
3. A Home Assistant entity list grouped by layer:
   - `lights`: `light.*`
   - `climate`: `climate.*`
   - `covers`: `cover.*`
4. Optional: preferred room names, floor count, ceiling height, and icon labels.

## Output contract

Return only a valid Lovelace YAML fragment unless the user asks for an explanation. The top-level card must use:

```yaml
type: custom:ha3d-floorplan-card
plan:
  floors: []
  entities: []
```

Coordinates are meters. The HA3D renderer maps `x` to left/right, `y` to depth, and marker `position` to `[x, height, y]` in Three.js space.

## Generation workflow

1. Estimate a simple polygonal floor outline from the supplied photos/sketch.
2. Use straight wall segments first. Avoid tiny details that add triangles without improving recognisability.
3. Create one room polygon per major room.
4. Create wall segments with `height` around `2.6-2.8` and `thickness` around `0.10-0.16` unless measurements say otherwise.
5. Place each entity marker at a reachable, visible location:
   - lights near ceiling centre but use height `1.1-1.4` so the clickable icon remains visible.
   - climate on or near the thermostat wall.
   - covers on the matching window, blind, shutter, or door opening.
6. Set climate markers to `action: more-info` unless the user specifically asks for one-click toggles.
7. Keep the browser light: prefer fewer than 200 wall segments, fewer than 100 markers per card, and one card per floor for very large homes.
8. Include a `camera.target` centred on the plan bounds and a `camera.position` roughly `[width * 0.9, max(width, depth), depth * 0.9]`.

## Quality checklist

- The YAML parses and uses only `lights`, `climate`, and `covers` layers.
- Every marker `entity` is a real Home Assistant `domain.object_id`.
- Every floor has an `outline` with clockwise or counter-clockwise points.
- Every marker position lies inside or close to a room polygon.
- The plan avoids Sweet Home 3D assets; geometry is generated directly as HA3D JSON/YAML.

## Prompt template

Paste this into Claude, Copilot Chat, ChatGPT, or another assistant alongside photos/sketches and entity IDs:

```text
You are using the HA3D Floorplan Generator Skill. Generate a Lovelace YAML plan for `custom:ha3d-floorplan-card` from the attached photos/sketches. Use meters, simple Three.js-friendly geometry, and only the layers `lights`, `climate`, and `covers`. Place clickable markers for these Home Assistant entities: <paste entities>. Ask for missing scale measurements only if the result would otherwise be unusable. Return valid YAML only.
```
