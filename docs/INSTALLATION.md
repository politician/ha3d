# Installation

## HACS custom repository

1. Build or download `dist/ha3d-floorplan-card.js` from a release.
2. In Home Assistant, open **HACS → Frontend → ⋮ → Custom repositories**.
3. Add this repository URL and choose **Dashboard** as the category.
4. Install **HA3D Floorplan Card**.
5. Refresh the browser. HACS serves the file from `/hacsfiles/ha3d-floorplan-card/ha3d-floorplan-card.js`.
6. Add a manual Lovelace card using `type: custom:ha3d-floorplan-card`.

## Manual installation

1. Copy `dist/ha3d-floorplan-card.js` to `/config/www/ha3d-floorplan-card.js`.
2. Add a dashboard resource:

```yaml
url: /local/ha3d-floorplan-card.js
type: module
```

3. Add the card YAML from `examples/demo-card.yaml` and replace the demo entities.

## Connecting the AI skill to the card

1. Copy `skills/ha3d-floorplan-generator/SKILL.md` into your assistant workspace:
   - Claude Projects: add it as project knowledge or a custom instruction.
   - GitHub Copilot Chat: add it to your repository docs and reference it in chat.
   - ChatGPT: paste it into a project instruction or a custom GPT knowledge file.
2. Give the assistant room photos/sketches, a few measurements, and your `light.*`, `climate.*`, and `cover.*` entity IDs.
3. Ask it to produce Lovelace YAML for `custom:ha3d-floorplan-card`.
4. Paste the generated YAML into a Home Assistant dashboard manual card.
5. Iterate: ask the assistant to adjust coordinates, walls, rooms, and marker locations based on screenshots.
