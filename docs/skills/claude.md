# Install HA3D skill in Claude

Use a reusable Claude Project so the prompt is always available.

## Quick install

1. Open Claude and create a new **Project** called `HA3D`.
2. In **Project instructions**, paste the full prompt from `/tmp/workspace/politician/ha3d/docs/ai_skill_prompt.md`.
3. Add `/tmp/workspace/politician/ha3d/custom_components/ha3d/plan_schema.json` as a reference file (or paste key schema rules in project knowledge).
4. Save project settings.

## How to use

In the HA3D project chat, upload photos and send:

`Generate HA3D v1.0 JSON only from these photos, dimensions, and entity IDs.`
